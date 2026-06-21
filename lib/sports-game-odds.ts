import type { GameOdds, OddsSource, SportsbookLine } from "@/lib/types";

type OddsApiOutcome = {
  name: string;
  price?: number;
  point?: number;
};

type OddsApiMarket = {
  key: "h2h" | "spreads" | "totals" | string;
  outcomes?: OddsApiOutcome[];
};

type OddsApiBookmaker = {
  key: string;
  title: string;
  last_update?: string;
  markets?: OddsApiMarket[];
};

type OddsApiGame = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: OddsApiBookmaker[];
};

type OddsDiagnostics = {
  reason?: string;
  provider?: "the-odds-api";
  requestedSports?: string[];
  rawEvents?: number;
  normalizedEvents?: number;
  filteredEvents?: number;
  removedOutsideWindow?: number;
  removedWithoutPreferredLines?: number;
  responseStatuses?: Array<{ sport: string; status: number | "failed" }>;
  sampleBookmakers?: string[];
};

const defaultBaseUrl = "https://api.the-odds-api.com/v4";
const targetBookmakers = [
  "draftkings",
  "fanduel",
  "betmgm",
  "williamhill_us",
  "caesars",
  "betrivers",
  "espnbet",
  "underdog",
  "prizepicks"
];

const bookmakerDisplayNames: Record<string, string> = {
  draftkings: "DraftKings",
  fanduel: "FanDuel",
  betmgm: "BetMGM",
  williamhill_us: "Caesars",
  caesars: "Caesars",
  betrivers: "BetRivers",
  espnbet: "ESPN BET",
  underdog: "Underdog",
  prizepicks: "PrizePicks"
};

const sportRequests = [
  { league: "NFL", sport: "Football", key: "americanfootball_nfl" },
  { league: "NCAAF", sport: "Football", key: "americanfootball_ncaaf" },
  { league: "CFL", sport: "Football", key: "americanfootball_cfl" },
  { league: "NBA", sport: "Basketball", key: "basketball_nba" },
  { league: "WNBA", sport: "Basketball", key: "basketball_wnba" },
  { league: "NCAAB", sport: "Basketball", key: "basketball_ncaab" },
  { league: "MLB", sport: "Baseball", key: "baseball_mlb" },
  { league: "KBO", sport: "Baseball", key: "baseball_kbo" },
  { league: "NPB", sport: "Baseball", key: "baseball_npb" },
  { league: "NHL", sport: "Hockey", key: "icehockey_nhl" },
  { league: "MLS", sport: "Soccer", key: "soccer_usa_mls" },
  { league: "WORLD_CUP", sport: "Soccer", key: "soccer_fifa_world_cup" },
  { league: "WOMENS_WORLD_CUP", sport: "Soccer", key: "soccer_fifa_world_cup_womens" },
  { league: "CLUB_WORLD_CUP", sport: "Soccer", key: "soccer_fifa_club_world_cup" },
  { league: "EPL", sport: "Soccer", key: "soccer_epl" },
  { league: "UCL", sport: "Soccer", key: "soccer_uefa_champs_league" },
  { league: "UEL", sport: "Soccer", key: "soccer_uefa_europa_league" },
  { league: "LALIGA", sport: "Soccer", key: "soccer_spain_la_liga" },
  { league: "SERIE_A", sport: "Soccer", key: "soccer_italy_serie_a" },
  { league: "BUNDESLIGA", sport: "Soccer", key: "soccer_germany_bundesliga" },
  { league: "LIGUE_1", sport: "Soccer", key: "soccer_france_ligue_one" },
  { league: "LIGA_MX", sport: "Soccer", key: "soccer_mexico_ligamx" },
  { league: "UFC", sport: "Combat", key: "mma_mixed_martial_arts" }
];

function formatBookmakerName(key: string, fallback: string) {
  return bookmakerDisplayNames[key] ?? fallback;
}

