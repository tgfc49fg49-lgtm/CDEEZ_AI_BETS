import { PageHeader } from "@/components/page-header";
import { findArbitrages } from "@/lib/analytics";
import { formatOdds } from "@/lib/format";
import { getOdds } from "@/lib/sports-game-odds";

export const dynamic = "force-dynamic";

export default async function ArbitragesPage() {
  const { games } = await getOdds();
  const opportunities = findArbitrages(games);

  return (
    <>
      <PageHeader
        eyebrow="Arbitrages"
        title="Arb and near-arb scanner"
        description="Scans preferred sportsbooks for clean arbitrages and near-arbitrage moneyline edges."
      />

      <section className="rounded-lg border border-line bg-field-900/80 p-5">
        {opportunities.length === 0 ? (
          <div className="rounded-lg bg-black/20 p-5 text-slate-400">
            No clean or near arbitrages found in the current preferred-book feed.
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((item) => (
              <article key={item.id} className="grid gap-3 rounded-lg bg-black/20 p-4 lg:grid-cols-[1fr_160px_160px_100px]">
                <div>
                  <p className="font-semibold text-white">{item.game}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.market}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">{item.sideA}</p>
                  <p className="font-semibold text-white">
                    {item.bookA} {formatOdds(item.oddsA)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">{item.sideB}</p>
                  <p className="font-semibold text-white">
                    {item.bookB} {formatOdds(item.oddsB)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Edge</p>
                  <p className={item.edge >= 0 ? "font-bold text-accent" : "font-bold text-amber-300"}>
                    {item.edge}%
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
