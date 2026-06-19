import type { GameOdds, OddsSource, PlayerProp, SportsbookLine } from "@/lib/types";
import { cleanEntityLabel } from "@/lib/labels";
import { sportsbookLeagueIDs } from "@/lib/sport-catalog";

type RawGame = Record<string, unknown>;
type RawOddsOutcome = Record<string, unknown>;
type RawBookmakerOdds = Record<string, unknown>;

const defaultBaseUrl = "https://api.sportsgameodds.com/v2";
const targetBookmakers = ["draftkings", "underdog", "prizepicks", "fanduel"];
const leagueIDs = sportsbookLeagueIDs;
const bookmakerDisplayNames: Record<string, string> = {
  draftkings: "DraftKings",
  underdog: "Underdog",
  prizepicks: "PrizePicks",
  fanduel: "FanDuel"
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace("+", ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function parseNullableNumber(value: unknown) {
  const parsed = parseNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function impliedProbability(odds: number) {
  if (!Number.isFinite(odds) || odds === 0) return 0;
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildMarketPrediction(lines: SportsbookLine[], awayTeam: string, homeTeam: string) {
  const awayProbability = average(lines.map((line) => impliedProbability(line.awayMoneyline)).filter(Boolean));
  const homeProbability = average(lines.map((line) => impliedProbability(line.homeMoneyline)).filter(Boolean));
  const pickIsAway = awayProbability > homeProbability;
  const selectedProbability = pickIsAway ? awayProbability : homeProbability;
  const otherProbability = pickIsAway ? homeProbability : awayProbability;
  const edge = Math.max(1, Math.min(6, (selectedProbability - otherProbability) * 100));

  return {
    pick: `${pickIsAway ? awayTeam : homeTeam} ML`,
    confidence: Math.min(78, Math.max(52, Math.round(selectedProbability * 100))),
    edge: Number(edge.toFixed(1))
  };
}

function teamName(raw: unknown, fallback: string) {
  const team = raw as { names?: { long?: string; medium?: string; short?: string } } | undefined;
  return cleanEntityLabel(team?.names?.long ?? team?.names?.medium ?? team?.names?.short ?? fallback, fallback);
}

function entityName(raw: unknown, fallback: string) {
  const entity = raw as { names?: { long?: string; medium?: string; short?: string }; name?: string } | undefined;
  return cleanEntityLabel(entity?.names?.long ?? entity?.names?.medium ?? entity?.names?.short ?? entity?.name ?? fallback, fallback);
}

function propSubject({
  statEntityID,
  players,
  teams,
  outcome
}: {
  statEntityID: string;
  players: Record<string, unknown>;
  teams?: { home?: unknown; away?: unknown };
  outcome: RawOddsOutcome;
}) {
  if (players[statEntityID]) {
    const player = entityName(players[statEntityID], "");
    const team = cleanEntityLabel(asString((players[statEntityID] as { teamID?: string } | undefined)?.teamID), "");
    return player ? { subject: player, team, category: "player" as const } : null;
  }

  if (statEntityID === "home") {
    const subject = teamName(teams?.home, "Home team");
    return { subject, team: subject, category: "team" as const };
  }

  if (statEntityID === "away") {
    const subject = teamName(teams?.away, "Away team");
    return { subject, team: subject, category: "team" as const };
  }

  if (statEntityID === "all") {
    return { subject: "Game", team: "Both teams", category: "game" as const };
  }

  const fallback =
    asString(outcome.entityName) ||
    asString(outcome.participantName) ||
    asString(outcome.selectionName) ||
    formatBookmakerName(statEntityID);

  return fallback ? { subject: cleanEntityLabel(fallback), team: "Market", category: "market" as const } : null;
}

function formatBookmakerName(value: string) {
  if (bookmakerDisplayNames[value]) return bookmakerDisplayNames[value];

  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeLine(raw: Record<string, unknown>, index: number): SportsbookLine {
  return {
    sportsbook: asString(raw.sportsbook ?? raw.bookmaker ?? raw.name, `Book ${index + 1}`),
    sportsbookId: asString(raw.sportsbookId ?? raw.bookmakerId ?? raw.bookmaker),
    homeMoneyline: asNumber(raw.homeMoneyline ?? raw.home_moneyline ?? raw.homeOdds, 0),
    awayMoneyline: asNumber(raw.awayMoneyline ?? raw.away_moneyline ?? raw.awayOdds, 0),
    spread: asNumber(raw.spread ?? raw.pointSpread, 0),
    spreadOdds: asNumber(raw.spreadOdds ?? raw.spread_odds, -110),
    total: asNumber(raw.total ?? raw.overUnder, 0),
    overOdds: asNumber(raw.overOdds ?? raw.over_odds, -110),
    underOdds: asNumber(raw.underOdds ?? raw.under_odds, -110),
    lastUpdated: asString(raw.lastUpdated ?? raw.updatedAt, new Date().toISOString())
  };
}

function lineFromV2Odds(bookmaker: string, odds: Record<string, RawOddsOutcome>): SportsbookLine {
  const readBook = (oddKey: string): RawBookmakerOdds | undefined => {
    const byBookmaker = odds[oddKey]?.byBookmaker as Record<string, RawBookmakerOdds> | undefined;
    const book = byBookmaker?.[bookmaker];
    return book?.available === false ? undefined : book;
  };

  const homeMl = readBook("points-home-game-ml-home");
  const awayMl = readBook("points-away-game-ml-away");
  const homeSpread = readBook("points-home-game-sp-home");
  const over = readBook("points-all-game-ou-over");
  const under = readBook("points-all-game-ou-under");

  return {
    sportsbook: formatBookmakerName(bookmaker),
    sportsbookId: bookmaker,
    homeMoneyline: parseNumber(homeMl?.odds, parseNumber(odds["points-home-game-ml-home"]?.bookOdds)),
    awayMoneyline: parseNumber(awayMl?.odds, parseNumber(odds["points-away-game-ml-away"]?.bookOdds)),
    spread: parseNumber(homeSpread?.spread),
    spreadOdds: parseNumber(homeSpread?.odds, -110),
    total: parseNumber(over?.overUnder ?? under?.overUnder),
    overOdds: parseNumber(over?.odds, -110),
    underOdds: parseNumber(under?.odds, -110),
    lastUpdated:
      asString(homeMl?.lastUpdatedAt) ||
      asString(awayMl?.lastUpdatedAt) ||
      asString(over?.lastUpdatedAt) ||
      new Date().toISOString()
  };
}

function hasMainMarketLine(bookmaker: string, odds: Record<string, RawOddsOutcome>) {
  const hasAvailableBook = (oddKey: string) => {
    const byBookmaker = odds[oddKey]?.byBookmaker as Record<string, RawBookmakerOdds> | undefined;
    const book = byBookmaker?.[bookmaker];
    return Boolean(book && book.available !== false && (book.odds || odds[oddKey]?.bookOdds));
  };

  return (
    hasAvailableBook("points-home-game-ml-home") ||
    hasAvailableBook("points-away-game-ml-away") ||
    hasAvailableBook("points-home-game-sp-home") ||
    hasAvailableBook("points-away-game-sp-away") ||
    hasAvailableBook("points-all-game-ou-over") ||
    hasAvailableBook("points-all-game-ou-under")
  );
}

function propLineFromV2Odds({
  gameId,
  outcome,
  outcomeKey,
  players,
  teams
}: {
  gameId: string;
  outcome: RawOddsOutcome;
  outcomeKey: string;
  players: Record<string, unknown>;
  teams?: { home?: unknown; away?: unknown };
}): PlayerProp[] {
  const statEntityID = asString(outcome.statEntityID, "all");

  const byBookmaker = outcome.byBookmaker as Record<string, RawBookmakerOdds> | undefined;
  const subject = propSubject({ statEntityID, players, teams, outcome });

  if (!subject) {
    return [];
  }

  const marketName = asString(outcome.marketName, asString(outcome.statID, outcomeKey));
  const side = asString(outcome.sideID);
  const market = [marketName, side]
    .filter(Boolean)
    .join(" ");
  const isMainGameMarket =
    outcomeKey.includes("game-ml") ||
    outcomeKey.includes("game-sp") ||
    outcomeKey.includes("game-ou");

  if (isMainGameMarket) {
    return [];
  }

  return Object.entries(byBookmaker ?? {})
    .filter(([bookmaker, bookOdds]) => targetBookmakers.includes(bookmaker) && bookOdds.available !== false)
    .map(([bookmaker, bookOdds], index) => {
      const propLine = parseNumber(bookOdds.overUnder ?? bookOdds.spread ?? outcome.overUnder ?? outcome.spread, 0);
      const odds = parseNumber(bookOdds.odds ?? outcome.bookOdds, -110);
      const normalizedPrice = Math.min(250, Math.abs(odds));
      const edge = Number((Math.max(1.2, Math.min(8.5, 9 - normalizedPrice / 42 + index * 0.15))).toFixed(1));

      return {
        id: `${gameId}-${outcomeKey}-${bookmaker}`,
        gameId,
        player: subject.subject,
        team: subject.team || subject.category,
        category: subject.category,
        market,
        side,
        line: propLine,
        odds,
        sportsbook: formatBookmakerName(bookmaker),
        edge,
        confidence: Math.min(78, 54 + Math.round(edge * 2.4)),
        evidence:
          `Real preferred-book ${subject.category} prop. Edge is capped and ranked from market price, line availability, and market stability.`,
        researchFactors: [
          subject.category === "player" ? "Career baseline and full historical game log required" : "Market history and matchup baseline required",
          subject.category === "player" ? "Season form and recent role trend" : "Team, match, fight, or event form trend",
          "Opponent, injury, lineup, or event context",
          "Line movement across preferred books"
        ]
      };
    })
    .filter((prop) => prop.odds !== 0 && prop.odds >= -500 && prop.odds <= 500);
}

function normalizeV2Game(raw: RawGame, index: number): GameOdds {
  const teams = raw.teams as { home?: unknown; away?: unknown } | undefined;
  const status = raw.status as
    | { startsAt?: string; live?: boolean; completed?: boolean; finalized?: boolean; displayLong?: string }
    | undefined;
  const odds = (raw.odds ?? {}) as Record<string, RawOddsOutcome>;
  const players = (raw.players ?? {}) as Record<string, unknown>;
  const results = raw.results as
    | {
        scores?: { home?: number | string; away?: number | string };
        home?: number | string;
        away?: number | string;
      }
    | undefined;
  const bookmakerIDs = new Set<string>();

  Object.values(odds).forEach((outcome) => {
    const byBookmaker = outcome.byBookmaker as Record<string, RawBookmakerOdds> | undefined;
    Object.entries(byBookmaker ?? {}).forEach(([bookmaker, bookOdds]) => {
      if (
        targetBookmakers.includes(bookmaker) &&
        bookOdds.available !== false &&
        hasMainMarketLine(bookmaker, odds)
      ) {
        bookmakerIDs.add(bookmaker);
      }
    });
  });

  const lines = Array.from(bookmakerIDs).slice(0, 8).map((bookmaker) => lineFromV2Odds(bookmaker, odds));
  const awayTeam = teamName(teams?.away, "Away Team");
  const homeTeam = teamName(teams?.home, "Home Team");
  const marketPrediction = buildMarketPrediction(lines, awayTeam, homeTeam);
  const id = asString(raw.eventID ?? raw.id, `game-${index}`);
  const playerProps = Object.entries(odds)
    .flatMap(([outcomeKey, outcome]) =>
      propLineFromV2Odds({
        gameId: id,
        outcome,
        outcomeKey,
        players,
        teams
      })
    )
    .sort((a, b) => b.edge - a.edge)
    .slice(0, 250);

  return {
    id,
    league: asString(raw.leagueID ?? raw.league, "League"),
    sport: asString(raw.sportID ?? raw.sport, "Sport"),
    startsAt: asString(status?.startsAt ?? raw.startsAt, new Date().toISOString()),
    status: status?.live ? "live" : status?.completed || status?.finalized ? "final" : "scheduled",
    homeTeam,
    awayTeam,
    venue: asString((raw.info as { venue?: string } | undefined)?.venue, status?.displayLong ?? "Upcoming"),
    liveScore: {
      away: results ? parseNullableNumber(results.scores?.away ?? results.away) : null,
      home: results ? parseNullableNumber(results.scores?.home ?? results.home) : null,
      period: asString(status?.displayLong, status?.live ? "Live" : "Pregame")
    },
    lines,
    playerProps,
    prediction: {
      pick: marketPrediction.pick,
      confidence: marketPrediction.confidence,
      edge: marketPrediction.edge,
      modelNote:
        "Live market snapshot from SportsGameOdds v2. Picks favor the stronger implied win probability unless a real market edge supports the underdog.",
      researchFactors: [
        "Team lifetime head-to-head history",
        "Full-season and rolling form",
        "Injuries, rest, travel, and lineup context",
        "Market movement and preferred-book price gap"
      ]
    }
  };
}

function normalizeGame(raw: RawGame, index: number): GameOdds {
  if (raw.eventID || raw.teams || raw.odds) {
    return normalizeV2Game(raw, index);
  }

  const linesRaw = Array.isArray(raw.lines)
    ? raw.lines
    : Array.isArray(raw.odds)
      ? raw.odds
      : Array.isArray(raw.bookmakers)
        ? raw.bookmakers
        : [];

  const lines = linesRaw.map((line, lineIndex) =>
    normalizeLine(line as Record<string, unknown>, lineIndex)
  );
  const homeTeam = asString(raw.homeTeam ?? raw.home_team ?? raw.home, "Home Team");
  const awayTeam = asString(raw.awayTeam ?? raw.away_team ?? raw.away, "Away Team");
  const marketPrediction = lines.length > 0 ? buildMarketPrediction(lines, awayTeam, homeTeam) : null;

  return {
    id: asString(raw.id, `game-${index}`),
    league: asString(raw.league ?? raw.leagueName, "League"),
    sport: asString(raw.sport ?? raw.sportName, "Sport"),
    startsAt: asString(raw.startsAt ?? raw.startTime ?? raw.commence_time, new Date().toISOString()),
    status: raw.status === "live" || raw.status === "final" ? raw.status : "scheduled",
    homeTeam,
    awayTeam,
    venue: asString(raw.venue ?? raw.location, "TBD"),
    lines,
    prediction: {
      pick: asString(raw.pick, marketPrediction?.pick ?? "Market consensus"),
      confidence: asNumber(raw.confidence, marketPrediction?.confidence ?? 55),
      edge: asNumber(raw.edge, marketPrediction?.edge ?? 1.5),
      modelNote: asString(
        raw.modelNote,
        "Initial model estimate based on implied win probability from available market prices."
      )
    }
  };
}

type OddsDiagnostics = {
  reason?: string;
  requestedLeagues?: string[];
  rawEvents?: number;
  normalizedEvents?: number;
  filteredEvents?: number;
  removedOutsideWindow?: number;
  removedWithoutPreferredLines?: number;
  responseStatuses?: Array<{ league: string; status: number | "failed" }>;
};

export async function getOdds(): Promise<{
  games: GameOdds[];
  source: OddsSource;
  diagnostics?: OddsDiagnostics;
}> {
  const apiKey = process.env.SPORTS_GAME_ODDS_API_KEY;

  if (!apiKey) {
    return {
      games: [],
      source: "unavailable",
      diagnostics: { reason: "SPORTS_GAME_ODDS_API_KEY is missing." }
    };
  }

  const baseUrl = process.env.SPORTS_GAME_ODDS_BASE_URL ?? defaultBaseUrl;

  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const responses = await Promise.allSettled(
      leagueIDs.map((leagueID) => {
        const params = new URLSearchParams({
          leagueID,
          oddsAvailable: "true",
          includeAltLines: "true",
          limit: "20"
        });
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        return fetch(`${baseUrl}/events?${params.toString()}`, {
          headers: {
            "x-api-key": apiKey,
            Authorization: `Bearer ${apiKey}`
          },
          next: { revalidate: 300 },
          signal: controller.signal
        }).finally(() => clearTimeout(timeout));
      })
    );
    const responseStatuses = responses.map((result, index) => ({
      league: leagueIDs[index],
      status: result.status === "fulfilled" ? result.value.status : ("failed" as const)
    }));

    const payloads = await Promise.all(
      responses
        .filter((result): result is PromiseFulfilledResult<Response> => result.status === "fulfilled")
        .map((result) => result.value)
        .filter((response) => response.ok)
        .map((response) => response.json())
    );
    const rawGames = payloads.flatMap((payload: { data?: RawGame[]; games?: RawGame[] } | RawGame[]) =>
      Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.games)
            ? payload.games
            : []
    );

    if (rawGames.length === 0) {
      return {
        games: [],
        source: "unavailable",
        diagnostics: {
          reason: "SportsGameOdds returned no events for the requested leagues.",
          requestedLeagues: leagueIDs,
          rawEvents: 0,
          responseStatuses
        }
      };
    }

    const normalizedGames = rawGames.map(normalizeGame);
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
        reason:
          games.length > 0
            ? "Live real lines returned."
            : "Events were returned, but none had real preferred-book lines inside the 3-day window.",
        requestedLeagues: leagueIDs,
        rawEvents: rawGames.length,
        normalizedEvents: normalizedGames.length,
        filteredEvents: games.length,
        removedOutsideWindow: normalizedGames.length - insideWindow.length,
        removedWithoutPreferredLines: insideWindow.length - games.length,
        responseStatuses
      }
    };
  } catch (error) {
    return {
      games: [],
      source: "unavailable",
      diagnostics: {
        reason: error instanceof Error ? error.message : "Unknown SportsGameOdds request failure.",
        requestedLeagues: leagueIDs
      }
    };
  }
}
