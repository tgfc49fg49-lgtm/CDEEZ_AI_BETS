import Link from "next/link";
import { Bell, ChevronRight, Settings, UserCircle } from "lucide-react";
import { SportsbookLogo, TeamLogo } from "@/components/premium-signals";
import { SearchCommand } from "@/components/search-command";
import {
  edgeFromMarket,
  filteredLines,
  linePriceForPick,
  marketProbabilityFromOdds,
  playerPropPredictions,
  topGamePicks
} from "@/lib/analytics";
import { formatDateTime, formatOdds } from "@/lib/format";
import { spreadLabel, totalLabel } from "@/lib/market-labels";
import { gameOpportunityScore } from "@/lib/opportunity";
import { leaguesForCategory, sportCatalog } from "@/lib/sport-catalog";
import { getOdds } from "@/lib/sports-game-odds";
import type { GameOdds } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SportsbookPage({
  searchParams
}: {
  searchParams?: { category?: string; league?: string };
}) {
  const { games } = await getOdds();
  const props = playerPropPredictions(games, 100);
  const liveLeagues = Array.from(new Set(games.map((game) => game.league))).sort();
  const selectedCategory = searchParams?.category ?? "featured";
  const selectedLeague = searchParams?.league;
  const categoryLeagues = leaguesForCategory(selectedCategory);
  const visibleGames = games.filter((game) =>
    selectedLeague ? game.league === selectedLeague : categoryLeagues.includes(game.league)
  );
  const topPicks = topGamePicks(visibleGames, 4);
  const picksHref = `/ai-predictions?category=${encodeURIComponent(selectedCategory)}${selectedLeague ? `&league=${encodeURIComponent(selectedLeague)}` : ""}`;
  const activeScopeLabel = selectedLeague ?? sportCatalog.find((category) => category.id === selectedCategory)?.label ?? "selected sport";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="w-full max-w-xl">
          <SearchCommand games={games} props={props} />
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <Bell size={19} />
          <UserCircle size={21} />
        </div>
      </div>

      <section className="mt-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-green-400">Sportsbook</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white md:text-4xl">Main market lines</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              DraftKings-priority matchup lines for moneyline, spread, and total goals/totals. FanDuel remains visible for comparison where available.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-line bg-field-900 px-4 py-2 text-sm font-bold text-white">
            <Settings size={15} />
            Customize
          </button>
        </div>
      </section>

      <CategoryTabs games={games} selectedCategory={selectedCategory} />
      <LeagueChips
        liveLeagues={liveLeagues}
        categoryLeagues={categoryLeagues}
        selectedLeague={selectedLeague}
        selectedCategory={selectedCategory}
      />

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        {visibleGames.slice(0, 3).map((game) => (
          <FeaturedMatchup key={game.id} game={game} />
        ))}
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-green-400">AI Top Picks</h2>
            <p className="text-sm text-slate-500">Showing value picks for {activeScopeLabel} based on the current sportsbook filter.</p>
          </div>
          <Link href={picksHref} className="rounded-lg border border-line bg-field-900 px-4 py-2 text-sm font-bold text-white">
            View all picks
          </Link>
        </div>

        {topPicks.length === 0 ? (
          <div className="rounded-lg border border-line bg-field-900/80 p-5 text-sm text-slate-400">
            No AI top picks are available for {activeScopeLabel} right now because no real sportsbook lines are live for that filter.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {topPicks.map((pick) => (
            <article key={pick.id} className="rounded-lg border border-line bg-field-900/80 p-4">
              <p className="text-xs font-bold uppercase text-green-400">{pick.game.league}</p>
              <h3 className="mt-3 text-lg font-black text-white">{pick.pick.replace(" ML", "")}</h3>
              <p className="text-sm text-slate-400">{pick.market}</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xl font-black text-white">{formatOdds(pick.odds)}</p>
                  <p className="text-xs text-slate-500">{pick.sportsbook}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Opp Score</p>
                  <p className="text-2xl font-black text-green-400">{pick.opportunityScore}</p>
                </div>
                <div className="min-w-24">
                  <p className="text-right text-sm font-bold text-white">{pick.confidence}%</p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-green-400" style={{ width: `${pick.confidence}%` }} />
                  </div>
                </div>
              </div>
            </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-field-900/80">
        <div className="border-b border-line px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Game lines</p>
        </div>
        <div className="grid grid-cols-[1.5fr_1.15fr_1.15fr_1.05fr_0.7fr] border-b border-line text-xs font-bold uppercase tracking-wide text-slate-500">
          <span className="px-4 py-3">Matchup</span>
          <span className="border-l border-line px-4 py-3">AI projection</span>
          <span className="border-l border-line px-4 py-3">Market</span>
          <span className="border-l border-line px-4 py-3">Value</span>
          <span className="border-l border-line px-4 py-3">Best book</span>
        </div>
        {visibleGames.length === 0 ? (
          <div className="p-5 text-slate-400">
            No real matchups are live for this category right now. The category is tracked and will populate when The Odds API returns lines.
          </div>
        ) : (
          visibleGames.map((game) => <MatchupRow key={game.id} game={game} />)
        )}
      </section>
    </>
  );
}

function CategoryTabs({ games, selectedCategory }: { games: GameOdds[]; selectedCategory: string }) {
  const counts = sportCatalog.reduce<Record<string, number>>((totals, category) => {
    totals[category.id] = games.filter((game) => category.leagues.includes(game.league)).length;
    return totals;
  }, {});

  return (
    <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
      {sportCatalog.map((category) => (
        <Link
          key={category.id}
          href={`/sportsbook?category=${encodeURIComponent(category.id)}`}
          className={`min-w-max rounded-lg px-4 py-2 text-sm font-black ${
            selectedCategory === category.id ? "bg-green-500 text-field-950" : "bg-field-900 text-slate-300"
          }`}
        >
          {category.label}
          <span className="ml-2 opacity-70">{counts[category.id] ?? 0}</span>
        </Link>
      ))}
    </div>
  );
}

function LeagueChips({
  liveLeagues,
  categoryLeagues,
  selectedLeague,
  selectedCategory
}: {
  liveLeagues: string[];
  categoryLeagues: string[];
  selectedLeague?: string;
  selectedCategory: string;
}) {
  const leagues = categoryLeagues.length > 0 ? categoryLeagues : liveLeagues;

  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
      <Link
        href={`/sportsbook?category=${encodeURIComponent(selectedCategory)}`}
        className={`min-w-max rounded-lg px-3 py-1.5 text-xs font-bold ${
          !selectedLeague ? "bg-white text-field-950" : "bg-white/5 text-slate-400"
        }`}
      >
        All
      </Link>
      {leagues.map((league) => {
        const isLive = liveLeagues.includes(league);

        return (
          <Link
            key={league}
            href={`/sportsbook?category=${encodeURIComponent(selectedCategory)}&league=${encodeURIComponent(league)}`}
            className={`min-w-max rounded-lg px-3 py-1.5 text-xs font-bold ${
              selectedLeague === league ? "bg-white text-field-950" : "bg-white/5 text-slate-400"
            }`}
          >
            {league}
            {!isLive && <span className="ml-1 text-slate-600">soon</span>}
          </Link>
        );
      })}
    </div>
  );
}

function FeaturedMatchup({ game }: { game: GameOdds }) {
  const line = filteredLines(game)[0];
  const pick = topGamePicks([game], 1)[0];
  const price = pick && line ? linePriceForPick(game, line, pick.pick) : 0;
  const opportunityScore = gameOpportunityScore({ game, odds: price, confidence: pick?.confidence ?? game.prediction.confidence });
  const signal = matchupSignal({
    score: opportunityScore,
    edge: pick?.edge ?? game.prediction.edge,
    confidence: pick?.confidence ?? game.prediction.confidence,
    lineCount: game.lines.length,
    propCount: game.playerProps?.length ?? 0
  });

  return (
    <Link href={`/sportsbook/${game.id}`} className="rounded-lg border border-line bg-field-900/80 p-4 hover:border-green-400/50">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase text-green-400">{game.league}</p>
        <p className="text-xs text-slate-500">{formatDateTime(game.startsAt)}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TeamLogo name={game.awayTeam} sport={game.league} size="sm" />
            <p className="truncate text-lg font-black text-white">{game.awayTeam}</p>
          </div>
          <p className="ml-11 py-1 text-xs font-bold uppercase tracking-wide text-slate-500">at</p>
          <div className="flex items-center gap-2">
            <TeamLogo name={game.homeTeam} sport={game.league} size="sm" />
            <p className="truncate text-lg font-black text-white">{game.homeTeam}</p>
          </div>
        </div>
        <MatchupSignal signal={signal} compact />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
        <MiniLine label="Moneyline" value={`${formatOdds(line?.awayMoneyline ?? 0)} / ${formatOdds(line?.homeMoneyline ?? 0)}`} />
        <MiniLine label={spreadLabel(game)} value={`${line?.spread ?? 0} (${formatOdds(line?.spreadOdds ?? 0)})`} />
        <MiniLine label={totalLabel(game)} value={`${line?.total ?? 0} O/U`} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {line?.sportsbook && <SportsbookLogo name={line.sportsbook} />}
          <p className="text-xs font-bold text-slate-400">{line?.sportsbook ?? "Preferred book"}</p>
        </div>
        <p className="text-xs font-bold text-slate-500">{game.playerProps?.length ?? 0} props</p>
      </div>
    </Link>
  );
}

function MatchupRow({ game }: { game: GameOdds }) {
  const lines = filteredLines(game);
  const line = lines[0];
  const pick = topGamePicks([game], 1)[0];
  const price = pick && line ? linePriceForPick(game, line, pick.pick) : 0;
  const market = marketProbabilityFromOdds(price);
  const mlEdge = pick ? edgeFromMarket(pick.confidence, price) : 0;
  const spreadEdge = Number((Math.max(-2.5, Math.min(4.5, game.prediction.edge - 0.8))).toFixed(1));
  const totalEdge = Number((Math.max(-2.5, Math.min(4.5, game.prediction.edge - 1.2))).toFixed(1));
  const bestBook = pick?.sportsbook ?? line?.sportsbook ?? "N/A";
  const opportunityScore = gameOpportunityScore({ game, odds: price, confidence: pick?.confidence ?? game.prediction.confidence });
  const signal = matchupSignal({
    score: opportunityScore,
    edge: pick?.edge ?? game.prediction.edge,
    confidence: pick?.confidence ?? game.prediction.confidence,
    lineCount: lines.length,
    propCount: game.playerProps?.length ?? 0
  });

  return (
    <Link
      href={`/sportsbook/${game.id}`}
      className="grid grid-cols-[1.5fr_1.15fr_1.15fr_1.05fr_0.7fr] border-b border-line/70 text-sm transition last:border-b-0 hover:bg-white/[0.03]"
    >
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <TeamLogo name={game.awayTeam} sport={game.league} size="sm" />
            <TeamLogo name={game.homeTeam} sport={game.league} size="sm" />
          </div>
          <div className="min-w-0">
            <span className="block truncate font-bold text-white">{game.awayTeam} @ {game.homeTeam}</span>
            <span className="mt-1 block text-xs text-slate-500">{game.league} · {formatDateTime(game.startsAt)}</span>
          </div>
        </div>
        <div className="mt-3">
          <MatchupSignal signal={signal} />
        </div>
      </div>
      <div className="border-l border-line/70 px-4 py-4">
        <span className="block text-white">AI ML {pick?.confidence ?? game.prediction.confidence}%</span>
        <span className="mt-2 block text-slate-300">AI {spreadLabel(game)} {line?.spread ?? 0}</span>
        <span className="mt-2 block text-slate-300">AI {totalLabel(game)} {line?.total ?? 0}</span>
      </div>
      <div className="border-l border-line/70 px-4 py-4">
        <span className="block text-white">ML {formatOdds(price)}</span>
        <span className="mt-2 block text-slate-300">Market {market}%</span>
        <span className="mt-2 block text-slate-300">{totalLabel(game)} {line?.total ?? 0}</span>
      </div>
      <div className="border-l border-line/70 px-4 py-4">
        <span className="block font-black text-green-400">Score {opportunityScore}</span>
        <span className="mt-1 block text-xs text-slate-500">{signal.reason}</span>
        <span className={mlEdge >= 0 ? "mt-2 block font-bold text-green-400" : "mt-2 block font-bold text-red-400"}>
          ML {mlEdge >= 0 ? "+" : ""}{mlEdge}%
        </span>
        <span className={spreadEdge >= 0 ? "mt-2 block font-bold text-green-400" : "mt-2 block font-bold text-red-400"}>
          {spreadLabel(game)} {spreadEdge >= 0 ? "+" : ""}{spreadEdge}
        </span>
        <span className={totalEdge >= 0 ? "mt-2 block font-bold text-green-400" : "mt-2 block font-bold text-red-400"}>
          {totalLabel(game)} {totalEdge >= 0 ? "+" : ""}{totalEdge}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 border-l border-line/70 px-4 py-4">
        <div className="flex items-center gap-2">
          {bestBook !== "N/A" && <SportsbookLogo name={bestBook} />}
          <span className="font-bold text-cyan">{bestBook}</span>
        </div>
        <ChevronRight size={18} className="text-slate-500" />
      </div>
    </Link>
  );
}

function matchupSignal({
  score,
  edge,
  confidence,
  lineCount,
  propCount
}: {
  score: number;
  edge: number;
  confidence: number;
  lineCount: number;
  propCount: number;
}) {
  if (confidence >= 70 && (score >= 88 || edge >= 6)) {
    return {
      label: "Strong look",
      reason: `${confidence}% confidence · ${lineCount} books · edge stands out`,
      className: "border-green-400/35 bg-green-400/10 text-green-300"
    };
  }

  if (confidence >= 58 && (score >= 74 || edge >= 3.5 || propCount >= 8)) {
    return {
      label: "Worth a look",
      reason: `${confidence}% confidence · ${lineCount} books · compare markets`,
      className: "border-amber-400/35 bg-amber-400/10 text-amber-200"
    };
  }

  return {
    label: "Pass for now",
    reason: `${confidence}% confidence · ${lineCount} books · no clear edge`,
    className: "border-white/10 bg-white/5 text-slate-400"
  };
}

function MatchupSignal({
  signal,
  compact = false
}: {
  signal: ReturnType<typeof matchupSignal>;
  compact?: boolean;
}) {
  return (
    <span className={`inline-flex ${compact ? "max-w-28 flex-col items-start" : "items-center"} gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-black ${signal.className}`}>
      <span>{signal.label}</span>
      {!compact && <span className="font-semibold opacity-70">{signal.reason}</span>}
    </span>
  );
}

function MiniLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}
