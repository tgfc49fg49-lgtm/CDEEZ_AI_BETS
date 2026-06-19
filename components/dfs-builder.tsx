"use client";

import { Calculator, ChevronDown, Lock, Search, Trash2, Upload, Wand2, X } from "lucide-react";
import { useMemo, useState } from "react";

type DfsPlayer = {
  id: string;
  name: string;
  team: string;
  opponent: string;
  position: string;
  salary: number;
  projection: number;
  projectionSource: "csv" | "salary";
  locked: boolean;
  excluded: boolean;
};

type RosterTemplate = {
  budget: number;
  slots: string[];
  eligible: Record<string, string[]>;
};

type DfsStrategy = "balanced" | "cash" | "tournament";
type LineupPick = { slot: string; player: DfsPlayer };

type LineupResult = {
  selected: LineupPick[];
  spent: number;
  projection: number;
  openSlots: number;
  score: number;
  valueScore: number;
  correlationScore: number;
};

const rosterTemplates: Record<string, RosterTemplate> = {
  "NBA Classic": {
    budget: 50000,
    slots: ["PG", "SG", "SF", "PF", "C", "G", "F", "UTIL"],
    eligible: {
      PG: ["PG"],
      SG: ["SG"],
      SF: ["SF"],
      PF: ["PF"],
      C: ["C"],
      G: ["PG", "SG"],
      F: ["SF", "PF"],
      UTIL: ["PG", "SG", "SF", "PF", "C"]
    }
  },
  "NFL Classic": {
    budget: 50000,
    slots: ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "FLEX", "DST"],
    eligible: {
      QB: ["QB"],
      RB: ["RB"],
      WR: ["WR"],
      TE: ["TE"],
      FLEX: ["RB", "WR", "TE"],
      DST: ["DST"]
    }
  },
  "MLB Classic": {
    budget: 50000,
    slots: ["P", "P", "C/1B", "2B", "3B", "SS", "OF", "OF", "OF"],
    eligible: {
      P: ["P"],
      "C/1B": ["C", "1B"],
      "2B": ["2B"],
      "3B": ["3B"],
      SS: ["SS"],
      OF: ["OF"]
    }
  },
  "PGA Showdown": {
    budget: 50000,
    slots: ["GOLFER", "GOLFER", "GOLFER", "GOLFER", "GOLFER", "GOLFER"],
    eligible: { GOLFER: ["GOLFER"] }
  },
  UFC: {
    budget: 50000,
    slots: ["F", "F", "F", "F", "F", "F"],
    eligible: { F: ["F"] }
  },
  "NASCAR / F1": {
    budget: 50000,
    slots: ["D", "D", "D", "D", "D", "D"],
    eligible: { D: ["D", "DRIVER"] }
  }
};

const siteOptions = ["DraftKings", "FanDuel", "PrizePicks", "Underdog"];

