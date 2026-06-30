import Link from "next/link";
import { Activity, Clock } from "lucide-react";
import type { GameOdds } from "@/lib/types";
import { filteredLines } from "@/lib/analytics";
import { formatDateTime, formatOdds } from "@/lib/format";
import { hasSpreadMarket, hasTotalMarket, isCombatGame, spreadLabel, totalLabel } from "@/lib/market-labels";

export function MatchupTile({ game }: { game: GameOdds }) {
  const lines = filteredLines(game);
  const primary = lines[0];
  const showSpread = hasSpreadMarket(game);
  const showTotal = hasTotalMarket(game);

  return (
    <Link
      href={`/sportsbook/${game.id}`}
      className="block rounded-lg border border-line bg-field-900/80 p-5 transition hover:border-accent/50 hover:bg-field-800/80"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">{game.league}</p>
          <h2 className="mt-2 text-lg font-bold text-white">
            {game.awayTeam} at {game.homeTeam}
          </h2>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-black/25 px-3 py-1 text-xs text-slate-300">
          {game.status === "live" ? <Activity size={14} className="text-accent" /> : <Clock size={14} />}
          {game.status === "live" ? "Live" : formatDateTime(game.startsAt)}
        </span>
      </div>

      {game.status === "live" && (
        <div className="mt-4 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
          Live score: {game.awayTeam} {game.liveScore?.away ?? "-"} · {game.homeTeam}{" "}
          {game.liveScore?.home ?? "-"} · {game.liveScore?.period}
        </div>
      )}

      <div className={`mt-5 grid gap-3 ${isCombatGame(game) ? "sm:grid-cols-1" : "sm:grid-cols-3"}`}>
        <Market label="Moneyline" value={`${formatOdds(primary?.awayMoneyline ?? 0)} / ${formatOdds(primary?.homeMoneyline ?? 0)}`} />
        {showSpread && <Market label={spreadLabel(game)} value={`${primary?.spread ?? "N/A"} (${formatOdds(primary?.spreadOdds ?? 0)})`} />}
        {showTotal && <Market label={totalLabel(game)} value={`${primary?.total ?? "N/A"} O/U`} />}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {lines.map((line) => (
          <span key={line.sportsbook} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">
            {line.sportsbook}
          </span>
        ))}
      </div>
    </Link>
  );
}

function Market({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
