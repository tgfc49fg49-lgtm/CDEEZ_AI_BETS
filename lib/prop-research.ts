import type { GameOdds, PlayerProp } from "@/lib/types";

export type PropResearchSignal = {
  label: string;
  status: "verified" | "research" | "pending";
  score: number;
  summary: string;
  query: string;
};

export function buildPropResearchSignals({
  prop,
  game,
  market,
  side,
  line
}: {
  prop: PlayerProp;
  game: GameOdds;
  market: string;
  side: string;
  line: string;
}): PropResearchSignal[] {
  const player = prop.player;
  const matchup = `${game.awayTeam} at ${game.homeTeam}`;
  const pick = `${player} ${market} ${side} ${line}`.replace(/\s+/g, " ").trim();

  return [
    {
      label: "Market price",
      status: "verified",
      score: Math.min(95, Math.max(45, Math.round(prop.confidence + prop.edge * 2))),
      summary: `${prop.sportsbook} is offering a real listed price at ${formatSigned(prop.odds)} with a ${formatSigned(prop.edge)}% model edge.`,
      query: `${pick} odds ${prop.sportsbook} ${matchup}`
    },
    {
      label: "Historical trend",
      status: "research",
      score: 50,
      summary: "Needs player game-log trend data before upgrading this from a market lean to a statistical projection.",
      query: `${player} ${market} game log trend last 10 games ${game.league}`
    },
    {
      label: "Injury and lineup",
      status: "research",
      score: 50,
      summary: "Needs confirmed injury, starting lineup, minutes, usage, or batting-order context before final confidence is raised.",
      query: `${matchup} injury report lineup ${player} today`
    },
    {
      label: "Smart money",
      status: "pending",
      score: 40,
      summary: "Needs handle, ticket split, or line-movement feed before labeling this as sharp-supported.",
      query: `${pick} line movement public betting handle smart money`
    }
  ];
}

export function propResearchRead(signals: PropResearchSignal[]) {
  const verified = signals.filter((signal) => signal.status === "verified").length;
  const research = signals.filter((signal) => signal.status === "research").length;

  return `${verified} layer is verified from the live odds feed. ${research} research layers are queued for historical trends, injuries, lineup context, and smart-money movement before this should be treated as a full statistical projection.`;
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}
