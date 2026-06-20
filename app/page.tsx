import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Clock,
  Star,
  Target,
  Trophy,
  Zap
} from "lucide-react";
import Link from "next/link";
import { SearchCommand } from "@/components/search-command";
import {
  dailyRecord,
  edgeFromMarket,
  expectedValueFromOdds,
  marketProbabilityFromOdds,
  modelUpdateForPick,
  playerPropPredictions,
  sportsbookComparisonForPick,
  topGamePicks,
  whyWeLikeBet
} from "@/lib/analytics";
import { formatDateTime, formatOdds } from "@/lib/format";
import { getOdds } from "@/lib/sports-game-odds";
import type { GameOdds } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { games, source, diagnostics } = await getOdds();
  const topPicks = topGamePicks(games, 5);
  const props = playerPropPredictions(games, 100);
  const record = dailyRecord();
  const featured = topPicks[0];
  const featuredGame = featured?.game;
  const featuredMarketProbability = featured ? marketProbabilityFromOdds(featured.odds) : 0;
  const featuredEdge = featured ? edgeFromMarket(featured.confidence, featured.odds) : 0;
  const featuredEv = featured ? expectedValueFromOdds(featured.confidence, featured.odds) : 0;
  const featuredUpdate = featuredGame && featured ? modelUpdateForPick(featuredGame, featured.confidence) : null;
  const challenger = featuredGame?.awayTeam ?? "Away";
  const host = featuredGame?.homeTeam ?? "Home";
  const graded = record.wins + record.losses + record.pushes;
  const winRate = graded > 0 ? Math.round((record.wins / graded) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="grid gap-5 xl:grid-cols-[1fr_430px]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-cyan">
            AI prediction dashboard
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl">
            Smarter picks. <span className="bg-gradient-to-r from-cyan to-electric bg-clip-text text-transparent">Powered by AI.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Main-market odds, AI confidence, daily records, and quick team or player lookup in one
            clean command center.
          </p>
        </div>

        <div className="flex items-start gap-3 xl:justify-end">
          <div className="min-w-48 rounded-lg border border-line bg-field-900/80 px-4 py-3">
            <p className="text-xs text-slate-500">Feed</p>
            <p className="mt-1 font-semibold uppercase text-white">{source} odds</p>
          </div>
          <div className="min-w-48 rounded-lg border border-line bg-field-900/80 px-4 py-3">
            <p className="text-xs text-slate-500">All sports</p>
            <p className="mt-1 font-semibold text-white">NBA · WNBA · MLB · NFL · PGA · NASCAR · F1</p>
          </div>
        </div>
      </header>

      <SearchCommand games={games} props={props} />

      {games.length === 0 && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100">
          No real sportsbook lines are available from the API right now. The app will stay empty
          instead of showing fake lines.
          {diagnostics?.reason && <span className="mt-2 block text-sm">{diagnostics.reason}</span>}
        </div>
      )}

      {featuredGame && (
      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-line bg-field-900/75 p-5 shadow-blueglow">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan">
            <Star size={16} />
            Featured match
          </div>

          <div className="mt-6 grid items-center gap-5 md:grid-cols-[1fr_130px_1fr]">
            <TeamBlock align="left" team={challenger} label="Away" />
            <div className="rounded-lg bg-white/5 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-white">{formatDateTime(featuredGame.startsAt)}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{featuredGame.league}</p>
              <p className="mt-4 text-2xl font-black text-slate-300">VS</p>
            </div>
            <TeamBlock align="right" team={host} label="Home" />
          </div>

          <div className="mt-6 rounded-lg border border-line bg-black/25 p-4">
            <div className="grid items-center gap-4 md:grid-cols-[1fr_120px_1fr]">
              <WinMeter label={`${challenger} win probability`} value={featured?.confidence ?? 58} tone="green" />
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-electric/50 bg-electric/10 text-cyan">
                  <BrainCircuit size={25} />
                </div>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-300">
                  AI Prediction
                </p>
              </div>
              <WinMeter
                label={`${host} win probability`}
                value={Math.max(12, 100 - (featured?.confidence ?? 58))}
                tone="blue"
              />
            </div>
            <p className="mt-4 text-center text-xs uppercase tracking-[0.22em] text-slate-500">
              AI confidence: <span className="text-accent">{confidenceLabel(featured?.confidence ?? 58)}</span>
            </p>
          </div>
        </div>

        <aside className="rounded-lg border border-accent/40 bg-gradient-to-b from-accent/15 to-field-900/85 p-5 shadow-glow">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan">
            <Zap size={16} />
            Today&apos;s top play
          </div>
          <div className="mt-8">
            <p className="text-2xl font-black text-white">{featured?.pick ?? "Market lean pending"}</p>
            <p className="mt-2 text-sm uppercase tracking-[0.18em] text-slate-400">
              {challenger} @ {host}
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <MiniMetric label="AI probability" value={`${featured?.confidence ?? 0}%`} />
            <MiniMetric label="Market probability" value={`${featuredMarketProbability}%`} />
            <MiniMetric label="Edge" value={`${featuredEdge >= 0 ? "+" : ""}${featuredEdge}%`} accent />
            <MiniMetric label="Expected ROI" value={`${featuredEv >= 0 ? "+" : ""}${featuredEv}%`} accent />
          </div>

          {featuredGame && featured && (
            <>
              <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Why we like this bet</p>
                <WhyList items={whyWeLikeBet(featuredGame, featuredEdge)} />
              </div>
              <SportsbookComparisonBar game={featuredGame} pick={featured.pick} />
              {featuredUpdate && <LiveModelUpdate update={featuredUpdate} />}
            </>
          )}

          <Link
            href={featuredGame ? `/sportsbook/${featuredGame.id}` : "/sportsbook"}
            className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
          >
            View full analysis
            <ArrowRight size={16} />
          </Link>
        </aside>
      </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-line bg-field-900/75">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="font-bold text-white">AI top 5 picks of the day</h2>
              <p className="mt-1 text-sm text-slate-500">Submitted by 8:00 AM, graded by midnight.</p>
            </div>
            <Link href="/ai-predictions" className="text-sm font-semibold text-cyan hover:text-white">
              View all predictions
            </Link>
          </div>

          <div className="divide-y divide-line">
            {topPicks.length === 0 ? (
              <div className="px-5 py-8 text-slate-400">No real top picks available yet.</div>
            ) : (
            topPicks.map((pick) => {
              const marketProbability = marketProbabilityFromOdds(pick.odds);
              const marketEdge = edgeFromMarket(pick.confidence, pick.odds);
              const ev = expectedValueFromOdds(pick.confidence, pick.odds);

              return (
              <div
                key={pick.id}
                className="grid gap-4 px-5 py-4 md:grid-cols-[1.25fr_1.2fr_0.9fr_0.9fr_40px] md:items-center"
              >
                <div>
                  <p className="font-semibold text-white">{pick.game.awayTeam} @ {pick.game.homeTeam}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatDateTime(pick.game.startsAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">AI prediction</p>
                  <p className="font-semibold text-white">{pick.pick}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-electric to-accent"
                      style={{ width: `${pick.confidence}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Market vs AI</p>
                  <p className="font-bold text-white">AI {pick.confidence}%</p>
                  <p className="text-xs text-slate-500">Market {marketProbability}%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Edge / EV</p>
                  <p className="font-bold text-accent">{marketEdge >= 0 ? "+" : ""}{marketEdge}%</p>
                  <p className="text-xs text-slate-500">EV {ev >= 0 ? "+" : ""}{ev}%</p>
                </div>
                <Star size={18} className="text-amber-300" />
              </div>
            );
            })
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <Panel title="AI insights" icon={Target}>
            <Insight label="Recent form" value={92} />
            <Insight label="Line value" value={84} />
            <Insight label="History depth" value={58} />
            <Insight label="Home advantage" value={68} />
          </Panel>

          <Panel title="Model performance" icon={Activity}>
            <div className="h-28 rounded-lg border border-line bg-black/20 p-3">
              <div className="flex h-full items-end gap-1">
                {[22, 30, 28, 42, 37, 48, 44, 59, 51, 63, 58, 70, 67, 76, 72, 84].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t bg-gradient-to-t from-electric to-cyan"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniMetric label="Win rate" value={graded > 0 ? `${winRate}%` : "N/A"} />
              <MiniMetric label="W-L-P" value={`${record.wins}-${record.losses}-${record.pushes}`} />
            </div>
          </Panel>

          <Panel title="Record tracker" icon={Trophy}>
            <div className="grid grid-cols-2 gap-3">
              <MiniMetric label="Wins" value={`${record.wins}`} />
              <MiniMetric label="Losses" value={`${record.losses}`} />
              <MiniMetric label="Pending" value={`${record.pending}`} />
              <MiniMetric label="Graded" value={`${graded}`} />
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Clock size={15} />
              Picks by 8 AM. Results by midnight.
            </p>
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function TeamBlock({ team, label, align }: { team: string; label: string; align: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full border border-line bg-white/5 text-xl font-black text-cyan ${align === "right" ? "float-right ml-4" : "float-left mr-4"}`}>
        {team.slice(0, 2).toUpperCase()}
      </div>
      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <h2 className="mt-1 text-2xl font-black text-white">{team}</h2>
    </div>
  );
}

function WinMeter({ label, value, tone }: { label: string; value: number; tone: "green" | "blue" }) {
  const color = tone === "green" ? "from-accent to-emerald-400" : "from-electric to-cyan";

  return (
    <div>
      <p className={tone === "green" ? "text-4xl font-black text-accent" : "text-4xl font-black text-electric"}>
        {value}%
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-3 h-1.5 rounded-full bg-white/10">
        <div className={`h-1.5 rounded-full bg-gradient-to-r ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon: typeof Activity;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-field-900/75 p-5">
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-cyan">
        <Icon size={16} />
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3 grid grid-cols-[110px_1fr_42px] items-center gap-3 text-sm">
      <p className="text-slate-300">{label}</p>
      <div className="h-1.5 rounded-full bg-white/10">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-electric to-cyan" style={{ width: `${value}%` }} />
      </div>
      <p className="text-right text-slate-400">{value}%</p>
    </div>
  );
}

function MiniMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-black/25 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-1 font-bold ${accent ? "text-accent" : "text-white"}`}>{value}</p>
    </div>
  );
}

function WhyList({ items }: { items: string[] }) {
  return (
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <p key={item} className="text-sm text-slate-300">
          <span className="mr-2 text-accent">✓</span>
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
    <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Sportsbook comparison</p>
      <div className="mt-3 space-y-2">
        {lines.map((line) => (
          <div key={`${line.sportsbook}-${line.odds}`} className="flex items-center justify-between gap-3 text-sm">
            <span className={line.sportsbook === best.sportsbook ? "font-bold text-accent" : "text-slate-300"}>
              {line.sportsbook}
            </span>
            <span className="font-bold text-white">{formatOdds(line.odds)}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
        Best: <span className="text-accent">{best.sportsbook}</span>
      </p>
    </div>
  );
}

function LiveModelUpdate({ update }: { update: { lastUpdated: string; confidenceChange: string; reason: string } }) {
  return (
    <div className="mt-5 rounded-lg border border-cyan/20 bg-cyan/10 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan">Live model update</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-500">Last updated</p>
          <p className="font-bold text-white">{update.lastUpdated}</p>
        </div>
        <div>
          <p className="text-slate-500">Confidence change</p>
          <p className="font-bold text-accent">{update.confidenceChange}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-300">{update.reason}</p>
    </div>
  );
}

function confidenceLabel(value: number) {
  if (value >= 70) return "High";
  if (value >= 58) return "Medium";
  return "Developing";
}
