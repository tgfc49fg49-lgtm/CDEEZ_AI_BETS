export type SportsbookLine = {
  sportsbook: string;
  sportsbookId?: string;
  homeMoneyline: number;
  awayMoneyline: number;
  spread: number;
  spreadOdds: number;
  total: number;
  overOdds: number;
  underOdds: number;
  lastUpdated: string;
};

export type Prediction = {
  pick: string;
  confidence: number;
  edge: number;
  modelNote: string;
  researchFactors?: string[];
};

export type GameOdds = {
  id: string;
  league: string;
  sport: string;
  sportKey?: string;
  startsAt: string;
  status: "scheduled" | "live" | "final";
  homeTeam: string;
  awayTeam: string;
  venue: string;
  liveScore?: {
    away: number | null;
    home: number | null;
    period: string;
  };
  lines: SportsbookLine[];
  playerProps?: PlayerProp[];
  prediction: Prediction;
};

export type OddsSource = "live" | "unavailable";

export type PlayerProp = {
  id: string;
  gameId: string;
  player: string;
  team: string;
  category?: "player" | "team" | "game" | "market";
  market: string;
  side?: string;
  line: number;
  odds: number;
  sportsbook: string;
  edge: number;
  confidence: number;
  evidence: string;
  researchFactors?: string[];
};

export type DailyPick = {
  id: string;
  submittedAt: string;
  resultDueAt: string;
  pick: string;
  market: string;
  odds: number;
  confidence: number;
  status: "pending" | "won" | "lost" | "push";
  result?: string;
};

export type ArbitrageOpportunity = {
  id: string;
  game: string;
  market: string;
  sideA: string;
  bookA: string;
  oddsA: number;
  sideB: string;
  bookB: string;
  oddsB: number;
  edge: number;
};

export type BetRecord = {
  id: string;
  game: string;
  market: string;
  pick: string;
  odds: number;
  stake: number;
  status: "open" | "won" | "lost";
  result: number;
};

export type BankrollEvent = {
  id: string;
  date: string;
  label: string;
  amount: number;
  balance: number;
};
