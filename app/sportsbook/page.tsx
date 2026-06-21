import Link from "next/link";
import { Bell, ChevronRight, Settings, UserCircle } from "lucide-react";
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
import { categoryForLeague, leaguesForCategory, sportCatalog } from "@/lib/sport-catalog";
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
  const firstLiveCategory = games[0] ? categoryForLeague(games[0].league)?.id : undefined;
  const selectedCategory = searchParams?.category ?? firstLiveCategory ?? "featured";
  const selectedLeague = searchParams?.league;
  const categoryLeagues = leaguesForCategory(selectedCategory);
  const visibleGames = games.filter((game) =>
    selectedLeague ? game.league === selectedLeague : categoryLeagues.includes(game.league)
  );
  const topPicks = topGamePicks(games, 4);

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
              Matchup lines for moneyline, spread, and total across DraftKings, Underdog, PrizePicks, and FanDuel where available.
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
            <p className="text-sm text-slate-500">Our AI model analyzes live market data to find value.</p>
          </div>
          <Link href="/ai-predictions" className="rounded-lg border border-line bg-field-900 px-4 py-2 text-sm font-bold text-white">
            View all picks
          </Link>
        </div>

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

  return (
    <Link href={`/sportsbook/${game.id}`} className="rounded-lg border border-line bg-field-900/80 p-4 hover:border-green-400/50">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase text-green-400">{game.league}</p>
        <p className="text-xs text-slate-500">{formatDateTime(game.startsAt)}</p>
      </div>
      <h2 className="mt-4 text-xl font-black text-white">
        {game.awayTeam}
        <span className="block text-sm font-semibold text-slate-500">vs</span>
        {game.homeTeam}
      </h2>
      <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
        <MiniLine label="Moneyline" value={`${formatOdds(line?.awayMoneyline ?? 0)} / ${formatOdds(line?.homeMoneyline ?? 0)}`} />
        <MiniLine label="Spread" value={`${line?.spread ?? 0} (${formatOdds(line?.spreadOdds ?? 0)})`} />
        <MiniLine label="Total" value={`${line?.total ?? 0} O/U`} />
      </div>
      <p className="mt-4 text-xs font-bold text-slate-400">{line?.sportsbook ?? "Preferred book"}</p>
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

  return (
    <Link
      href={`/sportsbook/${game.id}`}
      className="grid grid-cols-[1.5fr_1.15fr_1.15fr_1.05fr_0.7fr] border-b border-line/70 text-sm transition last:border-b-0 hover:bg-white/[0.03]"
    >
      <span className="px-4 py-4">
        <span className="block font-bold text-white">{game.awayTeam} @ {game.homeTeam}</span>
        <span className="mt-1 block text-xs text-slate-500">{game.league} · {formatDateTime(game.startsAt)}</span>
      </span>
      <span className="border-l border-line/70 px-4 py-4">
        <span className="block text-white">AI ML {pick?.confidence ?? game.prediction.confidence}%</span>
        <span className="mt-2 block text-slate-300">AI Spread {line?.spread ?? 0}</span>
        <span className="mt-2 block text-slate-300">AI Total {line?.total ?? 0}</span>
      </span>
      <span className="border-l border-line/70 px-4 py-4">
        <span className="block text-white">ML {formatOdds(price)}</span>
        <span className="mt-2 block text-slate-300">Market {market}%</span>
        <span className="mt-2 block text-slate-300">Total {line?.total ?? 0}</span>
      </span>
      <span className="border-l border-line/70 px-4 py-4">
        <span className={mlEdge >= 0 ? "block font-bold text-green-400" : "block font-bold text-red-400"}>
          ML {mlEdge >= 0 ? "+" : ""}{mlEdge}%
        </span>
        <span className={spreadEdge >= 0 ? "mt-2 block font-bold text-green-400" : "mt-2 block font-bold text-red-400"}>
          Spread {spreadEdge >= 0 ? "+" : ""}{spreadEdge}
        </span>
        <span className={totalEdge >= 0 ? "mt-2 block font-bold text-green-400" : "mt-2 block font-bold text-red-400"}>
          Total {totalEdge >= 0 ? "+" : ""}{totalEdge}
        </span>
      </span>
      <span className="flex items-center justify-between gap-2 border-l border-line/70 px-4 py-4">
        <span className="font-bold text-cyan">{bestBook}</span>
        <ChevronRight size={18} className="text-slate-500" />
      </span>
    </Link>
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
