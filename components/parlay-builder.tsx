"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Check, Filter, Plus, Sparkles, Trash2 } from "lucide-react";
import { preferredSportsbooks, topGamePicks } from "@/lib/analytics";
import { formatOdds } from "@/lib/format";
import type { GameOdds } from "@/lib/types";

type BuilderTab = "popular" | "all" | "my-picks";
type GeneratedPick = ReturnType<typeof topGamePicks>[number];
type CustomPick = {
  id: string;
  pick: string;
  market: string;
  sportsbook: string;
  odds: number;
  confidence: number;
  edge: number;
};
type ParlayLeg = Pick<GeneratedPick, "id" | "pick" | "market" | "sportsbook" | "odds" | "confidence" | "edge">;

export function ParlayBuilder({ games }: { games: GameOdds[] }) {
  const [tab, setTab] = useState<BuilderTab>("popular");
  const [sportsbook, setSportsbook] = useState("DraftKings");
  const [sportFilter, setSportFilter] = useState("all");
  const [targetLegs, setTargetLegs] = useState(4);
  const [selected, setSelected] = useState<string[] | null>(null);
  const [customLegs, setCustomLegs] = useState<CustomPick[]>([]);
  const [customPick, setCustomPick] = useState("");
  const [customMarket, setCustomMarket] = useState("Moneyline");
  const [customOdds, setCustomOdds] = useState("");
  const [customBook, setCustomBook] = useState("DraftKings");
  const [aiOutcome, setAiOutcome] = useState("");

  const sportOptions = useMemo(() => buildSportOptions(games), [games]);
  const filteredGames = useMemo(
    () => (sportFilter === "all" ? games : games.filter((game) => sportKey(game) === sportFilter)),
    [games, sportFilter]
  );
  const picks = useMemo(() => topGamePicks(filteredGames, 32, sportsbook), [filteredGames, sportsbook]);
  const defaultIds = useMemo(() => picks.slice(0, targetLegs).map((pick) => pick.id), [picks, targetLegs]);
  const selectedIds = selected ?? defaultIds;
  const selectedPicks = picks.filter((pick) => selectedIds.includes(pick.id));
  const parlayLegs = [...selectedPicks, ...customLegs];
  const visiblePicks =
    tab === "popular"
      ? picks.slice(0, 10)
      : tab === "my-picks"
        ? selectedPicks
        : picks;
  const summary = summarizeParlay(parlayLegs);

  function togglePick(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((pickId) => pickId !== id)
      : selectedIds.length >= 8
        ? [...selectedIds.slice(1), id]
        : [...selectedIds, id];

    setSelected(next);
  }

  function optimize() {
    setSelected(picks.slice(0, targetLegs).map((pick) => pick.id));
    setTab("my-picks");
    setAiOutcome("");
  }

  function addCustomLeg() {
    const odds = Number(customOdds.replace("+", ""));

    if (!customPick.trim() || !customMarket.trim() || !Number.isFinite(odds) || odds === 0) {
      return;
    }

    const confidence = Math.max(18, Math.min(82, Math.round(impliedProbabilityFromAmerican(odds) * 100)));
    const nextLeg: CustomPick = {
      id: `custom-${Date.now()}`,
      pick: customPick.trim(),
      market: customMarket.trim(),
      sportsbook: customBook,
      odds,
      confidence,
      edge: 0
    };

    setCustomLegs((legs) => [...legs, nextLeg].slice(-8));
    setCustomPick("");
    setCustomOdds("");
    setTab("my-picks");
    setAiOutcome("");
  }

  function runOutcome() {
    setAiOutcome(buildOutcomeRead(parlayLegs, summary));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-field-900/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-green-300">
              <Filter size={16} />
              Build filters
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Filter by sport first, then choose a sportsbook and leg count. AI picks stay on one selected book.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-line bg-field-900/80 px-3 py-2 text-sm text-slate-300">
              Book
              <select
                value={sportsbook}
                onChange={(event) => {
                  setSportsbook(event.target.value);
                  setSelected(null);
                }}
                className="bg-transparent font-semibold text-white outline-none"
              >
                {preferredSportsbooks.map((book) => (
                  <option key={book} value={book} className="bg-field-950">
                    {book}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-line bg-field-900/80 px-3 py-2 text-sm text-slate-300">
              Legs
              <input
                type="range"
                min="3"
                max="8"
                value={targetLegs}
                onChange={(event) => {
                  setTargetLegs(Number(event.target.value));
                  setSelected(null);
                }}
                className="accent-accent"
              />
              <span className="w-5 font-bold text-white">{targetLegs}</span>
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {sportOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setSportFilter(option.key);
                setSelected(null);
                setTab("popular");
                setAiOutcome("");
              }}
              className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                sportFilter === option.key
                  ? "border-green-400 bg-green-400/15 text-green-300"
                  : "border-line bg-black/20 text-slate-400 hover:text-white"
              }`}
            >
              {option.label}
              <span className="ml-2 text-xs text-slate-500">{option.count}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4">
          <BuilderTabButton active={tab === "popular"} onClick={() => setTab("popular")}>
            Top Picks
          </BuilderTabButton>
          <BuilderTabButton active={tab === "all"} onClick={() => setTab("all")}>
            All Available
          </BuilderTabButton>
          <BuilderTabButton active={tab === "my-picks"} onClick={() => setTab("my-picks")}>
            My Parlay
          </BuilderTabButton>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="space-y-5">
          <div className="rounded-lg border border-line bg-field-900/80 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">
                  {tab === "my-picks" ? "Selected legs" : tab === "all" ? "Available AI legs" : "Top AI legs"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {picks.length} real line{picks.length === 1 ? "" : "s"} found for this filter.
                </p>
              </div>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-300">
                {sportOptions.find((option) => option.key === sportFilter)?.label ?? "All Sports"}
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-line">
              {visiblePicks.length === 0 ? (
                <div className="p-6 text-slate-400">No real parlay legs are available from the current feed.</div>
              ) : (
                visiblePicks.map((pick) => {
                  const active = selectedIds.includes(pick.id);

                  return (
                    <button
                      key={pick.id}
                      type="button"
                      onClick={() => togglePick(pick.id)}
                      className="flex w-full items-center gap-4 border-b border-line/80 p-5 text-left transition hover:bg-white/[0.03] last:border-b-0"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                          active ? "border-green-400 bg-green-400/15 text-green-300" : "border-white/15 text-slate-600"
                        }`}
                      >
                        {active && <Check size={18} />}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xl font-black text-white">{pick.pick.replace(" ML", "")}</span>
                        <span className="mt-1 block text-sm font-medium text-slate-400">{pick.market}</span>
                        <span className="mt-2 block truncate text-xs text-slate-500">
                          {pick.game.awayTeam} at {pick.game.homeTeam} · {pick.confidence}% AI confidence · +{pick.edge}% edge
                        </span>
                      </span>

                      <span className="shrink-0 rounded-lg border border-line bg-white/[0.04] px-4 py-3 text-center text-xl font-black text-white">
                        {formatOdds(pick.odds)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <details className="rounded-lg border border-line bg-field-900/80 p-5">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">Create your own parlay leg</h2>
                  <p className="mt-1 text-sm text-slate-500">Open this if you want to add a custom researched pick.</p>
                </div>
                <span className="rounded-full bg-green-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-300">
                  Custom
                </span>
              </div>
            </summary>

            <div className="mt-5">
            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.6fr]">
              <input
                value={customPick}
                onChange={(event) => setCustomPick(event.target.value)}
                placeholder="Pick name, team, or player"
                className="rounded-lg border border-line bg-field-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
              />
              <input
                value={customMarket}
                onChange={(event) => setCustomMarket(event.target.value)}
                placeholder="Market"
                className="rounded-lg border border-line bg-field-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
              />
              <input
                value={customOdds}
                onChange={(event) => setCustomOdds(event.target.value)}
                placeholder="Odds e.g. -150"
                className="rounded-lg border border-line bg-field-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <select
                value={customBook}
                onChange={(event) => setCustomBook(event.target.value)}
                className="rounded-lg border border-line bg-field-950 px-3 py-3 text-sm text-white outline-none"
              >
                {preferredSportsbooks.map((book) => (
                  <option key={book} value={book} className="bg-field-950">
                    {book}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addCustomLeg}
                className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-sm font-black text-white hover:bg-green-400"
              >
                <Plus size={16} />
                Add custom leg
              </button>
            </div>

            {customLegs.length > 0 && (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {customLegs.map((leg) => (
                  <div key={leg.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.04] px-3 py-3">
                    <div>
                      <p className="text-sm font-bold text-white">{leg.pick}</p>
                      <p className="text-xs text-slate-500">
                        {leg.market} · {leg.sportsbook} · {formatOdds(leg.odds)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomLegs((legs) => legs.filter((item) => item.id !== leg.id));
                        setAiOutcome("");
                      }}
                      className="text-sm font-bold text-red-300 hover:text-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            </div>
          </details>
        </div>

        <aside className="h-fit rounded-lg border border-line bg-field-900/85 p-6 xl:sticky xl:top-6">
          <h2 className="text-2xl font-black text-white">Parlay Summary</h2>
          <p className="mt-4 text-lg text-slate-300">{parlayLegs.length} Picks</p>

          <div className="mt-8 space-y-5">
            <SummaryRow
              label="Combined Odds"
              value={<span className="text-green-400">{formatOdds(summary.combinedOdds)}</span>}
            />
            <div className="h-px bg-line" />
            <SummaryRow label="Win Probability" value={<span className="text-amber-300">{summary.winProbability}%</span>} />
            <SummaryRow label="Potential Payout" value={<span className="text-green-400">{formatCurrency(summary.payout)}</span>} />
          </div>

          <button
            type="button"
            onClick={runOutcome}
            disabled={parlayLegs.length === 0}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-4 text-base font-black text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            <Sparkles size={18} />
            Run AI Outcome
          </button>

          <button
            type="button"
            onClick={optimize}
            disabled={picks.length === 0}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white/[0.08] px-4 py-4 text-base font-semibold text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            <Sparkles size={18} />
            Optimize AI Picks
          </button>

          <button
            type="button"
            onClick={() => {
              setSelected([]);
              setCustomLegs([]);
              setAiOutcome("");
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white/[0.06] px-4 py-4 text-base font-semibold text-white transition hover:bg-white/[0.1]"
          >
            <Trash2 size={17} />
            Clear all
          </button>

          <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-green-300">AI Insight</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              This card is evaluated from selected live lines and your custom odds. Sport filters help keep a parlay focused instead of mixing unrelated slates.
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <InsightLine text="All picks must stay on real listed odds" />
              <InsightLine text="Custom picks use implied probability from entered odds" />
              <InsightLine text="No real-money bet placement" />
            </div>
          </div>

          {aiOutcome && (
            <div className="mt-5 rounded-lg border border-green-400/20 bg-green-400/10 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-green-300">AI outcome read</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{aiOutcome}</p>
            </div>
          )}

          <p className="mt-5 text-xs leading-5 text-slate-500">
            Analytics only. This builder does not place bets or connect to sportsbook checkout.
          </p>
        </aside>
      </section>
    </div>
  );
}

function InsightLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check size={14} className="text-green-400" />
      <span>{text}</span>
    </div>
  );
}

function BuilderTabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-1 pb-4 text-lg font-bold transition ${
        active ? "border-green-400 text-white" : "border-transparent text-slate-500 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-slate-300">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function sportKey(game: GameOdds) {
  return (game.sport || game.league || "other").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function sportLabel(game: GameOdds) {
  const value = game.sport || game.league || "Other";
  return value
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function buildSportOptions(games: GameOdds[]) {
  const counts = new Map<string, { key: string; label: string; count: number }>();

  games.forEach((game) => {
    const key = sportKey(game);
    const existing = counts.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { key, label: sportLabel(game), count: 1 });
    }
  });

  return [
    { key: "all", label: "All Sports", count: games.length },
    ...Array.from(counts.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  ];
}

function summarizeParlay(picks: ParlayLeg[]) {
  if (picks.length === 0) {
    return { combinedOdds: 0, winProbability: 0, payout: 0 };
  }

  const decimalOdds = picks.reduce((total, pick) => total * americanToDecimal(pick.odds), 1);
  const probability = picks.reduce((total, pick) => total * (pick.confidence / 100), 1);

  return {
    combinedOdds: decimalToAmerican(decimalOdds),
    winProbability: Math.max(1, Math.min(99, Math.round(probability * 100))),
    payout: Math.max(0, Math.round((decimalOdds - 1) * 100))
  };
}

function impliedProbabilityFromAmerican(odds: number) {
  if (odds === 0) return 0;
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
}

function buildOutcomeRead(picks: ParlayLeg[], summary: ReturnType<typeof summarizeParlay>) {
  if (picks.length === 0) return "";

  const weakest = [...picks].sort((a, b) => a.confidence - b.confidence)[0];
  const strength = summary.winProbability >= 30 ? "strong for a parlay" : summary.winProbability >= 15 ? "moderate" : "high-risk";
  const customCount = picks.filter((pick) => pick.id.startsWith("custom-")).length;

  return `${picks.length}-leg card grades as ${strength} with an estimated ${summary.winProbability}% hit rate. ${
    weakest ? `Biggest risk is ${weakest.pick} at ${weakest.confidence}% confidence.` : ""
  } ${customCount > 0 ? "Custom legs are evaluated from the odds you entered, so connect deeper research data before treating them like model-confirmed picks." : "All legs came from the live AI-ranked board."}`;
}

function americanToDecimal(odds: number) {
  if (odds === 0) return 1;
  return odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
}

function decimalToAmerican(decimal: number) {
  if (decimal <= 1) return 0;
  return decimal >= 2 ? Math.round((decimal - 1) * 100) : Math.round(-100 / (decimal - 1));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}
