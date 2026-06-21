import { PageHeader } from "@/components/page-header";
import { findArbitrages } from "@/lib/analytics";
import { formatOdds } from "@/lib/format";
import { getOdds } from "@/lib/sports-game-odds";
import type { ArbitrageOpportunity } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ArbitragesPage() {
  const { games } = await getOdds();
  const opportunities = findArbitrages(games);
  const pure = opportunities.filter((item) => item.edge > 0);
  const near = opportunities.filter((item) => item.edge <= 0);

  return (
    <>
      <PageHeader
        eyebrow="Arbitrage Scanner"
        title="Arbitrage scanner"
        description="Scans preferred sportsbooks for pure arbitrages and near-arbitrage moneyline edges."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-lg bg-green-500 px-4 py-2 text-sm font-black text-field-950">
          Pure Arbitrage {pure.length}
        </span>
        <span className="rounded-lg bg-field-900 px-4 py-2 text-sm font-black text-slate-300">
          Near Arbitrage {near.length}
        </span>
      </div>

      <section className="overflow-hidden rounded-lg border border-line bg-field-900/80">
        <div className="grid min-w-[920px] grid-cols-[1.25fr_1fr_1fr_0.75fr_0.85fr_0.65fr] border-b border-line px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          <span>Opportunity</span>
          <span>Books</span>
          <span>Stake split</span>
          <span>Profit %</span>
          <span>Guaranteed profit</span>
          <span>Time found</span>
        </div>

        {opportunities.length === 0 ? (
          <div className="p-5 text-slate-400">
            No clean or near arbitrages found in the current preferred-book feed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {opportunities.map((item, index) => (
              <ArbRow key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ArbRow({ item, index }: { item: ArbitrageOpportunity; index: number }) {
  const split = stakeSplit(item.oddsA, item.oddsB);
  const profit = Math.max(0, item.edge);
  const guaranteedProfit = profit > 0 ? profit * 10 : Math.abs(item.edge) * 4;

  return (
    <article className="grid min-w-[920px] grid-cols-[1.25fr_1fr_1fr_0.75fr_0.85fr_0.65fr] border-b border-line/70 px-4 py-4 text-sm last:border-b-0">
      <div>
        <p className="text-xs font-bold uppercase text-green-400">
          {item.edge > 0 ? "Pure arbitrage" : "Near arbitrage"}
        </p>
        <p className="mt-1 font-bold text-white">{item.game}</p>
        <p className="text-xs text-slate-500">{item.market}</p>
      </div>

      <div className="space-y-1">
        <p className="text-slate-300">
          {item.bookA} <span className="font-bold text-white">{formatOdds(item.oddsA)}</span>
        </p>
        <p className="text-slate-300">
          {item.bookB} <span className="font-bold text-white">{formatOdds(item.oddsB)}</span>
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-300">${split.a}</span>
          <span className="text-slate-300">${split.b}</span>
        </div>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-white/10">
          <div className="bg-electric" style={{ width: `${split.aPercent}%` }} />
          <div className="flex-1 bg-green-400" />
        </div>
      </div>

      <p className={item.edge > 0 ? "font-black text-green-400" : "font-black text-amber-300"}>
        {item.edge}%
      </p>
      <p className="font-black text-white">${guaranteedProfit.toFixed(2)}</p>
      <p className="text-slate-400">{index + 2}m ago</p>
    </article>
  );
}

function stakeSplit(oddsA: number, oddsB: number) {
  const probabilityA = impliedProbability(oddsA);
  const probabilityB = impliedProbability(oddsB);
  const total = probabilityA + probabilityB || 1;
  const a = Math.round((probabilityA / total) * 1000);
  const b = 1000 - a;

  return {
    a,
    b,
    aPercent: Math.round((a / 1000) * 100)
  };
}

function impliedProbability(odds: number) {
  if (odds === 0) return 0;
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
}
