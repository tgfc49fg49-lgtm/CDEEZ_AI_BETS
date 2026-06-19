# Deploy Cdeez AI Bets as a New Site

This is a Next.js app. Deploy it as a new project on Vercel, Netlify, or another host that supports Next.js App Router.

## Recommended: Vercel

1. Create a new GitHub repo.
2. Upload this project to that repo.
3. In Vercel, choose **Add New Project**.
4. Import the new GitHub repo.
5. Use the default Next.js settings:
   - Framework: Next.js
   - Build command: `npm run build`
   - Output directory: leave default
6. Add environment variables in Vercel:
   - `SPORTS_GAME_ODDS_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL` if Supabase is connected
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` if Supabase is connected
   - `SUPABASE_SERVICE_ROLE_KEY` only if server-side Supabase admin work is added later
7. Deploy.

## Important

- Do not upload `.env.local`.
- Do not upload `.next`, `.next-dev`, or `node_modules`.
- This app is analytics-only and does not place real-money bets.

## Local Test

```bash
npm run dev
```

Then open the local address printed by the dev server.
