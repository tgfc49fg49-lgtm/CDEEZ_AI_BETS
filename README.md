# Cdeez AI Bets

A first-version sports odds and prediction dashboard built with Next.js App Router, TypeScript, Tailwind, Supabase-ready schema planning, and a Sports Game Odds API integration.

This is an analytics tool only. It does not place bets or connect to real-money wagering flows.

## Features

- Dark sports dashboard UI
- Games dashboard
- Sportsbook odds comparison
- Prediction confidence board
- Bet tracker
- Bankroll tracker
- Admin/settings environment status
- `/api/odds` route for Sports Game Odds
- Homepage with AI top 5 picks and daily record tracker
- Sportsbook, AI Predictions, Arbitrages, Parlay Builder, and DFS Builder tabs
- Mock fallback data when `SPORTS_GAME_ODDS_API_KEY` is missing
- Supabase-ready database schema in `supabase/schema.sql`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env.local
```

3. Add keys to `.env.local` when available:

```bash
SPORTS_GAME_ODDS_API_KEY=your_key_here
SPORTS_GAME_ODDS_BASE_URL=https://api.sportsgameodds.com/v2
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The app works without these keys by using mock odds data.

4. Run locally:

```bash
npm run dev
```

5. Open the local address printed by the dev server.

For deployment, set the same environment variables in your hosting provider instead of committing local env files.

## API Route

`GET /api/odds`

Returns normalized odds data:

```json
{
  "games": [],
  "source": "mock",
  "generatedAt": "2026-06-17T00:00:00.000Z"
}
```

When `SPORTS_GAME_ODDS_API_KEY` is configured, the route fetches from the SportsGameOdds v2 events endpoint for MLB, NBA, NFL, and NHL with `oddsAvailable=true` and `includeAltLines=false`. The app prioritizes DraftKings, Underdog, PrizePicks, and FanDuel and only surfaces main game markets: moneyline, spread, and total. If the API call fails or returns an empty payload, mock data is returned so the dashboard remains usable.

## Daily Pick Grading

`POST /api/records/check-results`

This route is ready to be called by a midnight cron job. The intended workflow is:

- AI daily picks are submitted by 8:00 AM.
- Results are checked and recorded by midnight.
- Supabase stores pick history in `daily_ai_picks`.

The current route returns a grading summary and scheduler message. Wire it to Supabase writes when persistence is enabled.

## Supabase Planning

Run `supabase/schema.sql` in your Supabase SQL editor when you are ready to persist data. The schema includes:

- `games`
- `odds_lines`
- `predictions`
- `bet_records`
- `bankroll_events`
- `daily_ai_picks`
- `dfs_uploads`

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Next Steps

- Confirm the exact Sports Game Odds response shape and tighten the normalizer.
- Add a scheduled job for odds refreshes.
- Persist fetched odds and tracker entries in Supabase.
- Connect injury/news APIs for matchup detail pages.
- Persist DFS uploads and generated lineups.
