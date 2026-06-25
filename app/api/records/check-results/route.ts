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

  if (!score.completed) {
    return {
      id: pick.id,
      status: "pending",
      result: "Game has not gone final yet.",
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
    result: `${pick.awayTeam} ${awayScore}, ${pick.homeTeam} ${homeScore}`,
    verificationUrl
  };
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
