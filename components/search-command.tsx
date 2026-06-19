"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { GameOdds, PlayerProp } from "@/lib/types";

export function SearchCommand({ games, props }: { games: GameOdds[]; props: PlayerProp[] }) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];

    const gameMatches = games
      .filter((game) =>
        `${game.awayTeam} ${game.homeTeam} ${game.league} ${game.sport}`.toLowerCase().includes(value)
      )
      .slice(0, 8)
      .map((game) => ({
        id: game.id,
        label: `${game.awayTeam} at ${game.homeTeam}`,
        detail: `${game.league} matchup`,
        href: `/sportsbook/${game.id}`
      }));

    const propMatches = props
      .filter((prop) =>
        `${prop.player} ${prop.team} ${prop.market} ${prop.sportsbook}`.toLowerCase().includes(value)
      )
      .slice(0, 8)
      .map((prop) => ({
        id: prop.id,
        label: prop.player,
        detail: `${prop.market} prop on ${prop.sportsbook}`,
        href: `/sportsbook/${prop.gameId}?props=1`
      }));

    return [...gameMatches, ...propMatches].slice(0, 10);
  }, [games, props, query]);

  function submit() {
    const first = matches[0];
    if (first) window.location.href = first.href;
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-lg border border-line bg-field-900/90 px-4 py-3">
        <Search size={19} className="text-slate-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
          placeholder="Quick search teams, players, matchups, or props"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
      </div>

      {matches.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-line bg-field-950 shadow-2xl">
          {matches.map((match) => (
            <button
              key={match.id}
              type="button"
              onClick={() => {
                window.location.href = match.href;
              }}
              className="block w-full px-4 py-3 text-left hover:bg-white/5"
            >
              <p className="font-medium text-white">{match.label}</p>
              <p className="mt-1 text-xs text-slate-500">{match.detail}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
