import { PageHeader } from "@/components/page-header";
import { mockBets } from "@/lib/mock-data";
import { formatCurrency, formatOdds } from "@/lib/format";

const statusClass = {
  open: "bg-blue-400/15 text-blue-300",
  won: "bg-accent/15 text-accent",
  lost: "bg-red-400/15 text-red-300"
};

export default function BetsPage() {
  const totalStaked = mockBets.reduce((total, bet) => total + bet.stake, 0);
  const netResult = mockBets.reduce((total, bet) => total + bet.result, 0);

  return (
    <>
      <PageHeader
        eyebrow="Tracker"
        title="Bet Tracker"
        description="Track picks, stakes, results, and closing notes without placing real-money bets from the app."
      />

      <section className="mb-4 grid gap-4 sm:grid-cols-2">
        <Summary label="Total staked" value={formatCurrency(totalStaked)} />
        <Summary label="Net tracked result" value={formatCurrency(netResult)} />
      </section>

      <div className="overflow-hidden rounded-lg border border-line bg-field-900/80">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Game</th>
                <th className="px-4 py-3">Market</th>
                <th className="px-4 py-3">Pick</th>
                <th className="px-4 py-3">Odds</th>
                <th className="px-4 py-3">Stake</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mockBets.map((bet) => (
                <tr key={bet.id} className="text-slate-300">
                  <td className="px-4 py-3 font-medium text-white">{bet.game}</td>
                  <td className="px-4 py-3">{bet.market}</td>
                  <td className="px-4 py-3">{bet.pick}</td>
                  <td className="px-4 py-3">{formatOdds(bet.odds)}</td>
                  <td className="px-4 py-3">{formatCurrency(bet.stake)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[bet.status]}`}>
                      {bet.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(bet.result)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-field-900/80 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
