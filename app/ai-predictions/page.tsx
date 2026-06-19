import { BrainCircuit, CheckCircle2 } from "lucide-react";
import { playerPropPredictions, topGamePicks } from "@/lib/analytics";
import { formatOdds } from "@/lib/format";
import { getOdds } from "@/lib/sports-game-odds";

export const dynamic = "force-dynamic";

export default async function AiPredictionsPage() {
  const { games } = await getOdds();
  const gamePicks = topGamePicks(games, 10);
  const propPicks = playerPropPredictions(games, 10);
  const leagues = ["All Sports", ...Array.from(new Set(games.map((game) => game.league))).slice(0, 6)];
  const modelPicks = gamePicks.slice(0, 5);

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

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <div className="overflow-hidden rounded-lg border border-line bg-field-900/80">
          <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-4 border-b border-line px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            <span>Matchup</span>
            <span>Pick</span>
            <span>Confidence</span>
            <span>Edge</span>
            <span>Odds</span>
            <span>AI Score</span>
          </div>

          {gamePicks.length === 0 ? (
            <div className="p-5 text-slate-400">No real AI game predictions are available right now.</div>
          ) : (
            gamePicks.map((pick) => (
              <div
                key={pick.id}
                className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-4 border-b border-line/70 px-4 py-4 text-sm last:border-b-0"
              >
                <span className="text-white">{pick.game.awayTeam} vs {pick.game.homeTeam}</span>
                <span className="font-bold text-white">{pick.pick.replace(" ML", "")}</span>
                <span className="text-slate-300">{pick.confidence}%</span>
                <span className="font-bold text-green-400">+{pick.edge}%</span>
                <span className="text-white">{formatOdds(pick.odds)}</span>
                <span className="font-bold text-green-400">{Math.min(99, Math.round(pick.confidence + pick.edge))}</span>
              </div>
            ))
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
