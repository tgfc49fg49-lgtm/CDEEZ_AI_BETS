# Cdeez AI Bets

A first-version sports odds and prediction dashboard built with Next.js App Router, TypeScript, Tailwind, Supabase-ready schema planning, and The Odds API integration.

This is an analytics tool only. It does not place bets or connect to real-money wagering flows.

## Features

- Dark sports dashboard UI
- Games dashboard
- Sportsbook odds comparison
- Prediction confidence board
- Bet tracker
- Bankroll tracker
- Admin/settings environment status
- `/api/odds` route for The Odds API
- Homepage with AI top 5 picks and daily record tracker
- Sportsbook, AI Predictions, Arbitrages, Parlay Builder, and DFS Builder tabs
- Real-lines-only display when `THE_ODDS_API_KEY` is configured
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
THE_ODDS_API_KEY=your_key_here
THE_ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The app stays empty without a real odds key instead of showing fake sportsbook lines.

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
  "source": "unavailable",
  "generatedAt": "2026-06-17T00:00:00.000Z"
}
```

When `THE_ODDS_API_KEY` is configured, the route fetches from The Odds API v4 odds endpoint with US regions and main markets: moneyline, spread, and total. The app prioritizes major US books such as DraftKings, FanDuel, BetMGM, Caesars, BetRivers, and ESPN BET where available. If the API call fails or returns no usable lines, the dashboard stays empty instead of showing fake odds.

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

- Add deeper player prop/stat providers after the odds feed is stable.
- Add a scheduled job for odds refreshes.
- Persist fetched odds and tracker entries in Supabase.
- Connect injury/news APIs for matchup detail pages.
- Persist DFS uploads and generated lineups.
