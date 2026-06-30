import type { GameOdds } from "@/lib/types";

export function isSoccerGame(game: Pick<GameOdds, "sport" | "league">) {
  const text = `${game.sport} ${game.league}`.toLowerCase();
  return (
    text.includes("soccer") ||
    text.includes("world_cup") ||
    text.includes("club_world_cup") ||
    text.includes("mls") ||
    text.includes("epl") ||
    text.includes("liga") ||
    text.includes("serie_a") ||
    text.includes("bundesliga")
  );
}

export function isCombatGame(game: Pick<GameOdds, "sport" | "league">) {
  const text = `${game.sport} ${game.league}`.toLowerCase();
  return (
    text.includes("combat") ||
    text.includes("ufc") ||
    text.includes("mma") ||
    text.includes("boxing") ||
    text.includes("pfl") ||
    text.includes("bellator") ||
    text.includes("one")
  );
}

export function hasSpreadMarket(game: Pick<GameOdds, "sport" | "league">) {
  return !isCombatGame(game);
}

export function hasTotalMarket(game: Pick<GameOdds, "sport" | "league">) {
  return !isCombatGame(game);
}

export function spreadLabel(game: Pick<GameOdds, "sport" | "league">) {
  return isSoccerGame(game) ? "Spread" : "Spread";
}

export function totalLabel(game: Pick<GameOdds, "sport" | "league">) {
  return isSoccerGame(game) ? "Total Goals" : "Total";
}
