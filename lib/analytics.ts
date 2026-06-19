import { dailyPicks } from "@/lib/mock-data";
import type { ArbitrageOpportunity, DailyPick, GameOdds, PlayerProp, SportsbookLine } from "@/lib/types";

export const preferredSportsbooks = ["DraftKings", "Underdog", "PrizePicks", "FanDuel"];

export function filteredLines(game: GameOdds) {
  const preferred = game.lines.filter((line) => preferredSportsbooks.includes(line.sportsbook));
  return preferred.length > 0 ? preferred : game.lines.slice(0, 4);
}

export function bestLine(game: GameOdds) {
  const lines = filteredLines(game);

  if (lines.length === 0) {
    return undefined;
  }

  const pick = game.prediction.pick.toLowerCase();
  const sidePrice = pick.includes(game.homeTeam.toLowerCase())
    ? (line: SportsbookLine) => line.homeMoneyline
    : pick.includes(game.awayTeam.toLowerCase())
      ? (line: SportsbookLine) => line.awayMoneyline
      : (line: SportsbookLine) => Math.max(line.homeMoneyline, line.awayMoneyline);

  return lines.reduce((best, line) => (sidePrice(line) > sidePrice(best) ? line : best), lines[0]);
}

function lineForSportsbook(game: GameOdds, sportsbook?: string) {
  const lines = filteredLines(game);
  if (!sportsbook) return bestLine(game);
  return lines.find((line) => line.sportsbook === sportsbook);
}

export function topGamePicks(games: GameOdds[], count: number, sportsbook?: string) {
  return games
    .map((game, index) => {
      const line = lineForSportsbook(game, sportsbook);

      if (!line) {
        return null;
      }

      const pick = game.prediction.pick;
      const market = pick.includes("ML") ? "Moneyline" : pick.includes("Over") || pick.includes("Under") ? "Total" : "Spread";

      return {
        id: `${game.id}-pick`,
        rank: index + 1,
        game,
        pick,
        market,
        sportsbook: sportsbook ?? line?.sportsbook ?? "DraftKings",
        odds: pick.includes(game.homeTeam) ? line?.homeMoneyline ?? 0 : line?.awayMoneyline ?? 0,
        confidence: Math.min(82, game.prediction.confidence + Math.min(index, 4)),
        edge: Number(Math.min(7.5, game.prediction.edge + Math.max(0, filteredLines(game).length - 1) * 0.25).toFixed(1)),
        evidence: `${filteredLines(game).length} preferred-book lines were compared. ${game.prediction.modelNote}`,
        researchFactors: game.prediction.researchFactors ?? []
      };
    })
    .filter((pick): pick is NonNullable<typeof pick> => Boolean(pick))
    .sort((a, b) => b.confidence - a.confidence || b.edge - a.edge)
    .slice(0, count)
    .map((pick, index) => ({ ...pick, rank: index + 1 }));
}

export function playerPropPredictions(games: GameOdds[], count: number): PlayerProp[] {
  const liveProps = games.flatMap((game) => game.playerProps ?? []);

  return liveProps
    .filter((prop) => prop.odds >= -500 && prop.odds <= 500 && prop.edge <= 10)
    .sort((a, b) => b.edge - a.edge || b.confidence - a.confidence)
    .slice(0, count);
}

function impliedProbability(odds: number) {
  if (odds === 0) return 1;
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
}

function bestBy(lines: SportsbookLine[], selector: (line: SportsbookLine) => number) {
  return lines.reduce((best, line) => (selector(line) > selector(best) ? line : best), lines[0]);
}

export function findArbitrages(games: GameOdds[]): ArbitrageOpportunity[] {
  return games
    .flatMap((game) => {
      const lines = filteredLines(game);
      if (lines.length < 2) return [];

      const away = bestBy(lines, (line) => line.awayMoneyline);
      const home = bestBy(lines, (line) => line.homeMoneyline);
      const totalProbability = impliedProbability(away.awayMoneyline) + impliedProbability(home.homeMoneyline);
      const edge = Number(((1 - totalProbability) * 100).toFixed(2));

      return [
        {
          id: `${game.id}-ml-arb`,
          game: `${game.awayTeam} at ${game.homeTeam}`,
          market: "Moneyline",
          sideA: game.awayTeam,
          bookA: away.sportsbook,
          oddsA: away.awayMoneyline,
          sideB: game.homeTeam,
          bookB: home.sportsbook,
          oddsB: home.homeMoneyline,
          edge
        }
      ];
    })
    .filter((item) => item.edge > -3)
    .sort((a, b) => b.edge - a.edge)
    .slice(0, 12);
}

export function buildParlayIdeas(games: GameOdds[], legs: number, sportsbook = "DraftKings") {
  const picks = topGamePicks(
    games.filter((game) => filteredLines(game).some((line) => line.sportsbook === sportsbook)),
    Math.max(legs * 5, 15),
    sportsbook
  );
  const safestPicks = [...picks].sort((a, b) => b.confidence - a.confidence || b.edge - a.edge);

  return Array.from({ length: 5 }, (_, index) => ({
    id: `parlay-${index + 1}`,
    name: `${sportsbook} lineup ${index + 1}`,
    legs: safestPicks.slice(index, index + legs),
    confidence:
      safestPicks.slice(index, index + legs).length > 0
        ? Math.max(
            40,
            Math.round(
              safestPicks.slice(index, index + legs).reduce((total, pick) => total + pick.confidence, 0) /
                safestPicks.slice(index, index + legs).length -
                legs * 2
            )
          )
        : 0,
    note:
      index % 2 === 0
        ? `Highest-confidence build using only ${sportsbook} lines.`
        : `Win-probability first build without mixing sportsbooks.`
  }));
}

export function dailyRecord(): { picks: DailyPick[]; wins: number; losses: number; pushes: number; pending: number } {
  const today = new Date().toISOString().slice(0, 10);
  const todayPicks = dailyPicks.filter((pick) => pick.submittedAt.slice(0, 10) === today);

  return {
    picks: dailyPicks,
    wins: todayPicks.filter((pick) => pick.status === "won").length,
    losses: todayPicks.filter((pick) => pick.status === "lost").length,
    pushes: todayPicks.filter((pick) => pick.status === "push").length,
    pending: todayPicks.filter((pick) => pick.status === "pending").length
  };
}
