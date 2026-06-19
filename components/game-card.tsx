import { CalendarDays, MapPin } from "lucide-react";
import type { GameOdds } from "@/lib/types";
import { formatDateTime, formatOdds } from "@/lib/format";

export function GameCard({ game }: { game: GameOdds }) {
  const bestAway = game.lines.reduce((best, line) =>
    line.awayMoneyline > best.awayMoneyline ? line : best
  );
  const bestHome = game.lines.reduce((best, line) =>
    line.homeMoneyline > best.homeMoneyline ? line : best
  );

  return (
    <article className="rounded-lg border border-line bg-field-900/85 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            <span>{game.league}</span>
            <span className="rounded-full bg-accent/15 px-2 py-1 text-accent">{game.status}</span>
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">
            {game.awayTeam} at {game.homeTeam}
          </h2>
        </div>
        <div className="rounded-lg bg-black/20 px-3 py-2 text-right">
          <p className="text-xs text-slate-400">Confidence</p>
          <p className="text-2xl font-bold text-accent">{game.prediction.confidence}%</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-slate-500" />
          {formatDateTime(game.startsAt)}
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-slate-500" />
          {game.venue}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniMarket label="Best away ML" value={formatOdds(bestAway.awayMoneyline)} book={bestAway.sportsbook} />
        <MiniMarket label="Best home ML" value={formatOdds(bestHome.homeMoneyline)} book={bestHome.sportsbook} />
        <MiniMarket label="Model lean" value={game.prediction.pick} book={`${game.prediction.edge}% edge`} />
      </div>
    </article>
  );
}

function MiniMarket({ label, value, book }: { label: string; value: string; book: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/20 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{book}</p>
    </div>
  );
}
