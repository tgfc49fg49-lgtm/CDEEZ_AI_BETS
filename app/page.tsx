import {
  ArrowRight,
  Zap
} from "lucide-react";
import Link from "next/link";
import { DailyRecordTracker } from "@/components/daily-record-tracker";
import { DailyStakePlanner } from "@/components/daily-stake-planner";
import { SearchCommand } from "@/components/search-command";
import {
  edgeFromMarket,
  expectedValueFromOdds,
  marketProbabilityFromOdds,
  playerPropPredictions,
  topGamePicks
} from "@/lib/analytics";
import { formatDateTime } from "@/lib/format";
import { getOdds } from "@/lib/sports-game-odds";
import type { PlayerProp } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { games, source, diagnostics } = await getOdds();
  const todayKey = localDateKey(new Date());
  const todaysGames = games.filter((game) => localDateKey(new Date(game.startsAt)) === todayKey);
  const topPicks = topGamePicks(games, 5);
  const todayTopPicks = topGamePicks(todaysGames, 5);
  const topPickAllocations = allocateTopPicks(topPicks, 100);
  const todayRecordAllocations = allocateTopPicks(todayTopPicks, 100);
  const props = playerPropPredictions(games, 100);
  const hottestBets = buildHottestBets(topPicks, props);
  const stakePlannerPicks = topPicks.map((pick) => ({
    id: pick.id,
    label: pick.pick,
    context: `${pick.game.awayTeam} @ ${pick.game.homeTeam}`,
    href: `/sportsbook/${pick.game.id}`,
    odds: pick.odds,
    confidence: pick.confidence,
    edge: edgeFromMarket(pick.confidence, pick.odds),
    score: pick.opportunityScore
  }));
  const recordPicks = todayRecordAllocations.map(({ pick, stake }) => ({
    id: pick.id,
    gameId: pick.game.id,
    sportKey: pick.game.sportKey,
    pick: pick.pick,
    market: pick.market,
    odds: pick.odds,
    stake,
    confidence: pick.confidence,
    edge: edgeFromMarket(pick.confidence, pick.odds),
    homeTeam: pick.game.homeTeam,
    awayTeam: pick.game.awayTeam,
    startsAt: pick.game.startsAt,
    href: `/sportsbook/${pick.game.id}`
  }));

  return (
    <div className="home-dashboard space-y-5">
      <header className="grid gap-5 xl:grid-cols-[1fr_430px]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-electric">
            AI prediction dashboard
          </p>
          <h1 className="mt-3 max-w-3xl text-[42px] font-black leading-tight tracking-tight text-white md:text-5xl">
            Smarter picks. <span className="text-accent">Powered by AI.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Main-market odds, AI confidence, daily records, and quick team or player lookup in one
            clean command center.
          </p>
        </div>

        <div className="flex items-start gap-3 xl:justify-end">
          <div className="home-card min-w-48 px-4 py-3">
            <p className="text-xs text-slate-500">Feed</p>
            <p className="mt-1 flex items-center gap-2 font-black uppercase text-white">
              <span className="h-2 w-2 rounded-full bg-accent" />
              {source} odds
            </p>
          </div>
          <div className="home-card min-w-48 px-4 py-3">
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

      {hottestBets.length > 0 && (
      <section>
        <div className="home-card overflow-hidden">
          <div className="inline-flex items-center gap-2 rounded-br-lg bg-accent px-5 py-2 text-sm font-black uppercase tracking-[0.18em] text-white">
            <Zap size={16} />
            Today&apos;s hottest bets
          </div>

          <div className="p-5">
            {hottestBets.length === 0 ? (
              <div className="rounded-lg border border-line bg-white p-6 text-slate-400">
                No real hot bets are available yet.
              </div>
            ) : (
              <div className="space-y-3">
                {hottestBets.map((bet, index) => (
                  <Link
                    key={bet.id}
                    href={bet.href}
                    className="group flex items-center justify-between gap-4 rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <div className="text-lg leading-none" aria-label={`${bet.heat} heat rating`}>
                        {flameRating(index)}
                      </div>
                      <p className="mt-3 truncate text-xl font-black text-white group-hover:text-accent">
                        {bet.label}
                      </p>
                      <p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        {bet.context}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Score</p>
                      <p className="text-2xl font-black text-electric">{bet.score}</p>
                      <p className="mt-1 text-sm font-black text-accent">
                        {bet.edge >= 0 ? "+" : ""}
                        {bet.edge}% edge
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Heat rating</p>
                <p className="font-bold text-white">Ranked by opportunity score, AI confidence, and real market edge.</p>
              </div>
              <Link
                href="/ai-predictions"
                className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-bold text-accent transition hover:bg-accent hover:text-white"
              >
                View all hot bets <ArrowRight size={16} className="ml-2 inline" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}

      <DailyStakePlanner picks={stakePlannerPicks} />

      <DailyRecordTracker dateKey={todayKey} picks={recordPicks} />

      <section>
        <div className="home-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="font-bold text-white">AI top 5 picks of the day</h2>
              <p className="mt-1 text-sm text-slate-500">$100 daily limit, dispersed by AI confidence, score, and edge.</p>
            </div>
            <Link href="/ai-predictions" className="text-sm font-semibold text-cyan hover:text-white">
              View all predictions
            </Link>
          </div>

          <div className="overflow-x-auto">
            {topPicks.length === 0 ? (
              <div className="px-5 py-8 text-slate-400">No real top picks available yet.</div>
            ) : (
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Matchup</th>
                    <th className="px-4 py-3 text-left">Pick</th>
                    <th className="px-4 py-3 text-left">AI Prob</th>
                    <th className="px-4 py-3 text-left">Market Prob</th>
                    <th className="px-4 py-3 text-left">Edge</th>
                    <th className="px-4 py-3 text-left">EV</th>
                    <th className="px-4 py-3 text-left">Stake</th>
                    <th className="px-4 py-3 text-left">Win ROI</th>
                    <th className="px-4 py-3 text-left">Grade</th>
                    <th className="px-4 py-3 text-left">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
            {topPickAllocations.map(({ pick, stake }) => {
              const marketProbability = marketProbabilityFromOdds(pick.odds);
              const marketEdge = edgeFromMarket(pick.confidence, pick.odds);
              const ev = expectedValueFromOdds(pick.confidence, pick.odds);
              const winProfit = profitIfWin(stake, pick.odds);

              return (
              <tr
                key={pick.id}
                className="transition hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3 text-slate-400">{pick.rank}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-white">{pick.game.awayTeam} @ {pick.game.homeTeam}</p>
                  <p className="text-xs text-slate-500">{pick.game.league} · {formatDateTime(pick.game.startsAt)}</p>
                </td>
                <td className="px-4 py-3 font-bold text-white">{pick.pick}</td>
                <td className="px-4 py-3 font-bold text-green-400">{pick.confidence}%</td>
                <td className="px-4 py-3 text-slate-300">{marketProbability}%</td>
                <td className="px-4 py-3 font-bold text-green-400">{marketEdge >= 0 ? "+" : ""}{marketEdge}%</td>
                <td className="px-4 py-3 font-bold text-green-400">{ev >= 0 ? "+" : ""}{ev}%</td>
                <td className="px-4 py-3 font-black text-electric">{formatCurrency(stake)}</td>
                <td className="px-4 py-3 font-black text-green-400">{formatCurrency(winProfit)}</td>
                <td className="px-4 py-3 font-bold text-green-400">{gradeFromEdge(marketEdge)}</td>
                <td className="px-4 py-3 font-bold text-green-400">{pick.opportunityScore}</td>
              </tr>
            );
            })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

type GamePick = ReturnType<typeof topGamePicks>[number];

type HottestBet = {
  id: string;
  label: string;
  context: string;
  href: string;
  score: number;
  edge: number;
  confidence: number;
  heat: number;
};

function buildHottestBets(gamePicks: GamePick[], props: PlayerProp[]): HottestBet[] {
  const gameItems = gamePicks.map((pick) => {
    const edge = edgeFromMarket(pick.confidence, pick.odds);

    return {
      id: `hot-game-${pick.id}`,
      label: pick.pick,
      context: `${pick.game.awayTeam} @ ${pick.game.homeTeam}`,
      href: `/sportsbook/${pick.game.id}`,
      score: pick.opportunityScore,
      edge,
      confidence: pick.confidence
    };
  });

  const propItems = props.slice(0, 12).map((prop) => ({
    id: `hot-prop-${prop.id}`,
    label: formatHotPropLabel(prop),
    context: `${prop.market} · ${prop.sportsbook}`,
    href: `/sportsbook/${prop.gameId}`,
    score: Math.round(Math.min(99, prop.confidence + prop.edge * 1.7)),
    edge: prop.edge,
    confidence: prop.confidence
  }));

  return [...gameItems, ...propItems]
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence || b.edge - a.edge)
    .slice(0, 5)
    .map((bet, index) => ({
      ...bet,
      heat: [5, 4, 4, 3, 2][index] ?? 2
    }));
}

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatHotPropLabel(prop: PlayerProp) {
  const side = prop.side ? capitalize(prop.side) : "";
  const line = Number.isFinite(prop.line) ? prop.line : null;
  const lineText = line !== null ? ` ${line}` : "";

  if (side) {
    return `${prop.player} ${side}${lineText}`;
  }

  return `${prop.player} ${prop.market}${lineText}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function flameRating(index: number) {
  return "🔥".repeat([5, 4, 4, 3, 2][index] ?? 2);
}

function allocateTopPicks(picks: GamePick[], budget: number) {
  const totalWeight = picks.reduce((total, pick) => total + allocationWeight(pick), 0);

  if (picks.length === 0 || totalWeight <= 0) return [];

  const rawAllocations = picks.map((pick) => {
    const stake = roundMoney((allocationWeight(pick) / totalWeight) * budget);

    return { pick, stake };
  });
  const roundedTotal = rawAllocations.reduce((total, item) => total + item.stake, 0);
  const drift = roundMoney(budget - roundedTotal);

  return rawAllocations.map((item, index) =>
    index === 0 ? { ...item, stake: roundMoney(item.stake + drift) } : item
  );
}

function allocationWeight(pick: GamePick) {
  const edge = Math.max(0, edgeFromMarket(pick.confidence, pick.odds));

  return Math.max(1, pick.opportunityScore * 0.55 + pick.confidence * 0.35 + edge * 2.5);
}

function profitIfWin(stake: number, odds: number) {
  if (odds === 0) return 0;
  return roundMoney(odds > 0 ? stake * (odds / 100) : stake * (100 / Math.abs(odds)));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function gradeFromEdge(edge: number) {
  if (edge >= 7) return "A+";
  if (edge >= 5) return "A";
  if (edge >= 3) return "A-";
  if (edge >= 1.5) return "B+";
  return "B";
}