function bookmakerPriority(bookmaker: OddsApiBookmaker) {
  const index = targetBookmakers.indexOf(bookmaker.key);
  return index === -1 ? targetBookmakers.length : index;
}

function americanToProbability(odds: number) {
  if (!Number.isFinite(odds) || odds === 0) return 0;
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function outcomeForTeam(market: OddsApiMarket | undefined, team: string) {
  return market?.outcomes?.find((outcome) => outcome.name === team);
}

function totalOutcome(market: OddsApiMarket | undefined, side: "Over" | "Under") {
  return market?.outcomes?.find((outcome) => outcome.name.toLowerCase() === side.toLowerCase());
}

function lineFromBookmaker(game: OddsApiGame, bookmaker: OddsApiBookmaker): SportsbookLine | null {
  const h2h = bookmaker.markets?.find((market) => market.key === "h2h");
  const spreads = bookmaker.markets?.find((market) => market.key === "spreads");
  const totals = bookmaker.markets?.find((market) => market.key === "totals");
  const homeMoneyline = outcomeForTeam(h2h, game.home_team)?.price ?? 0;
  const awayMoneyline = outcomeForTeam(h2h, game.away_team)?.price ?? 0;
  const homeSpread = outcomeForTeam(spreads, game.home_team);
  const over = totalOutcome(totals, "Over");
  const under = totalOutcome(totals, "Under");

  if (!homeMoneyline && !awayMoneyline && !homeSpread && !over && !under) {
    return null;
  }

  return {
    sportsbook: formatBookmakerName(bookmaker.key, bookmaker.title),
    sportsbookId: bookmaker.key,
    homeMoneyline,
    awayMoneyline,
    spread: homeSpread?.point ?? 0,
    spreadOdds: homeSpread?.price ?? -110,
    total: over?.point ?? under?.point ?? 0,
    overOdds: over?.price ?? -110,
    underOdds: under?.price ?? -110,
    lastUpdated: bookmaker.last_update ?? new Date().toISOString()
  };
}

function buildMarketPrediction(lines: SportsbookLine[], awayTeam: string, homeTeam: string) {
  const awayProbability = average(lines.map((line) => americanToProbability(line.awayMoneyline)).filter(Boolean));
  const homeProbability = average(lines.map((line) => americanToProbability(line.homeMoneyline)).filter(Boolean));
  const pickIsAway = awayProbability > homeProbability;
  const selectedProbability = pickIsAway ? awayProbability : homeProbability;
  const otherProbability = pickIsAway ? homeProbability : awayProbability;
  const edge = Math.max(1, Math.min(7.5, (selectedProbability - otherProbability) * 100));

  return {
    pick: `${pickIsAway ? awayTeam : homeTeam} ML`,
    confidence: Math.min(82, Math.max(52, Math.round(selectedProbability * 100))),
    edge: Number(edge.toFixed(1))
  };
}

function normalizeGame(raw: OddsApiGame, index: number, league: string, sport: string): GameOdds {
  const lines = (raw.bookmakers ?? [])
    .filter((bookmaker) => targetBookmakers.includes(bookmaker.key))
    .sort((a, b) => bookmakerPriority(a) - bookmakerPriority(b))
    .map((bookmaker) => lineFromBookmaker(raw, bookmaker))
    .filter((line): line is SportsbookLine => Boolean(line));
  const prediction = buildMarketPrediction(lines, raw.away_team, raw.home_team);

  return {
    id: raw.id || `${raw.sport_key}-${index}`,
    league,
    sport,
    startsAt: raw.commence_time,
    status: "scheduled",
    homeTeam: raw.home_team,
    awayTeam: raw.away_team,
    venue: raw.sport_title,
    liveScore: {
      away: null,
      home: null,
      period: "Pregame"
    },
    lines,
    playerProps: [],
    prediction: {
      pick: prediction.pick,
      confidence: prediction.confidence,
      edge: prediction.edge,
      modelNote:
        "Live market snapshot from The Odds API. Picks favor the stronger implied probability and real preferred-book price gaps.",
      researchFactors: [
        "Current sportsbook consensus",
        "Market-implied win probability",
        "Preferred-book price gap",
        "Line movement ready for tracking"
      ]
    }
  };
}

function collectBookmakers(rawGames: OddsApiGame[]) {
  return Array.from(new Set(rawGames.flatMap((game) => (game.bookmakers ?? []).map((book) => book.key)))).slice(0, 20);
}

export async function getOdds(): Promise<{
  games: GameOdds[];
  source: OddsSource;
  diagnostics?: OddsDiagnostics;
}> {
  const apiKey = process.env.THE_ODDS_API_KEY ?? process.env.ODDS_API_KEY;

  if (!apiKey) {
    return {
      games: [],
      source: "unavailable",
      diagnostics: {
        provider: "the-odds-api",
        reason: "THE_ODDS_API_KEY is missing."
      }
    };
  }

  const baseUrl = process.env.THE_ODDS_API_BASE_URL ?? defaultBaseUrl;
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  try {
    const responses = await Promise.allSettled(
      sportRequests.map((request) => {
        const params = new URLSearchParams({
          apiKey,
          regions: "us",
          markets: "h2h,spreads,totals",
          oddsFormat: "american",
          dateFormat: "iso",
          bookmakers: targetBookmakers.join(",")
        });
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        return fetch(`${baseUrl}/sports/${request.key}/odds?${params.toString()}`, {
          next: { revalidate: 300 },
          signal: controller.signal
        }).finally(() => clearTimeout(timeout));
      })
    );
    const responseStatuses = responses.map((result, index) => ({
      sport: sportRequests[index].key,
      status: result.status === "fulfilled" ? result.value.status : ("failed" as const)
    }));
    const payloads = await Promise.all(
      responses.map(async (result, index) => {
        if (result.status !== "fulfilled" || !result.value.ok) return [];
        const data = (await result.value.json()) as OddsApiGame[];
        return data.map((game) => ({
          game,
          league: sportRequests[index].league,
          sport: sportRequests[index].sport
        }));
      })
    );
    const rawGames = payloads.flat();

    if (rawGames.length === 0) {
      return {
        games: [],
        source: "unavailable",
        diagnostics: {
          provider: "the-odds-api",
          reason: "The Odds API returned no events for the requested sports.",
          requestedSports: sportRequests.map((request) => request.key),
          rawEvents: 0,
          responseStatuses
        }
      };
    }

    const normalizedGames = rawGames.map((item, index) => normalizeGame(item.game, index, item.league, item.sport));
    const insideWindow = normalizedGames.filter((game) => {
      const startsAt = new Date(game.startsAt);
      return startsAt >= now && startsAt <= threeDaysFromNow;
    });
    const games = insideWindow
      .filter((game) => game.lines.length > 0)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    return {
      games,
      source: games.length > 0 ? "live" : "unavailable",
      diagnostics: {
        provider: "the-odds-api",
        reason:
          games.length > 0
            ? "Live real lines returned from The Odds API."
            : "Events were returned, but none had preferred sportsbook lines inside the 3-day window.",
        requestedSports: sportRequests.map((request) => request.key),
        rawEvents: rawGames.length,
        normalizedEvents: normalizedGames.length,
        filteredEvents: games.length,
        removedOutsideWindow: normalizedGames.length - insideWindow.length,
        removedWithoutPreferredLines: insideWindow.length - games.length,
        sampleBookmakers: collectBookmakers(rawGames.map((item) => item.game)),
        responseStatuses
      }
    };
  } catch (error) {
    return {
      games: [],
      source: "unavailable",
      diagnostics: {
        provider: "the-odds-api",
        reason: error instanceof Error ? error.message : "Unknown The Odds API request failure.",
        requestedSports: sportRequests.map((request) => request.key)
      }
    };
  }
}
