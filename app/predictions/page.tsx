import { Gauge } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getOdds } from "@/lib/sports-game-odds";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const { games } = await getOdds();

  return (
    <>
      <PageHeader
        eyebrow="Model board"
        title="Predictions"
        description="A first-pass confidence view that combines market prices with simple edge scoring. This is analysis only."
      />

      <section className="grid gap-4">
        {games.map((game) => (
          <article key={game.id} className="rounded-lg border border-line bg-field-900/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-accent">{game.league}</p>
                <h2 className="mt-1 text-xl font-bold text-white">
                  {game.awayTeam} at {game.homeTeam}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{game.prediction.modelNote}</p>
              </div>
              <div className="min-w-36 rounded-lg bg-black/20 p-4 text-center">
                <Gauge className="mx-auto text-accent" />
                <p className="mt-2 text-3xl font-bold text-white">{game.prediction.confidence}%</p>
                <p className="text-xs text-slate-500">confidence</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <PredictionMetric label="Suggested lean" value={game.prediction.pick} />
              <PredictionMetric label="Estimated edge" value={`${game.prediction.edge}%`} />
              <PredictionMetric label="Market count" value={`${game.lines.length} books`} />
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function PredictionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/20 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
