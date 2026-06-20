import { BrainCircuit, CheckCircle2, Zap } from "lucide-react";
import {
  edgeFromMarket,
  expectedValueFromOdds,
  marketProbabilityFromOdds,
  modelUpdateForPick,
  playerPropPredictions,
  sportsbookComparisonForPick,
  topGamePicks,
  whyWeLikeBet
} from "@/lib/analytics";
import { formatOdds } from "@/lib/format";
import { getOdds } from "@/lib/sports-game-odds";
import type { GameOdds } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AiPredictionsPage() {
  const { games } = await getOdds();
  const gamePicks = topGamePicks(games, 10);
  const propPicks = playerPropPredictions(games, 10);
  const leagues = ["All Sports", ...Array.from(new Set(games.map((game) => game.league))).slice(0, 6)];
  const modelPicks = gamePicks.slice(0, 5);
  const topPick = gamePicks[0];

  return (
    <>
      <section>
        <h1 className="text-3xl font-black text-white md:text-4xl">AI Predictions</h1>
        <p className="mt-2 text-sm text-slate-400">
          Our models analyze live market data to predict outcomes and find value. Analytics only.
        </p>
      </section>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {leagues.map((league, index) => (
          <button
            key={league}
            type="button"
            className={`min-w-max rounded-lg px-4 py-2 text-sm font-black ${
              index === 0 ? "bg-green-500 text-field-950" : "bg-field-900 text-slate-300"
            }`}
          >
            {league}
          </button>
        ))}
      </div>

      {topPick && (
        <section className="mt-5 rounded-lg border border-green-400/30 bg-gradient-to-br from-green-400/15 via-field-900/90 to-field-950 p-5 shadow-glow">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-green-400">
            <Zap size={17} />
            Today&apos;s top play
          </div>
          <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h2 className="text-3xl font-black text-white">{topPick.pick}</h2>
              <p className="mt-2 text-sm text-slate-400">
                {topPick.game.awayTeam} @ {topPick.game.homeTeam}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="AI" value={`${topPick.confidence}%`} />
              <Metric label="Market" value={`${marketProbabilityFromOdds(topPick.odds)}%`} />
              <Metric label="Edge" value={`${edgeFromMarket(topPick.confidence, topPick.odds) >= 0 ? "+" : ""}${edgeFromMarket(topPick.confidence, topPick.odds)}%`} accent />
              <Metric label="Expected ROI" value={`${expectedValueFromOdds(topPick.confidence, topPick.odds) >= 0 ? "+" : ""}${expectedValueFromOdds(topPick.confidence, topPick.odds)}%`} accent />
            </div>
          </div>
        </section>
      )}

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <div className="space-y-4">
          {gamePicks.length === 0 ? (
            <div className="rounded-lg border border-line bg-field-900/80 p-5 text-slate-400">
              No real AI game predictions are available right now.
            </div>
          ) : (
            gamePicks.map((pick) => {
              const edge = edgeFromMarket(pick.confidence, pick.odds);
              const ev = expectedValueFromOdds(pick.confidence, pick.odds);
              const update = modelUpdateForPick(pick.game, pick.confidence);

              return (
                <article key={pick.id} className="rounded-lg border border-line bg-field-900/80 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-green-400">
                        #{pick.rank} best bet
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-white">{pick.pick}</h2>
                      <p className="mt-1 text-sm text-slate-400">{pick.game.awayTeam} @ {pick.game.homeTeam}</p>
                    </div>
                    <div className="rounded-lg border border-green-400/30 bg-green-400/10 px-4 py-3 text-right">
                      <p className="text-3xl font-black text-green-400">{pick.confidence}%</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">AI probability</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    <Metric label="Market probability" value={`${marketProbabilityFromOdds(pick.odds)}%`} />
                    <Metric label="Model edge" value={`${edge >= 0 ? "+" : ""}${edge}%`} accent />
                    <Metric label="Expected value" value={`${ev >= 0 ? "+" : ""}${ev}%`} accent />
                    <Metric label="Best odds" value={`${formatOdds(pick.odds)} ${pick.sportsbook}`} />
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Why we like this bet</p>
                      <WhyList items={whyWeLikeBet(pick.game, edge)} />
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Live model update</p>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500">Last updated</p>
                          <p className="font-bold text-white">{update.lastUpdated}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Confidence change</p>
                          <p className="font-bold text-green-400">{update.confidenceChange}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">{update.reason}</p>
                    </div>
                  </div>

                  <SportsbookComparisonBar game={pick.game} pick={pick.pick} />
                </article>
              );
            })
          )}
        </div>

        <aside className="rounded-lg border border-line bg-field-900/80 p-5">
          <div className="flex items-center gap-2">
            <BrainCircuit size={18} className="text-green-400" />
            <h2 className="text-lg font-black text-white">Top Model Picks</h2>
          </div>

          <div className="mt-5 space-y-3">
            {modelPicks.length === 0 ? (
              <p className="text-sm text-slate-400">No model picks available.</p>
            ) : (
              modelPicks.map((pick, index) => (
                <div key={pick.id} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-black text-slate-300">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">{pick.pick.replace(" ML", "")}</p>
                      <p className="text-xs text-slate-500">{pick.game.league}</p>
                    </div>
                  </div>
                  <p className="font-bold text-white">{pick.confidence}%</p>
                </div>
              ))
            )}
          </div>

          <button className="mt-5 w-full rounded-lg bg-white/[0.08] px-4 py-3 text-sm font-bold text-white">
            View model insights
          </button>
        </aside>
      </section>

      <section className="mt-5 overflow-hidden rounded-lg border border-line bg-field-900/80">
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-4">
          <div>
            <h2 className="text-xl font-black text-white">Top Player & Prop Predictions</h2>
            <p className="text-sm text-slate-500">Real preferred-book prop lines ranked by model edge.</p>
          </div>
        </div>

        {propPicks.length === 0 ? (
          <div className="p-5 text-slate-400">No real prop predictions are available right now.</div>
        ) : (
          propPicks.map((prop, index) => (
            <div key={prop.id} className="grid gap-4 border-b border-line/70 px-4 py-4 text-sm last:border-b-0 md:grid-cols-[40px_1.4fr_1fr_0.6fr_0.6fr]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 text-xs font-black text-field-950">
                {index + 1}
              </span>
              <span>
                <span className="block font-bold text-white">{prop.player}</span>
                <span className="text-xs text-slate-500">{formatTeam(prop.team)}</span>
              </span>
              <span className="text-slate-300">{cleanMarket(prop.market)} {prop.line !== 0 ? prop.line : ""}</span>
              <span className="font-bold text-green-400">{prop.confidence}%</span>
              <span className="font-bold text-white">{formatOdds(prop.odds)}</span>
            </div>
          ))
        )}
      </section>

      <section className="mt-5 rounded-lg border border-green-400/20 bg-green-400/10 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 text-green-400" size={18} />
          <p className="text-sm leading-6 text-slate-300">
            Every listed prediction is built from real preferred-book lines. Historical research, injury feeds, and smart-money feeds are ready to connect as the next data layer.
          </p>
        </div>
      </section>
    </>
  );
}

