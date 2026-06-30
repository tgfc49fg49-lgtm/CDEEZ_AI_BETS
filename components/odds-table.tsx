import type { GameOdds } from "@/lib/types";
import { formatOdds } from "@/lib/format";
import { hasSpreadMarket, hasTotalMarket, spreadLabel, totalLabel } from "@/lib/market-labels";

export function OddsTable({ games }: { games: GameOdds[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-field-900/80">
      <div className="overflow-x-auto">
        <table className="min-w-[880px] w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Game</th>
              <th className="px-4 py-3">Book</th>
              <th className="px-4 py-3">Away ML</th>
              <th className="px-4 py-3">Home ML</th>
              <th className="px-4 py-3">Spread</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {games.flatMap((game) =>
              game.lines.map((line) => {
                const showSpread = hasSpreadMarket(game);
                const showTotal = hasTotalMarket(game);

                return (
                <tr key={`${game.id}-${line.sportsbook}`} className="text-slate-300">
                  <td className="px-4 py-3 font-medium text-white">
                    {game.awayTeam} at {game.homeTeam}
                  </td>
                  <td className="px-4 py-3">{line.sportsbook}</td>
                  <td className="px-4 py-3">{formatOdds(line.awayMoneyline)}</td>
                  <td className="px-4 py-3">{formatOdds(line.homeMoneyline)}</td>
                  <td className="px-4 py-3">
                    {showSpread ? (
                      <>
                        <span className="text-slate-500">{spreadLabel(game)} </span>
                        {line.spread} ({formatOdds(line.spreadOdds)})
                      </>
                    ) : (
                      <span className="text-slate-500">Not offered</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {showTotal ? (
                      <>
                        <span className="text-slate-500">{totalLabel(game)} </span>
                        {line.total} O {formatOdds(line.overOdds)} / U {formatOdds(line.underOdds)}
                      </>
                    ) : (
                      <span className="text-slate-500">Not offered</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(line.lastUpdated).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit"
                    })}
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
