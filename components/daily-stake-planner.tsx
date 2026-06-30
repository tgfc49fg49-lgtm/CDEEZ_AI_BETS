"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Download,
  Gauge,
  LineChart,
  PiggyBank,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  WalletCards
} from "lucide-react";
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
  league?: string;
  market?: string;
};

type RiskProfile = "conservative" | "balanced" | "aggressive";

type ProfileConfig = {
  label: string;
  description: string;
  deployRange: [number, number];
  maxBets: number;
  minConfidence: number;
  riskRating: "Low" | "Medium" | "High";
};

type Allocation = {
  pick: StakePlannerPick;
  stake: number;
  share: number;
  winProfit: number;
  expectedProfit: number;
  expectedRoi: number;
  tier: string;
  reasons: string[];
};

const profiles: Record<RiskProfile, ProfileConfig> = {
  conservative: {
    label: "Conservative",
    description: "Uses 40-60% unless the board is unusually strong.",
    deployRange: [40, 60],
    maxBets: 3,
    minConfidence: 60,
    riskRating: "Low"
  },
  balanced: {
    label: "Balanced",
    description: "Uses 70-90% across the best mix of opportunities.",
    deployRange: [70, 90],
    maxBets: 4,
    minConfidence: 54,
    riskRating: "Medium"
  },
  aggressive: {
    label: "Aggressive",
    description: "Uses 90-100% when the board is strong enough.",
    deployRange: [90, 100],
    maxBets: 5,
    minConfidence: 50,
    riskRating: "High"
  }
};

