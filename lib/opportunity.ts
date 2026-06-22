import type { GameOdds, PlayerProp } from "@/lib/types";

function impliedProbability(odds: number) {
  if (odds === 0) return 0;
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
}

export function marketProbabilityFromOddsValue(odds: number) {
  return Number((impliedProbability(odds) * 100).toFixed(1));
}

export function expectedValueFromOddsValue(aiProbability: number, odds: number) {
  if (odds === 0) return 0;
  const decimalOdds = odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
  const ev = aiProbability / 100 * decimalOdds - 1;
  return Number((ev * 100).toFixed(1));
}

export function edgeFromMarketValue(aiProbability: number, odds: number) {
  return Number((aiProbability - marketProbabilityFromOddsValue(odds)).toFixed(1));
}

export function opportunityGrade(score: number) {
  if (score >= 95) return { label: "Elite Opportunity", grade: "A+", tone: "text-green-300", border: "border-green-400/40", bg: "bg-green-400/10" };
  if (score >= 90) return { label: "Strong Opportunity", grade: "A", tone: "text-green-400", border: "border-green-400/30", bg: "bg-green-400/10" };
  if (score >= 80) return { label: "Playable", grade: "B+", tone: "text-amber-300", border: "border-amber-400/30", bg: "bg-amber-400/10" };
  return { label: "Pass", grade: "C", tone: "text-slate-400", border: "border-slate-500/30", bg: "bg-white/5" };
}

export function gameOpportunityScore({
  game,
  odds,
  confidence
}: {
  game: GameOdds;
  odds: number;
  confidence: number;
}) {
  const edge = Math.max(0, edgeFromMarketValue(confidence, odds));
  const ev = Math.max(0, expectedValueFromOddsValue(confidence, odds));
  const lines = game.lines;
  const consensusDisagreement = Math.min(10, Math.max(0, lines.length - 1) * 1.8);
  const marketDepth = Math.min(8, lines.length * 1.2);
  const confidenceScore = Math.max(0, confidence - 50) * 0.62;

  return Math.max(
    1,
    Math.min(
      99,
      Math.round(46 + confidenceScore + edge * 2.1 + ev * 0.65 + consensusDisagreement + marketDepth)
    )
  );
}

export function propOpportunityScore(prop: PlayerProp) {
  return Math.max(
    1,
    Math.min(99, Math.round(45 + Math.max(0, prop.confidence - 50) * 0.68 + prop.edge * 2.4))
  );
}

export function projectionForProp(prop: PlayerProp) {
  if (prop.evidence.toLowerCase().includes("market-only")) {
    return {
      projection: 0,
      difference: 0
    };
  }

  const direction = (prop.side ?? prop.market).toLowerCase().includes("under") ? -1 : 1;
  const difference = prop.line === 0 ? 0 : Number((direction * Math.max(0.05, prop.edge / 100) * prop.line).toFixed(2));
  const projection = prop.line === 0 ? 0 : Number((prop.line + difference).toFixed(2));

  return {
    projection,
    difference
  };
}

export function marketSnapshot(odds: number) {
  return {
    marketProbability: marketProbabilityFromOddsValue(odds),
    expectedValue: 0
  };
}
