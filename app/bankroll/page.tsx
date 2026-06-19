import { PageHeader } from "@/components/page-header";
import { bankrollEvents } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

export default function BankrollPage() {
  const currentBalance = bankrollEvents[bankrollEvents.length - 1].balance;
  const startingBalance = bankrollEvents[0].balance;
  const change = currentBalance - startingBalance;

  return (
    <>
      <PageHeader
        eyebrow="Capital"
        title="Bankroll Tracker"
        description="Monitor bankroll movement, wins, losses, and current tracked balance for analytics and discipline."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <BankrollCard label="Starting bankroll" value={formatCurrency(startingBalance)} />
        <BankrollCard label="Current bankroll" value={formatCurrency(currentBalance)} />
        <BankrollCard label="Net change" value={formatCurrency(change)} />
      </section>

      <section className="mt-6 rounded-lg border border-line bg-field-900/80 p-5">
        <h2 className="text-lg font-bold text-white">Ledger</h2>
        <div className="mt-4 space-y-3">
          {bankrollEvents.map((event) => (
            <div key={event.id} className="grid gap-2 rounded-lg bg-black/20 p-4 sm:grid-cols-[130px_1fr_120px_120px]">
              <p className="text-sm text-slate-500">{event.date}</p>
              <p className="font-medium text-white">{event.label}</p>
              <p className={event.amount >= 0 ? "text-accent" : "text-red-300"}>{formatCurrency(event.amount)}</p>
              <p className="text-slate-300">{formatCurrency(event.balance)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function BankrollCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-field-900/80 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
