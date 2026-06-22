import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Newspaper, ShieldAlert, Stethoscope } from "lucide-react";
import { OddsTable } from "@/components/odds-table";
import { GooglePropResearch } from "@/components/google-prop-research";
import { PageHeader } from "@/components/page-header";
import { AiExplanationDrawer, ConfidenceRing, LineMovementPanel, OpportunityBadge, TeamBadge } from "@/components/premium-signals";
import { filteredLines, playerPropPredictions } from "@/lib/analytics";
import { formatDateTime, formatOdds } from "@/lib/format";
import { cleanEntityLabel } from "@/lib/labels";
import { gameOpportunityScore, propOpportunityScore, projectionForProp } from "@/lib/opportunity";
import { getOdds } from "@/lib/sports-game-odds";

export const dynamic = "force-dynamic";

export default async function MatchupDetailPage({ params }: { params: { gameId: string } }) {
  const { games } = await getOdds();
  const game = games.find((item) => item.id === params.gameId);

  if (!game) notFound();

  const props = playerPropPredictions([game], 80);
  const lines = filteredLines(game);
  const primaryLine = lines[0];
  const gameScore = gameOpportunityScore({
    game,
    odds: game.prediction.pick.includes(game.homeTeam) ? primaryLine?.homeMoneyline ?? 0 : primaryLine?.awayMoneyline ?? 0,
    confidence: game.prediction.confidence
  });

  return (
    <>
      <Link href="/sportsbook" className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ChevronLeft size={16} />
        Back to sportsbook
      </Link>

      <PageHeader
        eyebrow={game.league}
        title={`${game.awayTeam} at ${game.homeTeam}`}
        description={`${formatDateTime(game.startsAt)} · ${game.status === "live" ? "Live scoring available from feed status" : game.venue}`}
      />

      <nav className="mb-5 flex gap-2 overflow-x-auto pb-2">
        {["Overview", "Predictions", "Player Props", "Parlays", "Line Movement", "Injuries", "News", "Weather", "Market Consensus"].map((item) => (
          <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} className="min-w-max rounded-lg bg-field-900 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white">
            {item}
          </a>
        ))}
      </nav>

      <section id="overview" className="mb-6 rounded-lg border border-green-400/25 bg-field-900/85 p-5 shadow-glow">
        <div className="grid gap-5 lg:grid-cols-[1fr_260px_220px]">
          <div className="grid gap-4 md:grid-cols-2">
            <TeamBadge name={game.awayTeam} sport={game.league} />
            <TeamBadge name={game.homeTeam} sport={game.league} />
          </div>
          <OpportunityBadge score={gameScore} />
          <div className="rounded-lg bg-black/25 p-4">
            <ConfidenceRing value={game.prediction.confidence} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <LineField label="AI Prediction" value={game.prediction.pick} accent />
          <LineField label="Expected ROI" value={`+${Math.max(1, game.prediction.edge * 1.4).toFixed(1)}%`} accent />
          <LineField label="Best Available Odds" value={primaryLine ? `${primaryLine.sportsbook}` : "N/A"} />
          <LineField label="Market Status" value={game.status === "live" ? "Live" : "Pregame"} />
        </div>
      </section>

      <section id="predictions" className="grid gap-4 lg:grid-cols-3">
        <InfoCard icon={Newspaper} title="Matchup preview" text={`${game.prediction.modelNote} Current AI lean is ${game.prediction.pick} with ${game.prediction.confidence}% confidence.`} />
        <InfoCard icon={Stethoscope} title="Injury report" text="Injury feed is ready to connect. Until then, use this panel for verified player availability notes before locking picks." />
        <InfoCard icon={ShieldAlert} title="News watch" text="News article ingestion is planned for the next API connection. This area will summarize matchup news and late movement." />
      </section>

      <section className="mt-6">
        <AiExplanationDrawer
          combinedEdge={game.prediction.edge}
          factors={[
            { label: "Model Confidence", value: Math.max(3, Math.round(game.prediction.confidence / 10)) },
            { label: "Market Mispricing", value: Math.max(2, Math.round(game.prediction.edge)) },
            { label: "Book Consensus Disagreement", value: Math.min(9, lines.length * 2) },
            { label: "Line Shopping Value", value: Math.min(8, lines.length + 2) }
          ]}
        />
      </section>

      <section id="market-consensus" className="mt-6 rounded-lg border border-line bg-field-900/80 p-5">
        <details>
          <summary className="cursor-pointer text-lg font-bold text-white">
            Main market comparison{" "}
            <span className="text-sm font-medium text-slate-500">({lines.length} books)</span>
          </summary>
          <div className="mt-4">
            <OddsTable games={[{ ...game, lines }]} />
          </div>
        </details>
      </section>

      <section id="line-movement" className="mt-6">
        <LineMovementPanel game={game} lines={lines} />
      </section>

      <section id="player-props" className="mt-6 rounded-lg border border-line bg-field-900/80 p-5">
        <details open>
          <summary className="cursor-pointer text-lg font-bold text-white">
            AI-ranked game, match, fight, and player props{" "}
            <span className="text-sm font-medium text-slate-500">({props.length} real lines)</span>
          </summary>
          <div className="mt-4 grid gap-3">
            {props.length === 0 ? (
              <div className="rounded-lg bg-black/20 p-4 text-slate-400">
                No real prop lines are available for this matchup yet.
              </div>
            ) : props.map((prop, index) => {
              const market = cleanMarket(prop.market);
              const side = formatSide(prop.side);
              const line = formatLineValue(prop.line, market, side);
              const score = propOpportunityScore(prop);
              const projection = projectionForProp(prop);

              return (
                <article key={prop.id} className="rounded-lg border border-line bg-black/20 p-4">
                  <div className="grid gap-4 lg:grid-cols-[48px_minmax(0,1fr)_360px]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-sm font-black text-accent">
                      #{index + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-accent">
                          {formatCategory(prop.category)}
                        </span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                          {prop.sportsbook}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-black text-white">{prop.player}</h3>
                      <p className="mt-1 text-sm text-slate-500">{formatTeamLabel(prop.team)}</p>

                      <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.03] p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Market</p>
                        <p className="mt-1 text-sm font-bold text-white">{market}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {side} {line ? `· ${line}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <LineField label="Opportunity Score" value={`${score}`} accent />
                      <LineField label="Odds" value={formatOdds(prop.odds)} accent />
                      <LineField label="Line" value={line || "Listed market"} />
                      <LineField label="Projection" value={projection.projection ? `${projection.projection} (${projection.difference > 0 ? "+" : ""}${projection.difference})` : "Needs stat feed"} />
                      <LineField label="Lean confidence" value={`${prop.confidence}%`} />
                      <LineField label="Market edge" value={`+${prop.edge}%`} accent />
                    </div>
                  </div>

                  <div className="mt-4 border-t border-line pt-4">
                    <div className="rounded-lg border border-accent/20 bg-accent/10 p-4">
                      <p className="text-sm font-bold text-white">Market Lean Breakdown</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {buildPropRead({
                          player: prop.player,
                          market,
                          side,
                          line,
                          sportsbook: prop.sportsbook,
                          odds: prop.odds,
                          confidence: prop.confidence,
                          edge: prop.edge,
                          awayTeam: game.awayTeam,
                          homeTeam: game.homeTeam
                        })}
                      </p>
                      <div className="mt-4 grid gap-2 md:grid-cols-3">
                        <LineField label="Market Edge" value={`+${prop.edge}%`} accent />
                        <LineField label="Expected ROI" value={`+${Math.max(1, prop.edge * 1.3).toFixed(1)}%`} accent />
                        <LineField label="Opportunity Score" value={`${score}`} accent />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <ResearchStatus label="Verified" value="Live book, odds, market, line, selected side" />
                      <ResearchStatus label="Free research" value="Opens targeted Google searches in a new tab" />
                      <ResearchStatus label="Source rule" value="Verify stats from linked results before trusting them" />
                    </div>

                    <GooglePropResearch
                      payload={{
                        player: prop.player,
                        market,
                        side,
                        awayTeam: game.awayTeam,
                        homeTeam: game.homeTeam,
                        league: game.league
                      }}
                    />

                    <p className="mt-3 text-sm leading-6 text-slate-400">{cleanEvidence(prop.evidence)}</p>
                    {prop.researchFactors && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {prop.researchFactors.slice(0, 4).map((factor) => (
                          <span key={factor} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-500">
                            {factor}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </details>
      </section>
    </>
  );
}

function cleanMarket(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/Over\/Under over/i, "Over")
    .replace(/Over\/Under under/i, "Under")
    .replace(/\bml\b/i, "Moneyline")
    .replace(/\bou\b/i, "Over/Under")
    .replace(/\bsp\b/i, "Spread")
    .trim();
}

function formatSide(value?: string) {
  if (!value) return "Listed side";

  return value
    .replace(/[-_]/g, " ")
    .replace(/\bml\b/i, "Moneyline")
    .replace(/\bou\b/i, "Over/Under")
    .replace(/\bsp\b/i, "Spread")
    .replace(/\bover\b/i, "Over")
    .replace(/\bunder\b/i, "Under")
    .trim();
}

function formatLineValue(value: number, market = "", side = "") {
  if (value !== 0) return String(value);

  const text = `${market} ${side}`.toLowerCase();

  if (text.includes("moneyline") || text.includes("winner")) return "Winner market";
  if (text.includes("yes") || text.includes("no")) return "Yes/No market";
  if (text.includes("spread")) return "Pick'em";
  if (text.includes("over") || text.includes("under")) return "Listed total";

  return "Listed market";
}

function formatTeamLabel(value: string) {
  return cleanEntityLabel(value, "Event market");
}

function formatCategory(value?: string) {
  if (!value) return "Prop";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function cleanEvidence(value: string) {
  return value.replace("Real preferred-book", "Real").replace("prop.", "market.");
}

function buildPropRead({
  player,
  market,
  side,
  line,
  sportsbook,
  odds,
  confidence,
  edge,
  awayTeam,
  homeTeam
}: {
  player: string;
  market: string;
  side: string;
  line: string;
  sportsbook: string;
  odds: number;
  confidence: number;
  edge: number;
  awayTeam: string;
  homeTeam: string;
}) {
  const pickText = formatPickText(player, market, side, line);
  const strength =
    confidence >= 72
      ? "strong"
      : confidence >= 62
        ? "solid"
        : "lean";
  const edgeText =
    edge >= 7
      ? "meaningful market edge"
      : edge >= 4
        ? "moderate market edge"
        : "thin but playable market edge";

  return `${pickText}. Current market lean: ${formatDecision(side)}. The live ${sportsbook} number is pricing this as a ${strength} value fit at ${formatOdds(odds)}, with ${confidence}% lean confidence and a +${edge}% ${edgeText}. This is based on the real listed market for ${awayTeam} at ${homeTeam}, the available preferred-book price, and the rule that only one side of the same player market can be recommended.`;
}

function formatPickText(player: string, market: string, side: string, line: string) {
  const sideText = side && side !== "Listed side" ? side : "";
  const lineText = line && !["Listed market", "Winner market"].includes(line) ? ` ${line}` : "";

  return `${player} ${market}${lineText}${sideText ? ` - ${sideText}` : ""}`;
}

function formatDecision(side: string) {
  if (!side || side === "Listed side") return "this side";
  return side.toLowerCase();
}

function LineField({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-bold ${accent ? "text-accent" : "text-white"}`}>{value}</p>
    </div>
  );
}

function ResearchStatus({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-300">{value}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text
}: {
  icon: typeof Newspaper;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-field-900/80 p-5">
      <Icon className="text-accent" />
      <h2 className="mt-3 font-bold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
