"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Banknote, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { formatOdds } from "@/lib/format";

export type StakePlannerPick = {
  id: string;
  label: string;
  context: string;
  href: string;
  odds: number;
  confidence: number;
  edge: number;
  score: number;
};

type RiskProfile = "conservative" | "balanced" | "aggressive";

const profiles: Record<
  RiskProfile,
  {
    label: string;
    description: string;
    maxBets: number;
    reservePercent: number;
    minConfidence: number;
  }
> = {
  conservative: {
    label: "Conservative",
    description: "Fewer bets, keeps a safety reserve.",
    maxBets: 3,
    reservePercent: 20,
    minConfidence: 58
  },
  balanced: {
    label: "Balanced",
    description: "Spreads the daily budget across the best board.",
    maxBets: 4,
    reservePercent: 10,
    minConfidence: 54
  },
  aggressive: {
    label: "Aggressive",
    description: "Uses the full budget across more edges.",
    maxBets: 5,
    reservePercent: 0,
    minConfidence: 50
  }
};

export function DailyStakePlanner({ picks }: { picks: StakePlannerPick[] }) {
  const [budget, setBudget] = useState(100);
  const [profile, setProfile] = useState<RiskProfile>("balanced");
  const activeProfile = profiles[profile];
  const plan = useMemo(
    () => buildStakePlan(picks, budget, activeProfile.maxBets, activeProfile.reservePercent, activeProfile.minConfidence),
    [activeProfile.maxBets, activeProfile.minConfidence, activeProfile.reservePercent, budget, picks]
  );

  return (
    <section className="home-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-electric">
            <Banknote size={17} />
            AI daily stake plan
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">Tell the AI your daily budget.</h2>
          <p className="mt-1 text-sm text-slate-500">
            Analytics only. This creates a suggested allocation plan, not a bet slip or placement.
          </p>
        </div>

        <div className="rounded-lg border border-line bg-white p-3">
          <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500" htmlFor="daily-budget">
            Daily amount
          </label>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-black text-slate-500">$</span>
            <input
              id="daily-budget"
              type="number"
              min={0}
              step={5}
              value={budget}
              onChange={(event) => setBudget(Math.max(0, Number(event.target.value) || 0))}
              className="w-32 rounded-md border border-line bg-white px-3 py-2 text-lg font-black text-white outline-none focus:border-electric"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            <SlidersHorizontal size={14} />
            Risk style
          </div>
          {(Object.keys(profiles) as RiskProfile[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setProfile(key)}
              className={
                profile === key
                  ? "w-full rounded-lg border border-electric bg-electric px-4 py-3 text-left text-white shadow-sm"
                  : "w-full rounded-lg border border-line bg-white px-4 py-3 text-left text-white transition hover:border-electric/40"
              }
            >
              <p className="font-black">{profiles[key].label}</p>
              <p className={profile === key ? "mt-1 text-sm text-white/80" : "mt-1 text-sm text-slate-500"}>
                {profiles[key].description}
              </p>
            </button>
          ))}

          <div className="rounded-lg border border-line bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <ShieldCheck size={16} className="text-electric" />
              Guardrails
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keeps weak-confidence picks out, avoids overloading one bet, and shows any reserved cash.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Summary label="Daily budget" value={formatCurrency(budget)} />
            <Summary label="Planned stake" value={formatCurrency(plan.totalStake)} />
            <Summary label="Expected profit" value={formatCurrency(plan.expectedProfit)} accent />
          </div>

          {plan.allocations.length === 0 ? (
            <div className="rounded-lg border border-line bg-white p-6 text-slate-400">
              No real picks clear the confidence filter yet.
            </div>
          ) : (
            <div className="space-y-3">
              {plan.allocations.map((item, index) => (
                <div key={item.pick.id} className="rounded-lg border border-line bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Bet {index + 1} of {plan.allocations.length}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-black text-white">{item.pick.label}</h3>
                      <p className="mt-1 truncate text-sm text-slate-500">{item.pick.context}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Suggested stake</p>
                      <p className="text-2xl font-black text-electric">{formatCurrency(item.stake)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-6">
                    <Mini label="Odds" value={formatOdds(item.pick.odds)} />
                    <Mini label="AI confidence" value={`${item.pick.confidence}%`} />
                    <Mini label="Edge" value={`${item.pick.edge >= 0 ? "+" : ""}${item.pick.edge}%`} accent />
                    <Mini label="Expected profit" value={formatCurrency(item.expectedProfit)} accent />
                    <Mini label="Win profit" value={formatCurrency(item.winProfit)} />
                    <Mini label="Plan share" value={`${item.share}%`} accent />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-field-800 px-3 py-2">
                    <p className="text-sm text-slate-500">
                      Why here: {allocationReason(item.pick, profile)}
                    </p>
                    <Link href={item.pick.href} className="inline-flex items-center gap-1 text-sm font-black text-electric">
                      Review line <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function buildStakePlan(
  picks: StakePlannerPick[],
  budget: number,
  maxBets: number,
  reservePercent: number,
  minConfidence: number
) {
  const eligible = picks
    .filter((pick) => pick.confidence >= minConfidence && pick.odds !== 0)
    .slice(0, maxBets);
  const reserve = roundMoney((budget * reservePercent) / 100);
  const totalStake = Math.max(0, roundMoney(budget - reserve));
  const totalWeight = eligible.reduce((total, pick) => total + allocationWeight(pick), 0);

  if (eligible.length === 0 || totalStake <= 0 || totalWeight <= 0) {
    return { allocations: [], reserve: budget, totalStake: 0, expectedProfit: 0 };
  }

  const rawAllocations = eligible.map((pick) => {
    const share = allocationWeight(pick) / totalWeight;
    const stake = roundMoney(totalStake * share);

    return {
      pick,
      stake,
      share: Math.round(share * 100)
    };
  });

  const roundedTotal = rawAllocations.reduce((total, item) => total + item.stake, 0);
  const drift = roundMoney(totalStake - roundedTotal);
  const allocations = rawAllocations.map((item, index) =>
    index === 0 ? { ...item, stake: roundMoney(item.stake + drift) } : item
  ).map((item) => ({
    ...item,
    winProfit: profitIfWin(item.stake, item.pick.odds),
    expectedProfit: expectedProfit(item.stake, item.pick.odds, item.pick.confidence)
  }));

  return {
    allocations,
    reserve,
    totalStake,
    expectedProfit: roundMoney(allocations.reduce((total, item) => total + item.expectedProfit, 0))
  };
}

function allocationWeight(pick: StakePlannerPick) {
  return Math.max(1, pick.score * 0.55 + pick.confidence * 0.35 + Math.max(0, pick.edge) * 2.5);
}

function allocationReason(pick: StakePlannerPick, profile: RiskProfile) {
  if (profile === "conservative") {
    return `${pick.confidence}% confidence with a ${pick.score} opportunity score clears the tighter daily filter.`;
  }

  if (profile === "aggressive") {
    return `${pick.score} score and ${pick.edge >= 0 ? "+" : ""}${pick.edge}% edge earn a bigger slice of the full daily amount.`;
  }

  return `${pick.confidence}% confidence, ${pick.score} score, and ${pick.edge >= 0 ? "+" : ""}${pick.edge}% edge balance risk and value.`;
}

function Summary({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-black ${accent ? "text-electric" : "text-white"}`}>{value}</p>
    </div>
  );
}

function Mini({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-1 font-black ${accent ? "text-electric" : "text-white"}`}>{value}</p>
    </div>
  );
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

function profitIfWin(stake: number, odds: number) {
  if (odds === 0) return 0;
  return roundMoney(odds > 0 ? stake * (odds / 100) : stake * (100 / Math.abs(odds)));
}

function expectedProfit(stake: number, odds: number, confidence: number) {
  const winProfit = profitIfWin(stake, odds);
  const winProbability = confidence / 100;

  return roundMoney(winProbability * winProfit - (1 - winProbability) * stake);
}