function cleanMarket(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/Over\/Under over/i, "Over")
    .replace(/Over\/Under under/i, "Under")
    .trim();
}

function formatTeam(value: string) {
  return value.replaceAll("_", " ").replace(/\bMLB\b|\bNBA\b|\bNFL\b|\bNHL\b|\bWNBA\b/g, "").trim();
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-black/25 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-1 font-bold ${accent ? "text-green-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function WhyList({ items }: { items: string[] }) {
  return (
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <p key={item} className="text-sm text-slate-300">
          <span className="mr-2 text-green-400">✓</span>
          {item}
        </p>
      ))}
    </div>
  );
}

function SportsbookComparisonBar({ game, pick }: { game: GameOdds; pick: string }) {
  const lines = sportsbookComparisonForPick(game, pick);
  const best = lines[0];

  if (lines.length === 0) return null;

  return (
    <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Sportsbook comparison</p>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
          Best: <span className="font-bold text-green-400">{best.sportsbook}</span>
        </p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {lines.map((line) => (
          <div
            key={`${line.sportsbook}-${line.odds}`}
            className={`rounded-lg border px-3 py-2 text-sm ${
              line.sportsbook === best.sportsbook
                ? "border-green-400/40 bg-green-400/10"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <p className="text-slate-400">{line.sportsbook}</p>
            <p className="mt-1 font-black text-white">{formatOdds(line.odds)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