export function DailyStakePlanner({ picks }: { picks: StakePlannerPick[] }) {
  const [budget, setBudget] = useState(100);
  const [profile, setProfile] = useState<RiskProfile>("balanced");
  const activeProfile = profiles[profile];
  const plan = useMemo(() => buildPortfolioPlan(picks, budget, profile), [budget, picks, profile]);
  const updateBudget = (value: string | number) => {
    setBudget(Math.max(0, Number(value) || 0));
  };

  return (
    <section className="home-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-electric">
            <WalletCards size={18} />
            AI Bankroll Manager
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">Today&apos;s portfolio plan.</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Enter a daily bankroll and the AI allocates capital by opportunity score, expected value,
            confidence, diversification, correlation, and risk exposure. Analytics only.
          </p>
          <p className="mt-3 inline-flex rounded-full bg-electric/10 px-3 py-1 text-sm font-black text-electric">
            Live bankroll: {formatCurrency(budget)}
          </p>
        </div>

        <div className="rounded-lg border border-line bg-white p-3 shadow-sm">
          <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500" htmlFor="daily-budget">
            Daily bankroll
          </label>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-black text-slate-500">$</span>
            <input
              id="daily-budget"
              type="number"
              min={0}
              step={5}
              value={budget}
              onInput={(event) => updateBudget(event.currentTarget.value)}
              onChange={(event) => updateBudget(event.currentTarget.value)}
              className="w-32 rounded-md border border-line bg-white px-3 py-2 text-lg font-black text-white outline-none focus:border-electric"
            />
          </div>
          <input
            aria-label="What-if daily bankroll slider"
            type="range"
            min={25}
            max={1000}
            step={25}
            value={Math.min(1000, Math.max(25, budget || 25))}
            onInput={(event) => updateBudget(event.currentTarget.value)}
            onChange={(event) => updateBudget(event.currentTarget.value)}
            className="mt-3 w-full accent-blue-600"
          />
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <SummaryCard label="Daily Bankroll" value={formatCurrency(budget)} />
          <SummaryCard label="Recommended Risk" value={activeProfile.label} sub={activeProfile.description} />
          <SummaryCard label="Planned Stake" value={formatCurrency(plan.totalStake)} sub={`Cash reserve ${formatCurrency(plan.reserve)}`} />
          <SummaryCard label="Expected Profit" value={signedCurrency(plan.expectedProfit)} accent sub={`${signedPercent(plan.expectedRoi)} expected ROI`} />
          <SummaryCard label="Portfolio Grade" value={plan.grade} accent />
          <SummaryCard label="Risk Rating" value={plan.riskRating} sub={`${plan.allocations.length} active allocations`} />
          <SummaryCard label="Cash Reserve" value={formatCurrency(plan.reserve)} sub={`${plan.reservePercent}% held back`} />
          <SummaryCard label="Board Strength" value={plan.boardStrength} sub={`${plan.strongCount} strong opportunities`} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-lg border border-line bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <SlidersHorizontal size={14} />
                Risk style
              </div>
              <div className="mt-3 space-y-2">
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
                    <p className={profile === key ? "mt-1 text-sm text-white/85" : "mt-1 text-sm text-slate-500"}>
                      {profiles[key].description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <PortfolioHealth plan={plan} />
            <ScenarioPanel plan={plan} />
          </aside>

          <div className="space-y-5">
            <CoachCard plan={plan} profile={profile} />
            <AllocationVisual plan={plan} />
            <ExposureWarnings warnings={plan.warnings} />

            {plan.allocations.length === 0 ? (
              <div className="rounded-lg border border-line bg-white p-6 text-slate-400">
                No real picks clear the AI bankroll filter yet. The portfolio manager recommends holding cash.
              </div>
            ) : (
              <div className="space-y-3">
                {plan.allocations.map((item, index) => (
                  <AllocationCard key={item.pick.id} item={item} index={index} />
                ))}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <ActionButton icon={Save} label="Save Plan" />
              <ActionButton icon={Download} label="Export Plan" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function buildPortfolioPlan(picks: StakePlannerPick[], budget: number, profile: RiskProfile) {
  const config = profiles[profile];
  const ranked = picks
    .filter((pick) => pick.odds !== 0)
    .map((pick) => ({
      ...pick,
      ev: expectedRoiForPick(pick)
    }))
    .sort((a, b) => b.ev - a.ev || b.edge - a.edge || b.score - a.score || b.confidence - a.confidence);
  const eligible = ranked
    .filter((pick) => pick.confidence >= config.minConfidence && pick.ev > -2)
    .slice(0, config.maxBets);
  const strongCount = ranked.filter((pick) => pick.score >= 86 && pick.edge > 2 && pick.ev > 0).length;
  const boardStrengthScore = eligible.length === 0
    ? 0
    : Math.round(eligible.reduce((total, pick) => total + pick.score + Math.max(0, pick.edge) * 4 + Math.max(0, pick.ev), 0) / eligible.length);
  const boardModifier = boardStrengthScore >= 105 ? 1 : boardStrengthScore >= 88 ? 0.82 : boardStrengthScore >= 74 ? 0.64 : 0.45;
  const deployPercent = Math.round(config.deployRange[0] + (config.deployRange[1] - config.deployRange[0]) * boardModifier);
  const totalStake = eligible.length === 0 ? 0 : roundMoney((budget * deployPercent) / 100);
  const reserve = roundMoney(budget - totalStake);
  const totalWeight = eligible.reduce((total, pick) => total + allocationWeight(pick, eligible), 0);
  const rawAllocations = totalStake > 0 && totalWeight > 0
    ? eligible.map((pick, index) => {
        const weight = allocationWeight(pick, eligible);
        const stake = roundMoney((weight / totalWeight) * totalStake);

        return {
          pick,
          stake,
          share: Math.round((stake / Math.max(1, budget)) * 100),
          tier: tierForIndex(index),
          reasons: stakeReasons(pick, profile, eligible)
        };
      })
    : [];
  const drift = roundMoney(totalStake - rawAllocations.reduce((total, item) => total + item.stake, 0));
  const allocations: Allocation[] = rawAllocations.map((item, index) => {
    const stake = index === 0 ? roundMoney(item.stake + drift) : item.stake;
    const winProfit = profitIfWin(stake, item.pick.odds);
    const expectedProfit = expectedProfitForStake(stake, item.pick);
    const expectedRoi = stake > 0 ? roundMoney((expectedProfit / stake) * 100) : 0;

    return {
      ...item,
      stake,
      share: Math.round((stake / Math.max(1, budget)) * 100),
      winProfit,
      expectedProfit,
      expectedRoi
    };
  });
  const expectedProfit = roundMoney(allocations.reduce((total, item) => total + item.expectedProfit, 0));
  const expectedRoi = totalStake > 0 ? roundMoney((expectedProfit / totalStake) * 100) : 0;
  const health = portfolioHealth(allocations, expectedRoi, profile);
  const warnings = exposureWarnings(allocations, budget);

  return {
    allocations,
    budget,
    reserve,
    reservePercent: budget > 0 ? Math.round((reserve / budget) * 100) : 0,
    totalStake,
    expectedProfit,
    expectedRoi,
    strongCount,
    boardStrength: boardStrengthScore >= 105 ? "Strong" : boardStrengthScore >= 88 ? "Healthy" : boardStrengthScore >= 74 ? "Thin" : "Weak",
    deployPercent,
    grade: gradeFromScore(health.overall),
    riskRating: warnings.length > 0 && profile === "aggressive" ? "High" : config.riskRating,
    warnings,
    health,
    scenarios: {
      best: roundMoney(allocations.reduce((total, item) => total + item.winProfit, 0)),
      likely: expectedProfit,
      worst: -totalStake
    }
  };
}

function SummaryCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${accent ? "text-electric" : "text-white"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs font-semibold text-slate-500">{sub}</p>}
    </div>
  );
}

function PortfolioHealth({ plan }: { plan: ReturnType<typeof buildPortfolioPlan> }) {
  const items = [
    ["Diversification", plan.health.diversification],
    ["Risk", plan.health.risk],
    ["Correlation", plan.health.correlation],
    ["Expected ROI", plan.health.expectedRoi],
    ["Volatility", plan.health.volatility]
  ] as const;

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge size={17} className="text-electric" />
          <h3 className="font-black text-white">Portfolio Health</h3>
        </div>
        <span className="rounded-lg bg-electric px-2.5 py-1 text-sm font-black text-white">
          {gradeFromScore(plan.health.overall)}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {items.map(([label, value]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>{label}</span>
              <span>{value}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-electric" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm font-bold text-white">Overall Grade: {gradeFromScore(plan.health.overall)}</p>
    </div>
  );
}

function ScenarioPanel({ plan }: { plan: ReturnType<typeof buildPortfolioPlan> }) {
  const roiMultiplier = plan.expectedRoi / 100;

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-center gap-2">
        <LineChart size={17} className="text-accent" />
        <h3 className="font-black text-white">Scenario Simulator</h3>
      </div>
      <div className="mt-4 grid gap-2">
        <Scenario label="Best Case" value={signedCurrency(plan.scenarios.best)} tone="good" />
        <Scenario label="Most Likely" value={signedCurrency(plan.scenarios.likely)} tone={plan.scenarios.likely >= 0 ? "good" : "bad"} />
        <Scenario label="Worst Case" value={signedCurrency(plan.scenarios.worst)} tone="bad" />
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">What-if budget</p>
        <div className="mt-3 space-y-2">
          {[100, 500, 1000].map((amount) => (
            <Scenario
              key={amount}
              label={`${formatCurrency(amount)} bankroll`}
              value={`${signedCurrency(roundMoney(amount * plan.deployPercent / 100 * roiMultiplier))} expected`}
              tone={roiMultiplier >= 0 ? "good" : "bad"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CoachCard({ plan, profile }: { plan: ReturnType<typeof buildPortfolioPlan>; profile: RiskProfile }) {
  return (
    <div className="rounded-lg border border-electric/25 bg-gradient-to-br from-electric/10 via-white to-accent/5 p-5">
      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-electric">
        <BrainCircuit size={18} />
        AI Coach
      </div>
      <p className="mt-3 text-lg font-black text-white">{coachHeadline(plan)}</p>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
        {coachText(plan, profile)}
      </p>
    </div>
  );
}

function AllocationVisual({ plan }: { plan: ReturnType<typeof buildPortfolioPlan> }) {
  const rows = [
    ...plan.allocations.map((item) => ({
      label: item.pick.label,
      share: item.share,
      value: formatCurrency(item.stake),
      color: "bg-electric"
    })),
    {
      label: "Cash Reserve",
      share: plan.reservePercent,
      value: formatCurrency(plan.reserve),
      color: "bg-slate-300"
    }
  ].filter((row) => row.share > 0);

  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-center gap-2">
        <BarChart3 size={18} className="text-electric" />
        <h3 className="text-lg font-black text-white">Capital Allocation</h3>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-bold text-white">{row.share}% {row.label}</span>
              <span className="font-black text-slate-500">{row.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.min(100, row.share)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExposureWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return (
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-sm font-bold text-green-600">
        No major concentration warnings. Portfolio exposure is within the selected risk profile.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-accent/25 bg-accent/5 p-4">
      <div className="flex items-center gap-2 text-sm font-black text-accent">
        <ShieldAlert size={16} />
        Exposure Warnings
      </div>
      <div className="mt-3 space-y-2">
        {warnings.map((warning) => (
          <p key={warning} className="text-sm font-semibold text-white">{warning}</p>
        ))}
      </div>
    </div>
  );
}

function AllocationCard({ item, index }: { item: Allocation; index: number }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex rounded-full bg-electric/10 px-2.5 py-1 text-xs font-black uppercase tracking-[0.14em] text-electric">
            {item.tier}
          </p>
          <h3 className="mt-3 truncate text-xl font-black text-white">{item.pick.label}</h3>
          <p className="mt-1 truncate text-sm text-slate-500">{item.pick.context}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Suggested Stake</p>
          <p className="text-3xl font-black text-electric">{formatCurrency(item.stake)}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{item.share}% of bankroll</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4 xl:grid-cols-8">
        <Mini label="Odds" value={formatOdds(item.pick.odds)} />
        <Mini label="AI Confidence" value={`${item.pick.confidence}%`} />
        <Mini label="Score" value={`${item.pick.score}`} accent />
        <Mini label="Edge" value={signedPercent(item.pick.edge)} accent />
        <Mini label="Exp Profit" value={signedCurrency(item.expectedProfit)} accent={item.expectedProfit >= 0} />
        <Mini label="Exp ROI" value={signedPercent(item.expectedRoi)} accent={item.expectedRoi >= 0} />
        <Mini label="Win Profit" value={formatCurrency(item.winProfit)} />
        <Mini label="Rank" value={`#${index + 1}`} />
      </div>

      <div className="mt-4 rounded-lg border border-line bg-field-800/40 p-3">
        <p className="text-sm font-black text-white">Why {formatCurrency(item.stake)}?</p>
        <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-500">
          {item.reasons.map((reason) => (
            <li key={reason}>- {reason}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <Link href={item.pick.href} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-2 text-sm font-black text-electric hover:border-electric/40">
          Review Line <ArrowRight size={14} />
        </Link>
        <Link href={item.pick.href} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-2 text-sm font-black text-white hover:border-electric/40">
          View Analysis <ArrowRight size={14} />
        </Link>
        <Link href={item.pick.href} className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-2 text-sm font-black text-white hover:border-electric/40">
          Track Pick <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function Mini({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-1 font-black ${accent ? "text-electric" : "text-white"}`}>{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label }: { icon: typeof Save; label: string }) {
  return (
    <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-black text-white hover:border-electric/40">
      <Icon size={16} />
      {label}
    </button>
  );
}

function Scenario({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className={`font-black ${tone === "good" ? "text-green-600" : "text-accent"}`}>{value}</span>
    </div>
  );
}

function allocationWeight(pick: StakePlannerPick, picks: StakePlannerPick[]) {
  const concentrationPenalty = correlationCount(pick, picks) * 5;
  return Math.max(1, pick.score * 0.5 + pick.confidence * 0.3 + Math.max(0, pick.edge) * 4 + Math.max(0, expectedRoiForPick(pick)) * 1.4 - concentrationPenalty);
}

function stakeReasons(pick: StakePlannerPick, profile: RiskProfile, picks: StakePlannerPick[]) {
  const reasons = [];
  if (pick.score >= 90) reasons.push("Highest opportunity score tier on today's board.");
  else if (pick.score >= 80) reasons.push("Strong opportunity score keeps it in the active portfolio.");
  else reasons.push("Qualified, but sized smaller because the opportunity score is thinner.");

  if (pick.edge >= 5) reasons.push("Strong market edge versus the listed price.");
  else if (pick.edge > 0) reasons.push("Positive edge, but not large enough to over-concentrate.");
  else reasons.push("Small or negative edge limits the stake size.");

  if (expectedRoiForPick(pick) > 0) reasons.push("Positive expected value supports capital deployment.");
  else reasons.push("Expected value is thin, so exposure is capped.");

  if (correlationCount(pick, picks) === 0) reasons.push("Low correlation with the rest of the plan.");
  else reasons.push("Correlation with similar picks reduced the allocation.");

  reasons.push(`Fits the ${profiles[profile].label.toLowerCase()} risk profile.`);
  return reasons;
}

function portfolioHealth(allocations: Allocation[], expectedRoi: number, profile: RiskProfile) {
  const leagueShares = exposureBy(allocations, (item) => item.pick.league ?? "Unknown");
  const maxLeagueShare = Math.max(0, ...Array.from(leagueShares.values()));
  const maxPickShare = Math.max(0, ...allocations.map((item) => item.share));
  const diversification = clamp(100 - maxLeagueShare + allocations.length * 6, 40, 98);
  const risk = clamp(100 - maxPickShare + (profile === "conservative" ? 8 : profile === "balanced" ? 0 : -8), 30, 96);
  const correlation = clamp(100 - correlatedPairs(allocations) * 12, 35, 98);
  const roi = clamp(55 + expectedRoi, 30, 99);
  const volatility = clamp(100 - allocations.reduce((total, item) => total + item.share * impliedVolatility(item.pick.odds), 0) / 100, 25, 95);
  const overall = Math.round((diversification + risk + correlation + roi + volatility) / 5);

  return { diversification, risk, correlation, expectedRoi: roi, volatility, overall };
}

function exposureWarnings(allocations: Allocation[], budget: number) {
  const warnings: string[] = [];
  const leagueShares = exposureBy(allocations, (item) => item.pick.league ?? "Unknown");
  const topLeague = Array.from(leagueShares.entries()).sort((a, b) => b[1] - a[1])[0];
  const topPick = allocations.reduce<Allocation | null>((best, item) => (!best || item.share > best.share ? item : best), null);

  if (topLeague && topLeague[1] >= 60) {
    warnings.push(`Warning: ${topLeague[1]}% of today's bankroll is exposed to ${topLeague[0]}.`);
  }

  if (topPick && topPick.share >= 45) {
    warnings.push(`Warning: ${topPick.share}% of bankroll is concentrated in one play.`);
  }

  const correlated = correlatedPairs(allocations);
  if (correlated >= 3) {
    warnings.push(`Warning: ${correlated} picks are highly correlated.`);
  }

  if (allocations.length > 0 && allocations.length <= 2) {
    warnings.push("Warning: Only 2 bets qualify today. Consider holding more cash.");
  }

  if (budget > 0 && allocations.length === 0) {
    warnings.push("Warning: No bets qualify today. The AI recommends holding cash.");
  }

  return warnings;
}

function coachHeadline(plan: ReturnType<typeof buildPortfolioPlan>) {
  if (plan.allocations.length === 0) return "Hold cash until the board improves.";
  if (plan.boardStrength === "Strong") return "Strong board, but still manage exposure.";
  if (plan.warnings.length > 0) return "Good opportunities, with concentration risk.";
  return "Balanced deployment across the best values.";
}

function coachText(plan: ReturnType<typeof buildPortfolioPlan>, profile: RiskProfile) {
  if (plan.allocations.length === 0) {
    return "Today's board does not clear the minimum confidence and expected-value filters. The model recommends preserving the bankroll instead of forcing action.";
  }

  const straightBetText =
    plan.allocations.length >= 3
      ? "Straight moneyline exposure currently carries the cleanest expected value, so the AI avoids overloading parlays."
      : "Only a few plays qualify, so the AI keeps more cash reserved and avoids stretching into weak markets.";

  return `Today's board has ${plan.strongCount} high-value opportunities. The model recommends using ${plan.deployPercent}% of the bankroll and keeping ${plan.reservePercent}% reserved under the ${profiles[profile].label.toLowerCase()} profile. ${straightBetText}`;
}

function tierForIndex(index: number) {
  return ["CORE PLAY", "SUPPORTING PLAY", "VALUE PLAY", "SMALL EDGE", "WATCHLIST"][index] ?? "WATCHLIST";
}

function gradeFromScore(score: number) {
  if (score >= 92) return "A+";
  if (score >= 84) return "A";
  if (score >= 76) return "B+";
  if (score >= 68) return "B";
  return "C";
}

function exposureBy(allocations: Allocation[], selector: (item: Allocation) => string) {
  return allocations.reduce((totals, item) => {
    const key = selector(item);
    totals.set(key, (totals.get(key) ?? 0) + item.share);
    return totals;
  }, new Map<string, number>());
}

function correlationCount(pick: StakePlannerPick, picks: StakePlannerPick[]) {
  return picks.filter((item) => item.id !== pick.id && (item.league === pick.league || item.context === pick.context)).length;
}

function correlatedPairs(allocations: Allocation[]) {
  let count = 0;
  allocations.forEach((item, index) => {
    allocations.slice(index + 1).forEach((other) => {
      if (item.pick.league === other.pick.league || item.pick.context === other.pick.context) count += 1;
    });
  });
  return count;
}

function impliedVolatility(odds: number) {
  if (odds > 250) return 1.35;
  if (odds > 120) return 1.15;
  if (odds < -250) return 0.72;
  return 1;
}

function expectedRoiForPick(pick: StakePlannerPick) {
  if (pick.odds === 0) return 0;
  const winProfitOn100 = profitIfWin(100, pick.odds);
  const winProbability = pick.confidence / 100;
  return roundMoney(winProbability * winProfitOn100 - (1 - winProbability) * 100);
}

function expectedProfitForStake(stake: number, pick: StakePlannerPick) {
  return roundMoney((expectedRoiForPick(pick) / 100) * stake);
}

function profitIfWin(stake: number, odds: number) {
  if (odds === 0) return 0;
  return roundMoney(odds > 0 ? stake * (odds / 100) : stake * (100 / Math.abs(odds)));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}

function signedCurrency(value: number) {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

function signedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${roundMoney(value)}%`;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}
