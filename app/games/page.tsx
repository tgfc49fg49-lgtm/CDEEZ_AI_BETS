import { Activity, BadgePercent, CalendarCheck, Database } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { getOdds } from "@/lib/sports-game-odds";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const { games, source } = await getOdds();
  const liveGames = games.filter((game) => game.status === "live").length;
  const avgConfidence =
    games.length > 0
      ? Math.round(games.reduce((total, game) => total + game.prediction.confidence, 0) / games.length)
      : 0;

  return (
    <>
      <PageHeader
        eyebrow="Odds dashboard"
        title="Games"
        description="Upcoming games with sportsbook lines, model confidence, and market notes in one dark dashboard."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tracked games" value={`${games.length}`} detail="Normalized from odds feed" icon={CalendarCheck} />
        <StatCard label="Live games" value={`${liveGames}`} detail="Updates every 5 minutes" icon={Activity} />
        <StatCard label="Avg confidence" value={`${avgConfidence}%`} detail="Mock model v0.1" icon={BadgePercent} />
        <StatCard label="Data source" value={source} detail="Falls back when API key is missing" icon={Database} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        {games.length === 0 ? (
          <div className="rounded-lg border border-line bg-field-900/80 p-5 text-slate-400">
            No real sportsbook lines are available right now.
          </div>
        ) : games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </section>
    </>
  );
}
