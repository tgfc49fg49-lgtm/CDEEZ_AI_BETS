import { NextResponse } from "next/server";
import { dailyRecord } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST() {
  const record = dailyRecord();

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    schedule: {
      picksSubmittedBy: "08:00",
      resultsSubmittedBy: "24:00"
    },
    pendingToGrade: record.pending,
    message:
      "Result checker route is ready. Connect Supabase writes and call this from a midnight cron job to persist grades."
  });
}
