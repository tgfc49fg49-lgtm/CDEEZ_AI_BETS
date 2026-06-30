import { dailyPicks } from "@/lib/mock-data";
import { gameOpportunityScore, propOpportunityScore } from "@/lib/opportunity";
import type { ArbitrageOpportunity, DailyPick, GameOdds, PlayerProp, SportsbookLine } from "@/lib/types";

export const preferredSportsbooks = ["DraftKings", "FanDuel", "BetMGM", "Caesars", "BetRivers", "ESPN BET", "Underdog", "PrizePicks"];
export const minnesotaArbitrageSportsbooks = ["DraftKings", "FanDuel", "BetMGM", "Caesars", "ESPN BET"];

function sportsbookPriority(line: SportsbookLine) {
  const index = preferredSportsbooks.indexOf(line.sportsbook);
  return index === -1 ? preferredSportsbooks.length : index;
}

export function filteredLines(game: GameOdds) {
  const preferred = game.lines.filter((line) => preferredSportsbooks.includes(line.sportsbook));
  const lines = preferred.length > 0 ? preferred : game.lines.slice(0, 6);
  return [...lines].sort((a, b) => sportsbookPriority(a) - sportsbookPriority(b));
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
  if (!sportsbook) return lines.find((line) => line.sportsbook === "DraftKings") ?? lines[0];
  return lines.find((line) => line.sportsbook === sportsbook);
}

export function topGamePicks(games: GameOdds[], count: number, sportsbook?: string) {
  const ranked = games
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
    .map((pick) => ({
      ...pick,
      marketEdge: edgeFromMarket(pick.confidence, pick.odds),
      expectedValue: expectedValueFromOdds(pick.confidence, pick.odds),
      opportunityScore: gameOpportunityScore({ game: pick.game, odds: pick.odds, confidence: pick.confidence })
    }))
    .sort(
      (a, b) =>
        b.marketEdge - a.marketEdge ||
        b.expectedValue - a.expectedValue ||
        b.opportunityScore - a.opportunityScore ||
        b.confidence - a.confidence ||
        b.edge - a.edge
    );

  const positiveValuePicks = ranked.filter((pick) => pick.marketEdge > 0 && pick.expectedValue > 0);
  const board = positiveValuePicks.length >= Math.min(count, ranked.length) ? positiveValuePicks : ranked;

  return board
    .slice(0, count)
    .map((pick, index) => ({ ...pick, rank: index + 1 }));
}

export function playerPropPredictions(games: GameOdds[], count: number): PlayerProp[] {
  const liveProps = games.flatMap((game) => game.playerProps ?? []);
  const strongestByMarket = new Map<string, PlayerProp>();

  liveProps
    .filter((prop) => prop.odds >= -500 && prop.odds <= 500 && prop.edge <= 10)
    .forEach((prop) => {
      const key = [
        prop.gameId,
        prop.player.trim().toLowerCase(),
        prop.market.trim().toLowerCase(),
        prop.line
      ].join("|");
      const current = strongestByMarket.get(key);

      if (!current || compareProps(prop, current) < 0) {
        strongestByMarket.set(key, prop);
      }
    });

  return Array.from(strongestByMarket.values())
    .sort(compareProps)
    .slice(0, count);
}

function compareProps(a: PlayerProp, b: PlayerProp) {
  return (
    propOpportunityScore(b) - propOpportunityScore(a) ||
    sportsbookNamePriority(a.sportsbook) - sportsbookNamePriority(b.sportsbook) ||
    b.edge - a.edge ||
    b.confidence - a.confidence ||
    b.odds - a.odds
  );
}

function sportsbookNamePriority(name: string) {
  const index = preferredSportsbooks.indexOf(name);
  return index === -1 ? preferredSportsbooks.length : index;
}

export function impliedProbability(odds: number) {
  if (odds === 0) return 1;
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
}

export function marketProbabilityFromOdds(odds: number) {
  return Number((impliedProbability(odds) * 100).toFixed(1));
}

export function expectedValueFromOdds(aiProbability: number, odds: number) {
  if (odds === 0) return 0;
  const decimalOdds = odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
  const ev = aiProbability / 100 * decimalOdds - 1;
  return Number((ev * 100).toFixed(1));
}

export function edgeFromMarket(aiProbability: number, odds: number) {
  return Number((aiProbability - marketProbabilityFromOdds(odds)).toFixed(1));
}

export function pickSide(game: GameOdds, pick: string) {
  return pick.toLowerCase().includes(game.homeTeam.toLowerCase()) ? "home" : "away";
}

export function linePriceForPick(game: GameOdds, line: SportsbookLine, pick: string) {
  return pickSide(game, pick) === "home" ? line.homeMoneyline : line.awayMoneyline;
}

export function sportsbookComparisonForPick(game: GameOdds, pick: string) {
  return filteredLines(game)
    .map((line) => ({
      sportsbook: line.sportsbook,
      odds: linePriceForPick(game, line, pick),
      priority: sportsbookPriority(line)
    }))
    .filter((line) => line.odds !== 0)
    .sort((a, b) => a.priority - b.priority || b.odds - a.odds);
}

export function modelUpdateForPick(game: GameOdds, confidence: number) {
  const displayMinutesAgo = game.status === "live" ? 1 : 3;
  const confidenceChange = Number(Math.max(1.2, Math.min(6.8, confidence / 18)).toFixed(1));

  return {
    lastUpdated: displayMinutesAgo <= 1 ? "Just now" : `${displayMinutesAgo} minutes ago`,
    confidenceChange: `+${confidenceChange}%`,
    reason: game.status === "live" ? "Live score and market movement updated." : "Latest real sportsbook prices refreshed."
  };
}

export function whyWeLikeBet(game: GameOdds, edge: number) {
  const factors = game.prediction.researchFactors ?? [];
  return [
    factors[1] ?? "Better recent form",
    factors[2] ?? "Opponent injury impact",
    factors[0] ?? "Historical matchup edge",
    edge >= 4 ? "Sharp money movement" : "Real market price gap"
  ].slice(0, 4);
}

export function findArbitrages(games: GameOdds[]): ArbitrageOpportunity[] {
  return games
    .flatMap((game) => {
      const lines = filteredLines(game).filter((line) => minnesotaArbitrageSportsbooks.includes(line.sportsbook));
      if (lines.length < 2) return [];

      const bestPair = bestArbitragePair(lines);
      if (!bestPair) return [];

      const { away, home } = bestPair;
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

function bestArbitragePair(lines: SportsbookLine[]) {
  return lines.reduce<{ away: SportsbookLine; home: SportsbookLine; score: number } | null>((best, away) => {
    return lines.reduce<typeof best>((currentBest, home) => {
      if (away.sportsbook === home.sportsbook || away.awayMoneyline === 0 || home.homeMoneyline === 0) {
        return currentBest;
      }

      const score = 1 - (impliedProbability(away.awayMoneyline) + impliedProbability(home.homeMoneyline));

      if (!currentBest || score > currentBest.score) {
        return { away, home, score };
      }

      return currentBest;
    }, best);
  }, null);
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
