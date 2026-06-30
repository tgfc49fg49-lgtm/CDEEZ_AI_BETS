import { NextResponse } from "next/server";
import { getScoresForSport } from "@/lib/sports-game-odds";

export const dynamic = "force-dynamic";

type RecordPickPayload = {
  id: string;
  gameId: string;
  sportKey?: string;
  pick: string;
  market: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
};

type ScoreGame = Awaited<ReturnType<typeof getScoresForSport>>[number];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { picks?: RecordPickPayload[] };
  const picks = body.picks ?? [];
  const sportKeys = Array.from(new Set(picks.map((pick) => pick.sportKey).filter((key): key is string => Boolean(key))));
  const scoreGroups = await Promise.all(
    sportKeys.map(async (sportKey) => ({
      sportKey,
      scores: await getScoresForSport(sportKey)
    }))
  );
  const scoresBySport = new Map(scoreGroups.map((group) => [group.sportKey, group.scores]));
  const grades = picks.map((pick) => gradePick(pick, scoresBySport.get(pick.sportKey ?? "") ?? []));

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    schedule: {
      picksSubmittedBy: "08:00",
      resultsSubmittedBy: "24:00"
    },
    grades
  });
}

function gradePick(pick: RecordPickPayload, scores: ScoreGame[]) {
  const score = scores.find((item) => item.id === pick.gameId) ?? findScoreByTeams(pick, scores);
  const verificationUrl = googleSearchUrl(`${pick.awayTeam} ${pick.homeTeam} final score ${dateLabel(pick.startsAt)}`);

  if (!score) {
    return {
      id: pick.id,
      status: "pending",
      result: "Score not available yet.",
      verificationUrl
    };
  }

  const awayScore = teamScore(score, pick.awayTeam);
  const homeScore = teamScore(score, pick.homeTeam);

  if (awayScore === null || homeScore === null) {
    return {
      id: pick.id,
      status: "pending",
      result: "Final score returned without both teams.",
      verificationUrl
    };
  }

  if (!score.completed && !isLikelyFinal(score, pick)) {
    return {
      id: pick.id,
      status: "pending",
      result: `Score found, not final yet: ${pick.awayTeam} ${awayScore}, ${pick.homeTeam} ${homeScore}`,
      verificationUrl
    };
  }

  const pickedTeam = pick.pick.toLowerCase().includes(pick.homeTeam.toLowerCase())
    ? "home"
    : pick.pick.toLowerCase().includes(pick.awayTeam.toLowerCase())
      ? "away"
      : null;

  if (!pickedTeam) {
    return {
      id: pick.id,
      status: "pending",
      result: "Only moneyline picks can be auto-graded right now.",
      verificationUrl
    };
  }

  const isPush = awayScore === homeScore;
  const won = pickedTeam === "home" ? homeScore > awayScore : awayScore > homeScore;

  return {
    id: pick.id,
    status: isPush ? "push" : won ? "won" : "lost",
    result: `${score.completed ? "Final" : "Likely final"}: ${pick.awayTeam} ${awayScore}, ${pick.homeTeam} ${homeScore}`,
    verificationUrl
  };
}

function isLikelyFinal(score: ScoreGame, pick: RecordPickPayload) {
  const start = new Date(score.commence_time || pick.startsAt).getTime();
  if (!Number.isFinite(start)) return false;

  return Date.now() - start >= likelyGameDurationMs(pick.sportKey ?? score.sport_key);
}

function likelyGameDurationMs(sportKey: string) {
  const key = sportKey.toLowerCase();
  if (key.includes("baseball")) return 5.5 * 60 * 60 * 1000;
  if (key.includes("americanfootball")) return 5 * 60 * 60 * 1000;
  if (key.includes("basketball")) return 3 * 60 * 60 * 1000;
  if (key.includes("icehockey")) return 3.5 * 60 * 60 * 1000;
  if (key.includes("soccer")) return 2.75 * 60 * 60 * 1000;
  if (key.includes("mma") || key.includes("boxing")) return 8 * 60 * 60 * 1000;
  if (key.includes("tennis")) return 5 * 60 * 60 * 1000;

  return 6 * 60 * 60 * 1000;
}

function findScoreByTeams(pick: RecordPickPayload, scores: ScoreGame[]) {
  return scores.find(
    (score) =>
      score.home_team.toLowerCase() === pick.homeTeam.toLowerCase() &&
      score.away_team.toLowerCase() === pick.awayTeam.toLowerCase()
  );
}

function teamScore(score: ScoreGame, team: string) {
  const item = score.scores?.find((entry) => entry.name.toLowerCase() === team.toLowerCase());
  if (!item) return null;
  const value = Number(item.score);

  return Number.isFinite(value) ? value : null;
}

function googleSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