const slotAliases: Record<string, string[]> = {
  G: ["PG", "SG", "G"],
  F: ["SF", "PF", "F"],
  FLEX: ["RB", "WR", "TE", "FLEX"],
  UTIL: ["PG", "SG", "SF", "PF", "C", "G", "F", "UTIL"],
  "C/1B": ["C", "1B", "C/1B"],
  D: ["D", "DRIVER"],
  GOLFER: ["GOLFER"]
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function parseMoney(value: string | undefined) {
  const parsed = Number((value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseNumber(value: string | undefined) {
  const parsed = Number((value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function salaryProjection(salary: number, templateName: string) {
  if (salary <= 0) return 0;
  const multiplier = templateName.includes("MLB")
    ? 1.15
    : templateName.includes("PGA") || templateName.includes("NASCAR")
      ? 5.8
      : templateName.includes("UFC")
        ? 6.2
        : 4.2;

  return Number(((salary / 1000) * multiplier).toFixed(1));
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function findColumn(header: string[], names: string[]) {
  return header.findIndex((cell) => names.includes(cell));
}

function scorePlayer(player: DfsPlayer) {
  if (player.salary <= 0) return 0;
  return player.projection / (player.salary / 1000);
}

function playerAiScore(player: DfsPlayer, strategy: DfsStrategy) {
  const value = scorePlayer(player);
  const salaryEfficiency = player.salary > 0 ? Math.max(0, 10 - player.salary / 1500) : 0;

  if (strategy === "cash") {
    return player.projection * 1.2 + value * 1.4 + salaryEfficiency * 0.45;
  }

  if (strategy === "tournament") {
    return player.projection * 1.35 + value * 0.7 + Math.sqrt(Math.max(player.projection, 0)) * 1.8;
  }

  return player.projection * 1.15 + value + salaryEfficiency * 0.25;
}

function canUse(slot: string, player: DfsPlayer, template: RosterTemplate) {
  const positionParts = player.position.toUpperCase().split(/[/:, ]+/).filter(Boolean);
  const eligible = (template.eligible[slot] ?? [slot]).flatMap((item) => slotAliases[item] ?? [item]);
  return eligible.some((item) => positionParts.includes(item) || player.position.toUpperCase().includes(item));
}

function evaluateLineup(selected: LineupPick[], spent: number, budget: number, strategy: DfsStrategy): LineupResult {
  const projection = selected.reduce((total, pick) => total + pick.player.projection, 0);
  const valueScore = selected.reduce((total, pick) => total + scorePlayer(pick.player), 0);
  const teams = selected.reduce<Record<string, number>>((counts, pick) => {
    if (!pick.player.team) return counts;
    counts[pick.player.team] = (counts[pick.player.team] ?? 0) + 1;
    return counts;
  }, {});
  const stackBonus = Object.values(teams).reduce((total, count) => total + Math.max(0, count - 1), 0);
  const overStackPenalty = Object.values(teams).reduce((total, count) => total + Math.max(0, count - 3) * 1.5, 0);
  const correlationScore = Math.max(0, stackBonus * (strategy === "tournament" ? 2.3 : 1.1) - overStackPenalty);
  const remaining = budget - spent;
  const salaryDiscipline =
    remaining < 0
      ? -80
      : remaining <= budget * 0.12
        ? 5
        : Math.max(-10, 5 - (remaining / budget) * 80);
  const score =
    projection * (strategy === "tournament" ? 3.35 : 3.05) +
    valueScore * (strategy === "cash" ? 1.75 : 1.25) +
    correlationScore +
    salaryDiscipline;

  return {
    selected,
    spent,
    projection,
    openSlots: 0,
    score,
    valueScore,
    correlationScore
  };
}

function emptyLineup(template: RosterTemplate): LineupResult {
  return {
    selected: [],
    spent: 0,
    projection: 0,
    openSlots: template.slots.length,
    score: 0,
    valueScore: 0,
    correlationScore: 0
  };
}

function optimizeLineup(
  players: DfsPlayer[],
  template: RosterTemplate,
  budget: number,
  strategy: DfsStrategy,
  diversityAgainst: Set<string> = new Set()
) {
  const usable = players.filter((player) => !player.excluded && player.salary > 0 && player.projection > 0);
  const lockedIds = usable.filter((player) => player.locked).map((player) => player.id);

  if (usable.length === 0) return emptyLineup(template);

  type SearchState = { selected: LineupPick[]; spent: number; used: Set<string> };
  let states: SearchState[] = [{ selected: [], spent: 0, used: new Set<string>() }];

  template.slots.forEach((slot, index) => {
    const slotKey = `${slot}-${index}`;
    const candidates = usable
      .filter((player) => canUse(slot, player, template))
      .sort((a, b) => playerAiScore(b, strategy) - playerAiScore(a, strategy))
      .slice(0, 30);
    const nextStates: SearchState[] = [];

    states.forEach((state) => {
      candidates.forEach((player) => {
        if (state.used.has(player.id) || state.spent + player.salary > budget) return;

        nextStates.push({
          selected: [...state.selected, { slot: slotKey, player }],
          spent: state.spent + player.salary,
          used: new Set([...Array.from(state.used), player.id])
        });
      });
    });

    states = nextStates
      .sort((a, b) => {
        const aScore = evaluateLineup(a.selected, a.spent, budget, strategy).score;
        const bScore = evaluateLineup(b.selected, b.spent, budget, strategy).score;
        return bScore - aScore;
      })
      .slice(0, 150);
  });

  const fullBuilds = states
    .filter((state) => state.selected.length === template.slots.length)
    .filter((state) => lockedIds.every((id) => state.used.has(id)));
  const pool = fullBuilds.length > 0 ? fullBuilds : states;
  const best = pool
    .map((state) => {
      const result = evaluateLineup(state.selected, state.spent, budget, strategy);
      const overlapPenalty = result.selected.filter((pick) => diversityAgainst.has(pick.player.id) && !pick.player.locked).length * 18;
      return { ...result, score: result.score - overlapPenalty };
    })
    .sort((a, b) => b.score - a.score)[0];

  return best ? { ...best, openSlots: Math.max(0, template.slots.length - best.selected.length) } : emptyLineup(template);
}

function optimizeLineups(players: DfsPlayer[], template: RosterTemplate, budget: number, strategy: DfsStrategy) {
  const primary = optimizeLineup(players, template, budget, strategy);
  const primaryIds = new Set(primary.selected.map((pick) => pick.player.id));
  const secondary = optimizeLineup(players, template, budget, strategy, primaryIds);

  return [
    { name: "AI Lineup 1", note: "Highest model score", lineup: primary },
    { name: "AI Lineup 2", note: "Alternative build with less overlap", lineup: secondary }
  ];
}

function lineupReasons(lineup: LineupResult, budget: number, strategy: DfsStrategy) {
  if (lineup.selected.length === 0) {
    return ["Upload a CSV with enough eligible players to build this lineup."];
  }

  const sortedByProjection = [...lineup.selected].sort((a, b) => b.player.projection - a.player.projection);
  const sortedByValue = [...lineup.selected].sort((a, b) => scorePlayer(b.player) - scorePlayer(a.player));
  const topProjection = sortedByProjection[0]?.player;
  const topValue = sortedByValue[0]?.player;
  const lockedCount = lineup.selected.filter((pick) => pick.player.locked).length;
  const remaining = budget - lineup.spent;
  const reasons = [
    `${topProjection?.name ?? "Top play"} anchors the build with the strongest projection in this lineup.`,
    `${topValue?.name ?? "Best value"} gives the model its best salary-adjusted value.`
  ];

  if (lockedCount > 0) {
    reasons.push(`Includes ${lockedCount} locked player${lockedCount === 1 ? "" : "s"} while still fitting the cap.`);
  } else if (lineup.correlationScore > 0) {
    reasons.push(`Adds correlation from players grouped by team or matchup.`);
  } else if (remaining > 0) {
    reasons.push(`Leaves $${remaining.toLocaleString()} unused because the lower-cost build scored better.`);
  } else {
    reasons.push(`${strategy === "tournament" ? "Prioritizes ceiling" : strategy === "cash" ? "Prioritizes floor and value" : "Balances projection and value"} across the full roster.`);
  }

  return reasons.slice(0, 3);
}

export function DfsBuilder() {
  const [site, setSite] = useState(siteOptions[0]);
  const [templateName, setTemplateName] = useState("NBA Classic");
  const [budget, setBudget] = useState(rosterTemplates["NBA Classic"].budget);
  const [strategy, setStrategy] = useState<DfsStrategy>("balanced");
  const [players, setPlayers] = useState<DfsPlayer[]>([]);
  const [query, setQuery] = useState("");
  const [fileName, setFileName] = useState("");
  const [lastOptimizedAt, setLastOptimizedAt] = useState("Not run yet");

  const template = rosterTemplates[templateName];
  const lineups = useMemo(() => optimizeLineups(players, template, budget, strategy), [budget, players, strategy, template]);
  const usableCount = players.filter((player) => !player.excluded && player.salary > 0 && player.projection > 0).length;
  const filteredPlayers = players
    .filter((player) => `${player.name} ${player.team} ${player.opponent} ${player.position}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b.locked) - Number(a.locked) || playerAiScore(b, strategy) - playerAiScore(a, strategy));

  function updateTemplate(nextTemplate: string) {
    const selectedTemplate = rosterTemplates[nextTemplate];
    setTemplateName(nextTemplate);
    setBudget(selectedTemplate.budget);
  }

  async function readCsv(file: File) {
    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(Boolean);
    const header = splitCsvLine(rows[0]).map((cell) => cell.trim().toLowerCase().replace(/\s+/g, ""));
    const nameIndex = findColumn(header, ["name", "player", "playername", "nickname"]);
    const positionIndex = findColumn(header, ["position", "pos", "rosterposition", "rosterpositions"]);
    const salaryIndex = findColumn(header, ["salary", "cost"]);
    const projectionIndex = findColumn(header, [
      "projection",
      "projected",
      "proj",
      "fpts",
      "points",
      "avgpoints",
      "avgpointspergame",
      "avgfpts",
      "fppg"
    ]);
    const teamIndex = findColumn(header, ["team", "tm", "teamabbr", "abbrev"]);
    const opponentIndex = findColumn(header, ["opponent", "opp", "matchup", "gameinfo"]);

    const imported = rows
      .slice(1)
      .map((row, index) => {
        const cells = splitCsvLine(row);
        const name = cells[nameIndex] || `Player ${index + 1}`;
        const salary = parseMoney(cells[salaryIndex]);
        const csvProjection = parseNumber(cells[projectionIndex]);
        const projection = csvProjection > 0 ? csvProjection : salaryProjection(salary, templateName);

        return {
          id: uid(),
          name,
          position: (cells[positionIndex] || "UTIL").toUpperCase(),
          team: cells[teamIndex] || "",
          opponent: cells[opponentIndex] || "",
          salary,
          projection,
          projectionSource: csvProjection > 0 ? ("csv" as const) : ("salary" as const),
          locked: false,
          excluded: false
        };
      })
      .filter((player) => player.name && player.salary > 0);

    setPlayers(imported);
    setFileName(file.name);
    setLastOptimizedAt("Not run yet");
  }

  function togglePlayer(id: string, key: "locked" | "excluded") {
    setPlayers((current) =>
      current.map((player) =>
        player.id === id
          ? {
              ...player,
              [key]: !player[key],
              ...(key === "locked" ? { excluded: false } : { locked: false })
            }
          : player
      )
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-line bg-field-900/80 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            <Calculator size={16} />
            DFS setup
          </div>

          <div className="mt-4 grid gap-3">
            <label className="text-sm text-slate-300">
              DFS app
              <select
                value={site}
                onChange={(event) => setSite(event.target.value)}
                className="mt-2 w-full rounded-lg border border-line bg-black/30 px-3 py-2 text-white outline-none focus:border-accent"
              >
                {siteOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Sport / contest type
              <select
                value={templateName}
                onChange={(event) => updateTemplate(event.target.value)}
                className="mt-2 w-full rounded-lg border border-line bg-black/30 px-3 py-2 text-white outline-none focus:border-accent"
              >
                {Object.keys(rosterTemplates).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Salary cap
              <input
                type="number"
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
                className="mt-2 w-full rounded-lg border border-line bg-black/30 px-3 py-2 text-white outline-none focus:border-accent"
              />
            </label>

            <label className="text-sm text-slate-300">
              Lineup strategy
              <select
                value={strategy}
                onChange={(event) => setStrategy(event.target.value as DfsStrategy)}
                className="mt-2 w-full rounded-lg border border-line bg-black/30 px-3 py-2 text-white outline-none focus:border-accent"
              >
                <option value="balanced">Balanced AI build</option>
                <option value="cash">Cash / safer floor</option>
                <option value="tournament">Tournament / ceiling</option>
              </select>
            </label>
          </div>
        </section>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-accent/40 bg-field-900/70 p-8 text-center">
          <Upload className="text-accent" size={28} />
          <span className="mt-3 font-semibold text-white">Upload salary CSV</span>
          <span className="mt-1 text-sm text-slate-500">
            Use a real {site} slate export. Projection/avg points are used when present; otherwise the model estimates from salary.
          </span>
          {fileName ? <span className="mt-3 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">{fileName}</span> : null}
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void readCsv(file);
            }}
          />
        </label>

        <div className="rounded-lg border border-line bg-field-900/70 p-4 text-sm text-slate-400">
          <p className="font-semibold text-white">CSV is the source of truth</p>
          <p className="mt-2">
            No fake pool and no live prop import. The optimizer only uses the slate you upload, then lets you lock or exclude players.
          </p>
        </div>
      </aside>

      <section className="rounded-lg border border-line bg-field-900/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">AI predicted lineups</h2>
            <p className="mt-1 text-sm text-slate-400">
              {players.length > 0
                ? `${players.length} players loaded from CSV. Showing the two best model builds.`
                : "Upload a CSV to generate two strategic DFS lineups."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLastOptimizedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }))}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-bold text-field-950 transition hover:bg-accent/90"
          >
            <Wand2 size={17} />
            Optimize
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg bg-black/25 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Usable players</p>
            <p className="mt-1 text-lg font-bold text-white">{usableCount}</p>
          </div>
          <div className="rounded-lg bg-black/25 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Strategy</p>
            <p className="mt-1 text-lg font-bold capitalize text-white">{strategy}</p>
          </div>
          <div className="rounded-lg bg-black/25 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Salary cap</p>
            <p className="mt-1 text-lg font-bold text-white">${budget.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-black/25 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Last run</p>
            <p className="mt-1 text-lg font-bold text-accent">{lastOptimizedAt}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 2xl:grid-cols-2">
          {lineups.map(({ name, note, lineup }) => {
            const remainingBudget = budget - lineup.spent;
            return (
              <article key={name} className="rounded-lg border border-line bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{note}</p>
                  </div>
                  <div className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                    {lineup.openSlots === 0 ? "Complete" : `${lineup.openSlots} open`}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-field-900/80 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Projection</p>
                    <p className="mt-1 text-lg font-bold text-accent">{lineup.projection.toFixed(1)}</p>
                  </div>
                  <div className="rounded-lg bg-field-900/80 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Spent</p>
                    <p className="mt-1 text-lg font-bold text-white">${lineup.spent.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-field-900/80 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Remaining</p>
                    <p className={remainingBudget < 0 ? "mt-1 text-lg font-bold text-red-300" : "mt-1 text-lg font-bold text-white"}>
                      ${remainingBudget.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-field-900/80 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">AI score</p>
                    <p className="mt-1 text-lg font-bold text-white">{lineup.score.toFixed(1)}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {template.slots.map((slot, index) => {
                    const pick = lineup.selected.find((candidate) => candidate.slot === `${slot}-${index}`);
                    return (
                      <div key={`${name}-${slot}-${index}`} className="rounded-lg border border-line bg-field-900/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-accent">{slot}</p>
                            <p className="mt-1 font-semibold text-white">{pick?.player.name ?? "Open slot"}</p>
                            {pick ? <p className="text-xs text-slate-500">{pick.player.team || pick.player.position}</p> : null}
                          </div>
                          {pick ? (
                            <div className="text-right text-sm">
                              <p className="text-white">${pick.player.salary.toLocaleString()}</p>
                              <p className="text-slate-400">{pick.player.projection.toFixed(1)}</p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-lg border border-accent/20 bg-accent/10 p-3">
                  <p className="text-sm font-semibold text-white">Why this lineup</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-300">
                    {lineupReasons(lineup, budget, strategy).map((reason) => (
                      <li key={reason}>- {reason}</li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-accent/20 bg-accent/10 p-4 text-sm text-slate-300">
          <p className="font-semibold text-white">How it thinks</p>
          <p className="mt-2">
            The optimizer searches many legal CSV-based builds and scores projection, value, roster eligibility, locks, correlation,
            and salary flexibility. Lineup 2 is built with an overlap penalty so it gives you a different angle from the same slate.
          </p>
        </div>

        <details className="mt-5 rounded-lg border border-line bg-black/20">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-bold text-white">
            Uploaded player pool
            <span className="flex items-center gap-2 text-sm font-medium text-slate-400">
              {players.length} players
              <ChevronDown size={16} />
            </span>
          </summary>

          <div className="border-t border-line p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search uploaded players, teams, or positions"
                className="w-full rounded-lg border border-line bg-black/30 py-3 pl-10 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-accent"
              />
            </div>

            <div className="mt-4 max-h-[520px] overflow-auto rounded-lg border border-line">
              {filteredPlayers.length === 0 ? (
                <div className="bg-black/20 p-8 text-center text-slate-400">
                  No uploaded slate yet. Upload a salary CSV to build from real DFS players.
                </div>
              ) : (
                filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className={`grid gap-3 border-b border-line bg-black/20 p-4 last:border-b-0 xl:grid-cols-[70px_1fr_110px_110px_130px] ${
                      player.excluded ? "opacity-45" : ""
                    }`}
                  >
                    <div className="font-bold text-accent">{player.position}</div>
                    <div>
                      <p className="font-semibold text-white">{player.name}</p>
                      <p className="text-sm text-slate-500">
                        {player.team || "Team"} {player.opponent ? `vs ${player.opponent}` : ""}
                      </p>
                    </div>
                    <div className="text-slate-300">${player.salary.toLocaleString()}</div>
                    <div className="text-xs uppercase tracking-[0.12em] text-slate-500">
                      Projection
                      <p className="mt-2 text-sm font-semibold normal-case tracking-normal text-white">
                        {player.projection.toFixed(1)}
                        <span className="ml-2 text-xs font-medium text-slate-500">
                          {player.projectionSource === "csv" ? "CSV" : "model"}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => togglePlayer(player.id, "locked")}
                        title="Lock player"
                        className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                          player.locked ? "border-accent bg-accent/15 text-accent" : "border-line text-slate-400"
                        }`}
                      >
                        <Lock size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePlayer(player.id, "excluded")}
                        title="Exclude player"
                        className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                          player.excluded ? "border-red-500/50 bg-red-500/10 text-red-300" : "border-line text-slate-400"
                        }`}
                      >
                        <X size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayers((current) => current.filter((candidate) => candidate.id !== player.id))}
                        title="Remove player"
                        className="rounded-lg border border-line px-3 py-2 text-slate-400 hover:text-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
