import { PageHeader } from "@/components/page-header";
import { ParlayBuilder } from "@/components/parlay-builder";
import { getOdds } from "@/lib/sports-game-odds";

export const dynamic = "force-dynamic";

export default async function ParlayBuilderPage() {
  const { games } = await getOdds();

  return (
    <>
      <PageHeader
        eyebrow="Parlay Builder"
        title="Parlay Builder"
        description="Build a custom parlay, select AI-ranked legs, or enter your own picks and let the model estimate the outcome."
      />
      <ParlayBuilder games={games} />
    </>
  );
}
