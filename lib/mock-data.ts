import type { BankrollEvent, BetRecord, DailyPick, GameOdds, PlayerProp } from "@/lib/types";

export const mockGames: GameOdds[] = [
  {
    id: "nba-bos-nyk-2026-06-18",
    league: "NBA",
    sport: "Basketball",
    startsAt: "2026-06-18T00:30:00.000Z",
    status: "scheduled",
    homeTeam: "New York Knicks",
    awayTeam: "Boston Celtics",
    venue: "Madison Square Garden",
    prediction: {
      pick: "Boston Celtics ML",
      confidence: 67,
      edge: 4.2,
      modelNote: "Market consensus favors Boston with a small price gap at DraftKings."
    },
    lines: [
      {
        sportsbook: "DraftKings",
        sportsbookId: "draftkings",
        homeMoneyline: 132,
        awayMoneyline: -154,
        spread: 3.5,
        spreadOdds: -110,
        total: 218.5,
        overOdds: -108,
        underOdds: -112,
        lastUpdated: "2026-06-17T21:00:00.000Z"
      },
      {
        sportsbook: "FanDuel",
        sportsbookId: "fanduel",
        homeMoneyline: 128,
        awayMoneyline: -150,
        spread: 3,
        spreadOdds: -106,
        total: 219,
        overOdds: -110,
        underOdds: -110,
        lastUpdated: "2026-06-17T21:01:00.000Z"
      },
      {
        sportsbook: "BetMGM",
        sportsbookId: "betmgm",
        homeMoneyline: 135,
        awayMoneyline: -160,
        spread: 3.5,
        spreadOdds: -112,
        total: 218,
        overOdds: -105,
        underOdds: -115,
        lastUpdated: "2026-06-17T20:58:00.000Z"
      }
    ]
  },
  {
    id: "mlb-lad-sf-2026-06-18",
    league: "MLB",
    sport: "Baseball",
    startsAt: "2026-06-18T02:10:00.000Z",
    status: "scheduled",
    homeTeam: "San Francisco Giants",
    awayTeam: "Los Angeles Dodgers",
    venue: "Oracle Park",
    prediction: {
      pick: "Under 7.5",
      confidence: 61,
      edge: 2.8,
      modelNote: "Pitching matchup and park factor point below the current market total."
    },
    lines: [
      {
        sportsbook: "DraftKings",
        sportsbookId: "draftkings",
        homeMoneyline: 118,
        awayMoneyline: -138,
        spread: 1.5,
        spreadOdds: -145,
        total: 7.5,
        overOdds: -102,
        underOdds: -118,
        lastUpdated: "2026-06-17T21:05:00.000Z"
      },
      {
        sportsbook: "FanDuel",
        sportsbookId: "fanduel",
        homeMoneyline: 120,
        awayMoneyline: -142,
        spread: 1.5,
        spreadOdds: -150,
        total: 7.5,
        overOdds: 100,
        underOdds: -120,
        lastUpdated: "2026-06-17T21:04:00.000Z"
      }
    ]
  },
  {
    id: "nfl-kc-lac-2026-09-11",
    league: "NFL",
    sport: "Football",
    startsAt: "2026-09-11T00:20:00.000Z",
    status: "scheduled",
    homeTeam: "Los Angeles Chargers",
    awayTeam: "Kansas City Chiefs",
    venue: "SoFi Stadium",
    prediction: {
      pick: "Kansas City -2.5",
      confidence: 64,
      edge: 3.5,
      modelNote: "Spread is below the model number, with stronger away-team efficiency inputs."
    },
    lines: [
      {
        sportsbook: "DraftKings",
        sportsbookId: "draftkings",
        homeMoneyline: 122,
        awayMoneyline: -142,
        spread: 2.5,
        spreadOdds: -110,
        total: 47.5,
        overOdds: -110,
        underOdds: -110,
        lastUpdated: "2026-06-17T19:42:00.000Z"
      },
      {
        sportsbook: "Caesars",
        sportsbookId: "caesars",
        homeMoneyline: 126,
        awayMoneyline: -148,
        spread: 3,
        spreadOdds: 102,
        total: 48,
        overOdds: -108,
        underOdds: -112,
        lastUpdated: "2026-06-17T19:39:00.000Z"
      }
    ]
  }
];

export const mockBets: BetRecord[] = [
  {
    id: "bet-1",
    game: "Celtics at Knicks",
    market: "Moneyline",
    pick: "Celtics",
    odds: -154,
    stake: 50,
    status: "open",
    result: 0
  },
  {
    id: "bet-2",
    game: "Dodgers at Giants",
    market: "Total",
    pick: "Under 7.5",
    odds: -118,
    stake: 40,
    status: "won",
    result: 33.9
  },
  {
    id: "bet-3",
    game: "Chiefs at Chargers",
    market: "Spread",
    pick: "Chiefs -2.5",
    odds: -110,
    stake: 35,
    status: "lost",
    result: -35
  }
];

export const bankrollEvents: BankrollEvent[] = [
  { id: "br-1", date: "2026-06-01", label: "Opening bankroll", amount: 1200, balance: 1200 },
  { id: "br-2", date: "2026-06-05", label: "MLB total win", amount: 33.9, balance: 1233.9 },
  { id: "br-3", date: "2026-06-09", label: "NFL futures loss", amount: -35, balance: 1198.9 },
  { id: "br-4", date: "2026-06-17", label: "Current tracked balance", amount: 0, balance: 1198.9 }
];

export const dailyPicks: DailyPick[] = [
  
];

export const mockPlayerProps: PlayerProp[] = [];
