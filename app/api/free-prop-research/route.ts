import { NextResponse } from "next/server";

type ResearchPayload = {
  player?: string;
  market?: string;
  side?: string;
  awayTeam?: string;
  homeTeam?: string;
  league?: string;
};

type MlbPerson = {
  id?: number;
  fullName?: string;
  primaryPosition?: { abbreviation?: string };
  currentTeam?: { name?: string };
};

type MlbStatSplit = {
  date?: string;
  opponent?: { name?: string };
  stat?: Record<string, string | number>;
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as ResearchPayload;
  const league = clean(payload.league).toUpperCase();

  if (!league.includes("MLB")) {
    return NextResponse.json({
      status: "limited",
      summary: genericSummary(payload),
      findings: [
        "Free automated stat lookup is currently strongest for MLB player props.",
        "Use the Google shortcuts for injuries, weather, lineups, splits, and matchup-specific notes."
      ]
    });
  }

  try {
    const research = await buildMlbResearch(payload);
    return NextResponse.json(research);
  } catch (error) {
    return NextResponse.json({
      status: "limited",
      summary: genericSummary(payload),
      findings: [
        error instanceof Error ? error.message : "Free MLB stat lookup could not complete.",
        "Use the Google shortcuts for matchup-specific verification before trusting this prop."
      ]
    });
  }
}

async function buildMlbResearch(payload: ResearchPayload) {
  const player = clean(payload.player);
  const market = clean(payload.market, "prop");
  const side = clean(payload.side);

  if (!player) {
    throw new Error("No player name was provided for research.");
  }

  const person = await searchMlbPlayer(player);

  if (!person?.id) {
    throw new Error(`Could not match ${player} to a free MLB player profile.`);
  }

  const season = new Date().getFullYear();
  const [seasonStats, gameLog] = await Promise.all([
    fetchMlbStats(person.id, "season", season),
    fetchMlbStats(person.id, "gameLog", season)
  ]);
  const seasonLine = summarizeSeason(seasonStats[0]);
  const recentLine = summarizeRecent(gameLog.slice(0, 5));
  const position = person.primaryPosition?.abbreviation ? ` ${person.primaryPosition.abbreviation}` : "";
  const team = person.currentTeam?.name ? `, ${person.currentTeam.name}` : "";
  const pick = `${person.fullName ?? player}${position}${team} - ${market}${side && side !== "Listed side" ? ` ${side}` : ""}`;
  const findings = [
    seasonLine,
    recentLine,
    "Pitcher handedness, batter-vs-pitcher history, weather, umpire, and confirmed lineup still need shortcut verification."
  ].filter(Boolean);

  return {
    status: "ready",
    summary: `${pick}. Free MLB data gives this prop a real baseline: ${findings.slice(0, 2).join(" ")} Use the Google shortcuts to verify matchup-specific factors before locking it in.`,
    findings
  };
}

async function searchMlbPlayer(name: string): Promise<MlbPerson | null> {
  const params = new URLSearchParams({ names: name });
  const response = await fetch(`https://statsapi.mlb.com/api/v1/people/search?${params.toString()}`, {
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`MLB player search failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { people?: MlbPerson[] };
  return payload.people?.[0] ?? null;
}

async function fetchMlbStats(playerId: number, stats: "season" | "gameLog", season: number): Promise<MlbStatSplit[]> {
  const params = new URLSearchParams({
    stats,
    group: "hitting",
    season: String(season)
  });
  const response = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}/stats?${params.toString()}`, {
    next: { revalidate: 3600 }
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as { stats?: Array<{ splits?: MlbStatSplit[] }> };
  return payload.stats?.[0]?.splits ?? [];
}

function summarizeSeason(split?: MlbStatSplit) {
  const stat = split?.stat;
  if (!stat) return "";

  const avg = stat.avg ? `AVG ${stat.avg}` : "";
  const obp = stat.obp ? `OBP ${stat.obp}` : "";
  const slg = stat.slg ? `SLG ${stat.slg}` : "";
  const hr = stat.homeRuns ? `${stat.homeRuns} HR` : "";
  const rbi = stat.rbi ? `${stat.rbi} RBI` : "";
  const runs = stat.runs ? `${stat.runs} runs` : "";
  const pieces = [avg, obp, slg, hr, rbi, runs].filter(Boolean);

  return pieces.length > 0 ? `Season form: ${pieces.join(", ")}.` : "";
}

function summarizeRecent(splits: MlbStatSplit[]) {
  if (splits.length === 0) return "";

  const totals = splits.reduce(
    (acc, split) => {
      const stat = split.stat ?? {};
      acc.hits += Number(stat.hits ?? 0);
      acc.atBats += Number(stat.atBats ?? 0);
      acc.runs += Number(stat.runs ?? 0);
      acc.rbi += Number(stat.rbi ?? 0);
      acc.homeRuns += Number(stat.homeRuns ?? 0);
      return acc;
    },
    { hits: 0, atBats: 0, runs: 0, rbi: 0, homeRuns: 0 }
  );
  const avg = totals.atBats > 0 ? (totals.hits / totals.atBats).toFixed(3).replace(/^0/, "") : "N/A";

  return `Recent form: ${totals.hits}-for-${totals.atBats} over the latest ${splits.length} logged games, AVG ${avg}, ${totals.runs} runs, ${totals.rbi} RBI, ${totals.homeRuns} HR.`;
}

function genericSummary(payload: ResearchPayload) {
  const player = clean(payload.player, "This prop");
  const market = clean(payload.market, "market");
  const side = clean(payload.side);
  const matchup = [clean(payload.awayTeam), clean(payload.homeTeam)].filter(Boolean).join(" at ");

  return `${player} ${market}${side && side !== "Listed side" ? ` ${side}` : ""}. This card has live odds data, but automated free stat research is limited for ${clean(payload.league, "this league")}. Use the Google shortcuts to verify injuries, weather, lineup, recent form, and matchup factors${matchup ? ` for ${matchup}` : ""}.`;
}

function clean(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
