"use client";

import { useMemo, useState } from "react";
import { BrainCircuit, Check, Gauge, Layers3, Sparkles, Target, Trophy } from "lucide-react";
import {
  edgeFromMarket,
  expectedValueFromOdds,
  marketProbabilityFromOdds,
  playerPropPredictions,
  preferredSportsbooks,
  topGamePicks
} from "@/lib/analytics";
import { formatDateTime, formatOdds } from "@/lib/format";
import type { GameOdds, PlayerProp } from "@/lib/types";

type ParlayMode = "same-game" | "props" | "game-lines" | "mixed";
type GeneratedPick = ReturnType<typeof topGamePicks>[number];
type ParlayLeg = {
  id: string;
  label: string;
  market: string;
  odds: number;
  confidence: number;
  edge: number;
  book: string;
  type: "Game Line" | "Player Prop" | "Same Game";
  grade: string;
};

const modes: Array<{ id: ParlayMode; label: string; helper: string }> = [
  { id: "same-game", label: "Same Game", helper: "Correlation engine" },
  { id: "props", label: "Player Props", helper: "Projection engine" },
  { id: "game-lines", label: "Game Lines", helper: "EV betting engine" },
  { id: "mixed", label: "Mixed", helper: "Most popular" }
];

export function ParlayBuilder({ games }: { games: GameOdds[] }) {
  const [mode, setMode] = useState<ParlayMode>("mixed");
  const [sportFilter, setSportFilter] = useState("all");
  const [bookFilter, setBookFilter] = useState("DraftKings Priority");
  const [selectedGameId, setSelectedGameId] = useState(games[0]?.id ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sportOptions = useMemo(() => buildSportOptions(games), [games]);
  const filteredGames = useMemo(
    () => (sportFilter === "all" ? games : games.filter((game) => sportKey(game) === sportFilter)),
    [games, sportFilter]
  );
  const selectedGame = filteredGames.find((game) => game.id === selectedGameId) ?? filteredGames[0] ?? games[0];
  const gamePicks = useMemo(
    () => topGamePicks(filteredGames, 18, bookFilter === "DraftKings Priority" ? undefined : bookFilter),
    [filteredGames, bookFilter]
  );
  const props = useMemo(() => playerPropPredictions(filteredGames, 18), [filteredGames]);
  const sameGameLegs = useMemo(() => buildSameGameLegs(selectedGame, props, gamePicks), [selectedGame, props, gamePicks]);
  const propLegs = useMemo(() => props.slice(0, 12).map(propToLeg), [props]);
  const gameLineLegs = useMemo(() => gamePicks.slice(0, 12).map(gamePickToLeg), [gamePicks]);
  const suggestedLegs = mode === "same-game" ? sameGameLegs : mode === "props" ? propLegs : mode === "game-lines" ? gameLineLegs : buildMixedLegs(gameLineLegs, propLegs);
  const activeIds = selectedIds.length > 0 ? selectedIds : suggestedLegs.slice(0, mode === "same-game" ? 4 : 5).map((leg) => leg.id);
  const activeLegs = suggestedLegs.filter((leg) => activeIds.includes(leg.id));
  const summary = summarizeParlay(activeLegs);
  const health = parlayHealth(activeLegs, mode);
  const builds = generatedBuilds(suggestedLegs);

  function toggleLeg(id: string) {
    setSelectedIds((current) => {
      const base = current.length > 0 ? current : activeIds;
      return base.includes(id) ? base.filter((item) => item !== id) : [...base, id].slice(-8);
    });
  }

  function changeMode(nextMode: ParlayMode) {
    setMode(nextMode);
    setSelectedIds([]);
  }

  function changeSport(nextSport: string) {
    setSportFilter(nextSport);
    setSelectedIds([]);
    setSelectedGameId("");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-field-900/80 p-5">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-green-400">AI Parlay Builder</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeMode(item.id)}
              className={`rounded-lg border p-4 text-left transition ${
                mode === item.id
                  ? "border-green-400 bg-green-400/15 text-white shadow-glow"
                  : "border-line bg-black/20 text-slate-400 hover:text-white"
              }`}
            >
              <span className="block text-lg font-black">{item.label}</span>
              <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-slate-500">{item.helper}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-5">
          <div className="rounded-lg border border-line bg-field-900/80 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-black text-white">{titleForMode(mode)}</h1>
                <p className="mt-2 text-sm text-slate-400">{descriptionForMode(mode)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={sportFilter}
                  onChange={(event) => changeSport(event.target.value)}
                  className="rounded-lg border border-line bg-field-950 px-3 py-2 text-sm font-bold text-white outline-none"
                >
                  {sportOptions.map((option) => (
                    <option key={option.key} value={option.key} className="bg-field-950">
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
                <select
                  value={bookFilter}
                  onChange={(event) => {
                    setBookFilter(event.target.value);
                    setSelectedIds([]);
                  }}
                  className="rounded-lg border border-line bg-field-950 px-3 py-2 text-sm font-bold text-white outline-none"
                >
                  <option className="bg-field-950">DraftKings Priority</option>
                  {preferredSportsbooks.map((book) => (
                    <option key={book} className="bg-field-950">
                      {book}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {mode === "same-game" && selectedGame && (
            <SameGamePanel
              games={filteredGames}
              selectedGame={selectedGame}
              selectedGameId={selectedGame.id}
              onSelectGame={(id) => {
                setSelectedGameId(id);
                setSelectedIds([]);
              }}
              legs={sameGameLegs}
              activeIds={activeIds}
              onToggle={toggleLeg}
              summary={summary}
            />
          )}

          {mode === "props" && (
            <PropBuilderPanel legs={propLegs} activeIds={activeIds} onToggle={toggleLeg} summary={summary} />
          )}

          {mode === "game-lines" && (
            <GameLinePanel legs={gameLineLegs} activeIds={activeIds} onToggle={toggleLeg} summary={summary} />
          )}

          {mode === "mixed" && (
            <MixedPanel legs={suggestedLegs} activeIds={activeIds} onToggle={toggleLeg} summary={summary} />
          )}
        </main>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:h-fit">
          <ParlayHealth health={health} />
          <GeneratedBuilds builds={builds} onSelect={(ids) => setSelectedIds(ids)} />
          <div className="rounded-lg border border-line bg-field-900/80 p-5 text-xs leading-5 text-slate-500">
            Analytics only. This builder does not place bets or connect to sportsbook checkout.
          </div>
        </aside>
      </section>
    </div>
  );
}

function SameGamePanel({
  games,
  selectedGame,
  selectedGameId,
  onSelectGame,
  legs,
  activeIds,
  onToggle,
  summary
}: {
  games: GameOdds[];
  selectedGame: GameOdds;
  selectedGameId: string;
  onSelectGame: (id: string) => void;
  legs: ParlayLeg[];
  activeIds: string[];
  onToggle: (id: string) => void;
  summary: ReturnType<typeof summarizeParlay>;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-line bg-field-900/80 p-5">
        <h2 className="text-xl font-black text-white">Same Game Parlay Builder</h2>
        <select
          value={selectedGameId}
          onChange={(event) => onSelectGame(event.target.value)}
          className="mt-4 w-full rounded-lg border border-line bg-field-950 px-3 py-3 text-sm font-bold text-white outline-none"
        >
          {games.map((game) => (
            <option key={game.id} value={game.id} className="bg-field-950">
              {game.awayTeam} vs {game.homeTeam}
            </option>
          ))}
        </select>
        <div className="mt-4 rounded-lg bg-black/25 p-4">
          <p className="text-lg font-black text-white">{selectedGame.awayTeam} vs {selectedGame.homeTeam}</p>
          <p className="mt-1 text-sm text-slate-400">{formatDateTime(selectedGame.startsAt)}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{selectedGame.league}</p>
        </div>
        <CorrelationBox />
      </div>

      <div className="rounded-lg border border-green-400/25 bg-field-900/80 p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-green-400">AI Same Game Parlay</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Metric label="Confidence" value={`${summary.averageConfidence}`} />
          <Metric label="Expected Value" value={`${summary.expectedValue >= 0 ? "+" : ""}${summary.expectedValue}%`} accent />
          <Metric label="Projected Odds" value={formatOdds(summary.combinedOdds)} />
        </div>
        <LegList legs={legs} activeIds={activeIds} onToggle={onToggle} />
        <WhyBox
          items={[
            "Primary game result and supporting legs move in the same direction",
            "Selected props are tied to role, pace, and scoring environment",
            "Line value is strongest when the main pick and total agree",
            "Avoids mixing unrelated slates inside one same-game build"
          ]}
        />
      </div>
    </div>
  );
}

function PropBuilderPanel({
  legs,
  activeIds,
  onToggle,
  summary
}: {
  legs: ParlayLeg[];
  activeIds: string[];
  onToggle: (id: string) => void;
  summary: ReturnType<typeof summarizeParlay>;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="grid gap-4 md:grid-cols-2">
        {legs.length === 0 ? <EmptyState text="No real player props are available from the current feed." /> : legs.map((leg) => (
          <button
            key={leg.id}
            type="button"
            onClick={() => onToggle(leg.id)}
            className={`rounded-lg border p-4 text-left transition ${
              activeIds.includes(leg.id) ? "border-green-400 bg-green-400/10" : "border-line bg-field-900/80 hover:border-white/30"
            }`}
          >
            <p className="text-lg font-black text-white">{leg.label}</p>
            <p className="mt-1 text-sm text-slate-400">{leg.market}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="AI Projection" value={projectionLabel(leg)} />
              <Metric label="Confidence" value={`${leg.confidence}%`} accent />
            </div>
          </button>
        ))}
      </div>
      <CurrentPanel title="Current Prop Parlay" legs={legs.filter((leg) => activeIds.includes(leg.id))} summary={summary} />
    </div>
  );
}

function GameLinePanel({
  legs,
  activeIds,
  onToggle,
  summary
}: {
  legs: ParlayLeg[];
  activeIds: string[];
  onToggle: (id: string) => void;
  summary: ReturnType<typeof summarizeParlay>;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="rounded-lg border border-line bg-field-900/80 p-5">
        <h2 className="text-xl font-black text-white">Today&apos;s Highest EV Plays</h2>
        <LegList legs={legs} activeIds={activeIds} onToggle={onToggle} showMarket />
      </div>
      <CurrentPanel title={`${activeIds.length} Leg Line Parlay`} legs={legs.filter((leg) => activeIds.includes(leg.id))} summary={summary} />
    </div>
  );
}

function MixedPanel({
  legs,
  activeIds,
  onToggle,
  summary
}: {
  legs: ParlayLeg[];
  activeIds: string[];
  onToggle: (id: string) => void;
  summary: ReturnType<typeof summarizeParlay>;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="rounded-lg border border-line bg-field-900/80 p-5">
        <div className="flex items-center gap-2">
          <Layers3 className="text-green-400" size={20} />
          <h2 className="text-xl font-black text-white">Mixed AI Builder</h2>
        </div>
        <p className="mt-2 text-sm text-slate-400">Combines game lines, player props, and same-game style legs into one graded build.</p>
        <LegList legs={legs} activeIds={activeIds} onToggle={onToggle} showGrade />
      </div>
      <CurrentPanel title="Mixed Parlay" legs={legs.filter((leg) => activeIds.includes(leg.id))} summary={summary} showGrades />
    </div>
  );
}

function LegList({
  legs,
  activeIds,
  onToggle,
  showMarket = false,
  showGrade = false
}: {
  legs: ParlayLeg[];
  activeIds: string[];
  onToggle: (id: string) => void;
  showMarket?: boolean;
  showGrade?: boolean;
}) {
  if (legs.length === 0) return <EmptyState text="No real parlay legs are available from the current feed." />;

  return (
    <div className="mt-4 space-y-3">
      {legs.map((leg) => (
        <button
          key={leg.id}
          type="button"
          onClick={() => onToggle(leg.id)}
          className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${
            activeIds.includes(leg.id) ? "border-green-400 bg-green-400/10" : "border-line bg-black/20 hover:border-white/30"
          }`}
        >
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${activeIds.includes(leg.id) ? "border-green-400 text-green-400" : "border-white/20 text-slate-600"}`}>
            {activeIds.includes(leg.id) && <Check size={16} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-black text-white">{leg.label}</span>
            <span className="mt-1 block text-sm text-slate-400">{leg.market} · {leg.book}</span>
            {showMarket && (
              <span className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-400">
                <span>AI {leg.confidence}%</span>
                <span>Market {marketProbabilityFromOdds(leg.odds)}%</span>
                <span className="text-green-400">Edge +{leg.edge}%</span>
              </span>
            )}
          </span>
          {showGrade && <GradeBadge grade={leg.grade} />}
          <span className="font-black text-white">{formatOdds(leg.odds)}</span>
        </button>
      ))}
    </div>
  );
}

function CurrentPanel({ title, legs, summary, showGrades = false }: { title: string; legs: ParlayLeg[]; summary: ReturnType<typeof summarizeParlay>; showGrades?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-field-900/80 p-5">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {legs.length === 0 ? (
          <p className="text-sm text-slate-400">Select legs to build a parlay.</p>
        ) : (
          legs.map((leg) => (
            <div key={leg.id} className="flex items-center justify-between gap-3 rounded-lg bg-black/25 p-3">
              <div>
                <p className="font-bold text-white">✓ {leg.label}</p>
                <p className="text-xs text-slate-500">{leg.market}</p>
              </div>
              {showGrades ? <GradeBadge grade={leg.grade} /> : <span className="text-sm font-bold text-green-400">{leg.confidence}%</span>}
            </div>
          ))
        )}
      </div>
      <div className="mt-5 space-y-3 border-t border-line pt-4">
        <SummaryLine label="Odds" value={formatOdds(summary.combinedOdds)} />
        <SummaryLine label="AI Probability" value={`${summary.winProbability}%`} />
        <SummaryLine label="Sportsbook Probability" value={`${summary.marketProbability}%`} />
        <SummaryLine label="Edge" value={`${summary.edge >= 0 ? "+" : ""}${summary.edge}%`} accent />
        <SummaryLine label="Expected ROI" value={`${summary.expectedValue >= 0 ? "+" : ""}${summary.expectedValue}%`} accent />
      </div>
    </div>
  );
}

function ParlayHealth({ health }: { health: ReturnType<typeof parlayHealth> }) {
  return (
    <div className="rounded-lg border border-line bg-field-900/80 p-5">
      <div className="flex items-center gap-2">
        <Gauge size={18} className="text-green-400" />
        <h2 className="text-xl font-black text-white">AI Parlay Health</h2>
      </div>
      <div className="mt-4 space-y-3">
        <HealthBar label="Profitability" value={health.profitability} />
        <HealthBar label="Risk" value={health.risk} inverse />
        <HealthBar label="Correlation" value={health.correlation} />
        <HealthBar label="Sharp Money" value={health.sharpMoney} />
        <HealthBar label="Expected Value" value={health.expectedValue} />
      </div>
      <div className="mt-5 rounded-lg bg-green-400/10 p-4 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Overall Grade</p>
        <p className="mt-1 text-4xl font-black text-green-400">{health.grade}</p>
      </div>
    </div>
  );
}

function GeneratedBuilds({ builds, onSelect }: { builds: Array<{ name: string; odds: number; ids: string[] }>; onSelect: (ids: string[]) => void }) {
  return (
    <div className="rounded-lg border border-line bg-field-900/80 p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-green-400" />
        <h2 className="text-xl font-black text-white">AI Generated Versions</h2>
      </div>
      <div className="mt-4 grid gap-3">
        {builds.map((build) => (
          <button key={build.name} type="button" onClick={() => onSelect(build.ids)} className="flex items-center justify-between rounded-lg border border-line bg-black/20 p-3 text-left hover:border-green-400/50">
            <span className="font-bold text-white">{build.name}</span>
            <span className="font-black text-green-400">{formatOdds(build.odds)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CorrelationBox() {
  return (
    <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Correlation Analysis</p>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-white/[0.04] p-3">
        <span className="font-bold text-white">Main pick</span>
        <span className="text-green-400">↑</span>
        <span className="font-bold text-white">Support legs</span>
      </div>
      <p className="mt-3 text-sm text-slate-300">Positive correlation</p>
      <HealthBar label="Strength" value={82} />
    </div>
  );
}

function WhyBox({ items }: { items: string[] }) {
  return (
    <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Why this works</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <p key={item} className="text-sm text-slate-300">• {item}</p>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-black/25 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-1 font-black ${accent ? "text-green-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function SummaryLine({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`font-black ${accent ? "text-green-400" : "text-white"}`}>{value}</span>
    </div>
  );
}

function HealthBar({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const color = inverse && value > 60 ? "from-amber-400 to-red-400" : "from-electric to-green-400";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-bold text-white">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div className={`h-2 rounded-full bg-gradient-to-r ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const tone = grade.startsWith("A") ? "bg-green-400/15 text-green-300" : grade.startsWith("B") ? "bg-cyan/15 text-cyan" : "bg-amber-400/15 text-amber-300";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${tone}`}>{grade}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-line bg-field-900/80 p-6 text-slate-400">{text}</div>;
}

function titleForMode(mode: ParlayMode) {
  if (mode === "same-game") return "Same Game Parlay Builder";
  if (mode === "props") return "AI Prop Builder";
  if (mode === "game-lines") return "Game Line Builder";
  return "Mixed Parlay";
}

function descriptionForMode(mode: ParlayMode) {
  if (mode === "same-game") return "Choose one matchup and let the AI find legs that work together.";
  if (mode === "props") return "Build from AI-ranked player props with projection-style confidence.";
  if (mode === "game-lines") return "Pure moneyline and game-line value sorted by expected edge.";
  return "Combine game lines, player props, and same-game logic into one graded card.";
}

function gamePickToLeg(pick: GeneratedPick): ParlayLeg {
  const edge = Math.max(0, edgeFromMarket(pick.confidence, pick.odds));

  return {
    id: pick.id,
    label: pick.pick,
    market: `${pick.market} · ${pick.game.awayTeam} @ ${pick.game.homeTeam}`,
    odds: pick.odds,
    confidence: pick.confidence,
    edge,
    book: pick.sportsbook,
    type: "Game Line",
    grade: gradeFromConfidence(pick.confidence, edge)
  };
}

function propToLeg(prop: PlayerProp): ParlayLeg {
  return {
    id: prop.id,
    label: prop.player,
    market: `${cleanMarket(prop.market)} ${prop.line ? prop.line : ""}`.trim(),
    odds: prop.odds,
    confidence: prop.confidence,
    edge: prop.edge,
    book: prop.sportsbook,
    type: "Player Prop",
    grade: gradeFromConfidence(prop.confidence, prop.edge)
  };
}

function buildSameGameLegs(game: GameOdds | undefined, props: PlayerProp[], gamePicks: GeneratedPick[]) {
  if (!game) return [];
  const gamePick = gamePicks.find((pick) => pick.game.id === game.id) ?? gamePicks[0];
  const gameProps = props.filter((prop) => prop.gameId === game.id).slice(0, 5).map(propToLeg);
  const legs = gamePick ? [{ ...gamePickToLeg(gamePick), type: "Same Game" as const }, ...gameProps] : gameProps;

  return legs.slice(0, 8);
}

function buildMixedLegs(gameLines: ParlayLeg[], props: ParlayLeg[]) {
  const mixed: ParlayLeg[] = [];
  const maxLength = Math.max(gameLines.length, props.length);

  for (let index = 0; index < maxLength; index += 1) {
    if (gameLines[index]) mixed.push(gameLines[index]);
    if (props[index]) mixed.push(props[index]);
  }

  return mixed.slice(0, 18);
}

function generatedBuilds(legs: ParlayLeg[]) {
  const sorted = [...legs].sort((a, b) => b.confidence - a.confidence || b.edge - a.edge);
  const builds = [
    { name: "Safe Build", count: 2 },
    { name: "Balanced Build", count: 4 },
    { name: "Aggressive Build", count: 6 },
    { name: "Lottery Build", count: 8 }
  ];

  return builds.map((build, index) => {
    const selected = sorted.slice(index, index + build.count);
    return {
      name: build.name,
      odds: summarizeParlay(selected).combinedOdds,
      ids: selected.map((leg) => leg.id)
    };
  });
}

function summarizeParlay(legs: ParlayLeg[]) {
  if (legs.length === 0) {
    return { combinedOdds: 0, winProbability: 0, marketProbability: 0, edge: 0, expectedValue: 0, payout: 0, averageConfidence: 0 };
  }

  const decimalOdds = legs.reduce((total, leg) => total * americanToDecimal(leg.odds), 1);
  const aiProbability = legs.reduce((total, leg) => total * (leg.confidence / 100), 1) * 100;
  const marketProbability = legs.reduce((total, leg) => total * (marketProbabilityFromOdds(leg.odds) / 100), 1) * 100;
  const averageConfidence = Math.round(legs.reduce((total, leg) => total + leg.confidence, 0) / legs.length);
  const expectedValue = Number(((aiProbability / 100) * decimalOdds - 1).toFixed(3)) * 100;

  return {
    combinedOdds: decimalToAmerican(decimalOdds),
    winProbability: Number(aiProbability.toFixed(1)),
    marketProbability: Number(marketProbability.toFixed(1)),
    edge: Number((aiProbability - marketProbability).toFixed(1)),
    expectedValue: Number(expectedValue.toFixed(1)),
    payout: Math.max(0, Math.round((decimalOdds - 1) * 100)),
    averageConfidence
  };
}

function parlayHealth(legs: ParlayLeg[], mode: ParlayMode) {
  const summary = summarizeParlay(legs);
  const averageEdge = legs.length ? legs.reduce((total, leg) => total + leg.edge, 0) / legs.length : 0;
  const sameTypeCount = new Set(legs.map((leg) => leg.type)).size;
  const correlation = mode === "same-game" ? 82 : mode === "mixed" ? 42 : sameTypeCount <= 1 ? 56 : 28;
  const risk = Math.min(95, Math.max(18, legs.length * 10 + (summary.winProbability < 15 ? 18 : 0)));
  const profitability = Math.min(99, Math.max(20, Math.round(60 + averageEdge * 4 + Math.max(0, summary.expectedValue) / 2)));
  const sharpMoney = Math.min(96, Math.max(45, Math.round(70 + averageEdge * 2)));
  const expectedValue = Math.min(99, Math.max(25, Math.round(62 + Math.max(-10, summary.expectedValue))));
  const score = profitability * 0.35 + (100 - risk) * 0.15 + correlation * 0.15 + sharpMoney * 0.15 + expectedValue * 0.2;

  return {
    profitability,
    risk,
    correlation,
    sharpMoney,
    expectedValue,
    grade: score >= 88 ? "A+" : score >= 80 ? "A" : score >= 72 ? "A-" : score >= 64 ? "B+" : "B"
  };
}

function gradeFromConfidence(confidence: number, edge: number) {
  const score = confidence + edge * 2;
  if (score >= 88) return "A+";
  if (score >= 82) return "A";
  if (score >= 76) return "A-";
  if (score >= 70) return "B+";
  return "B";
}

function projectionLabel(leg: ParlayLeg) {
  const match = leg.market.match(/(-?\d+(\.\d+)?)/);
  const line = match ? Number(match[1]) : null;
  if (!line) return `${leg.confidence}%`;
  return `${Number((line * (1 + Math.max(0.04, leg.edge / 100))).toFixed(1))}`;
}

function cleanMarket(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/Over\/Under over/i, "Over")
    .replace(/Over\/Under under/i, "Under")
    .trim();
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

function americanToDecimal(odds: number) {
  if (odds === 0) return 1;
  return odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
}

function decimalToAmerican(decimal: number) {
  if (decimal <= 1) return 0;
  return decimal >= 2 ? Math.round((decimal - 1) * 100) : Math.round(-100 / (decimal - 1));
}
