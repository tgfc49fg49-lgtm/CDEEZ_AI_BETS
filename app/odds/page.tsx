import { PageHeader } from "@/components/page-header";
import { OddsTable } from "@/components/odds-table";
import { getOdds } from "@/lib/sports-game-odds";

export const dynamic = "force-dynamic";

export default async function OddsPage() {
  const { games } = await getOdds();

  return (
    <>
      <PageHeader
        eyebrow="Line shop"
        title="Odds Comparison"
        description="Compare moneylines, spreads, totals, and sportsbook prices across every tracked matchup."
      />
      <OddsTable games={games} />
    </>
  );
}
