import { NextResponse } from "next/server";
import { getOdds } from "@/lib/sports-game-odds";

export const dynamic = "force-dynamic";

export async function GET() {
  const odds = await getOdds();

  return NextResponse.json({
    ...odds,
    generatedAt: new Date().toISOString()
  });
}
