"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarCheck, ExternalLink, Lock, RefreshCw } from "lucide-react";
import { formatOdds } from "@/lib/format";

export type DailyRecordPick = {
  id: string;
  gameId: string;
  sportKey?: string;
  pick: string;
  market: string;
  odds: number;
  stake: number;
  confidence: number;
  edge: number;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  href: string;
};

type LockedPick = DailyRecordPick & {
  status: "pending" | "won" | "lost" | "push";
  result?: string;
  verificationUrl?: string;
};

type LockedRecord = {
  version: number;
  dateKey: string;
  submittedAt: string;
  resultDueAt: string;
  picks: LockedPick[];
  archivedAt?: string;
};

type RecordSummary = {
  daysTracked: number;
  wins: number;
  losses: number;
  pushes: number;
  roi: number;
};

type RecordHistory = {
  version: number;
  summary: RecordSummary;
  records: LockedRecord[];
};

const recordVersion = 6;
const historyVersion = 1;
const submitHour = 8;
const gradeHour = 23;

type GradeResponse = {
  grades?: Array<{
    id: string;
    status: "pending" | "won" | "lost" | "push";
    result: string;
    verificationUrl: string;
  }>;
};

export function DailyRecordTracker({ dateKey, picks }: { dateKey: string; picks: DailyRecordPick[] }) {
  const [record, setRecord] = useState<LockedRecord | null>(null);
  const [history, setHistory] = useState<RecordHistory>(() => emptyHistory());
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("The AI will auto-lock today's official card at 8:00 AM.");
  const storageKey = `cdeez-ai-daily-record-${dateKey}`;
  const historyKey = "cdeez-ai-record-history-v1";
  const submissionPicks = picks.slice(0, 5);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    setHistory(loadHistory(historyKey));

    if (stored) {
      const parsed = JSON.parse(stored) as Partial<LockedRecord>;

      if (parsed.version === recordVersion && parsed.dateKey === dateKey && parsed.picks?.length) {
        setRecord({
          version: recordVersion,
          dateKey,
          submittedAt: parsed.submittedAt ?? new Date().toISOString(),
          resultDueAt: parsed.resultDueAt ?? resultDueAt(new Date()).toISOString(),
          picks: parsed.picks as LockedPick[],
          archivedAt: parsed.archivedAt
        });
        setMessage("Locked record loaded. Picks cannot be changed for this date.");
        return;
      }

      window.localStorage.removeItem(storageKey);
    }

    if (picks.length === 0) {
      setRecord(null);
      setMessage("No same-day AI picks are available yet.");
      return;
    }

    if (isAfterSubmitTime(new Date())) {
      submitTodaysPicks("auto");
      return;
    }

    setRecord(null);
    setMessage("The AI will auto-lock this card at 8:00 AM. Until then, it is a preview.");
  }, [dateKey, picks.length, storageKey]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();

      if (!record && submissionPicks.length > 0 && isAfterSubmitTime(now)) {
        submitTodaysPicks("auto");
      }

      if (record && hasPendingPicks(record) && isAfterGradeTime(now) && !checking) {
        void checkResults("auto");
      }
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  });

  function submitTodaysPicks(mode: "auto" | "manual") {
    if (record || submissionPicks.length === 0) return;

    const now = new Date();
    const lockedRecord: LockedRecord = {
      version: recordVersion,
      dateKey,
      submittedAt: now.toISOString(),
      resultDueAt: resultDueAt(now).toISOString(),
      picks: submissionPicks.map((pick) => ({
        ...pick,
        status: "pending"
      }))
    };

    window.localStorage.setItem(storageKey, JSON.stringify(lockedRecord));
    setRecord(lockedRecord);
    setMessage(
      mode === "auto"
        ? "8:00 AM lock complete. Today's AI top 5 is official and cannot be changed."
        : "Today's AI top 5 has been submitted and locked."
    );
  }

  const counts = useMemo(() => {
    const activePicks = record && !record.archivedAt ? record.picks : [];
    const dailyRoi = activePicks.reduce((total, pick) => total + realizedReturn(pick), 0);

    return {
      wins: history.summary.wins + activePicks.filter((pick) => pick.status === "won").length,
      losses: history.summary.losses + activePicks.filter((pick) => pick.status === "lost").length,
      pushes: history.summary.pushes + activePicks.filter((pick) => pick.status === "push").length,
      pending: activePicks.filter((pick) => pick.status === "pending").length,
      roi: history.summary.roi + dailyRoi
    };
  }, [history, record]);

  async function checkResults(mode: "auto" | "manual" = "manual") {
    if (!record || checking) return;

    setChecking(true);
    setMessage(mode === "auto" ? "11:00 PM grading started. Checking final scores..." : "Checking final scores from the scores feed...");

    try {
      const response = await fetch("/api/records/check-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          picks: record.picks.map((pick) => ({
            id: pick.id,
            gameId: pick.gameId,
            sportKey: pick.sportKey,
            pick: pick.pick,
            market: pick.market,
            homeTeam: pick.homeTeam,
            awayTeam: pick.awayTeam,
            startsAt: pick.startsAt
          }))
        })
      });
      const data = (await response.json()) as GradeResponse;
      const grades = data.grades ?? [];
      const updated: LockedRecord = {
        ...record,
        picks: record.picks.map((pick) => {
          const grade = grades.find((item) => item.id === pick.id);

          if (pick.status !== "pending" && grade?.status === "pending") {
            return pick;
          }

          return grade
            ? {
                ...pick,
                status: grade.status,
                result: grade.result,
                verificationUrl: grade.verificationUrl
              }
            : pick;
        })
      };

      window.localStorage.setItem(storageKey, JSON.stringify(updated));
      setRecord(updated);
      const gradedCount = updated.picks.filter((pick) => pick.status !== "pending").length;
      const pendingCount = updated.picks.length - gradedCount;

      if (pendingCount === 0) {
        archiveRecord(updated);
      }

      setMessage(
        pendingCount > 0
          ? `Record checked. ${gradedCount} graded, ${pendingCount} still waiting on a final score.`
          : "Record checked and archived. Today's used selections are stored in the dropdown."
      );
    } catch {
      setMessage("Could not check results yet. Try again later.");
    } finally {
      setChecking(false);
    }
  }

  function archiveRecord(nextRecord: LockedRecord) {
    const archivedRecord = {
      ...nextRecord,
      archivedAt: new Date().toISOString()
    };
    const nextHistory = upsertHistoryRecord(loadHistory(historyKey), archivedRecord);

    window.localStorage.setItem(historyKey, JSON.stringify(nextHistory));
    window.localStorage.setItem(storageKey, JSON.stringify(archivedRecord));
    setHistory(nextHistory);
    setRecord(archivedRecord);
  }

  return (
    <section className="home-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-electric">
            <CalendarCheck size={17} />
            AI record tracker
          </div>
          <h2 className="mt-2 text-xl font-black text-white">
            {record ? "Today's locked top 5 picks" : "Today's AI top 5 preview"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Auto-locks at 8:00 AM, auto-grades at 11:00 PM, then stores the used selections in history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => checkResults("manual")}
          disabled={!record || checking}
          className="inline-flex items-center gap-2 rounded-lg border border-electric/30 bg-electric px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
          {checking ? "Checking" : "Check results"}
        </button>
      </div>

      <div className="p-4">
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-white p-3 text-sm text-slate-500">
          <Lock size={15} className="text-electric" />
          {message}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-6">
          <RecordStat label="Days" value={history.summary.daysTracked} tone="pending" />
          <RecordStat label="W" value={counts.wins} tone="win" />
          <RecordStat label="L" value={counts.losses} tone="loss" />
          <RecordStat label="P" value={counts.pushes} tone="push" />
          <RecordStat label="Pending" value={counts.pending} tone="pending" />
          <RecordMoneyStat label="ROI" value={counts.roi} />
        </div>

        {!record ? (
          submissionPicks.length === 0 ? (
            <div className="mt-4 rounded-lg border border-line bg-white p-6 text-slate-400">
              No same-day picks are available from the odds feed yet.
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-line bg-white">
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                  Pending AI submission ({submissionPicks.length})
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  These are the picks the AI is proposing for today. The card locks automatically at 8:00 AM.
                </p>
              </div>
              <PickRows picks={submissionPicks.map((pick) => ({ ...pick, status: "pending" }))} />
            </div>
          )
        ) : (
          <>
          <details className="mt-4 rounded-lg border border-line bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-500">
              Used selections for {record.dateKey} ({record.picks.length})
            </summary>
            <PickRows picks={record.picks} />
          </details>
          </>
        )}

        {history.records.length > 0 && (
          <details className="mt-4 rounded-lg border border-line bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-500">
              Graded record archive ({history.records.length} days shown, lifetime record kept)
            </summary>
            <div className="divide-y divide-line">
              {history.records.map((item) => (
                <div key={item.dateKey} className="px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-white">{item.dateKey}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Submitted {timeLabel(item.submittedAt)} · Graded {item.archivedAt ? timeLabel(item.archivedAt) : "pending"}
                      </p>
                    </div>
                    <p className={`font-black ${recordRoi(item) >= 0 ? "text-green-500" : "text-accent"}`}>
                      {formatCurrency(recordRoi(item))}
                    </p>
                  </div>
                  <details className="mt-3 rounded-lg border border-line bg-field-900/40">
                    <summary className="cursor-pointer px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Used selections
                    </summary>
                    <PickRows picks={item.picks} />
                  </details>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}

function PickRows({ picks }: { picks: LockedPick[] }) {
  return (
    <div className="divide-y divide-line">
      {picks.map((pick, index) => (
        <div key={pick.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[40px_minmax(0,1fr)_110px_120px_120px_160px]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-field-800 text-sm font-black text-electric">
            {index + 1}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black text-white">{pick.pick}</p>
            <p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {pick.awayTeam} @ {pick.homeTeam}
            </p>
            {pick.result && <p className="mt-2 text-sm text-slate-500">{pick.result}</p>}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Line</p>
            <p className="mt-1 font-black text-white">{formatOdds(pick.odds)}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Stake</p>
            <p className="mt-1 font-black text-white">{formatCurrency(pick.stake)}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">ROI</p>
            <p className={`mt-1 font-black ${realizedReturn(pick) >= 0 ? "text-green-500" : "text-accent"}`}>
              {pick.status === "pending" ? "Pending" : formatCurrency(realizedReturn(pick))}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className={statusClass(pick.status)}>{pick.status}</span>
            <Link href={pick.href} className="text-electric transition hover:text-accent" aria-label={`Review ${pick.pick}`}>
              <ArrowRight size={18} />
            </Link>
            {pick.verificationUrl && (
              <a
                href={pick.verificationUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 transition hover:text-accent"
                aria-label={`Verify ${pick.pick}`}
              >
                <ExternalLink size={17} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordStat({ label, value, tone }: { label: string; value: number; tone: "win" | "loss" | "push" | "pending" }) {
  const tones = {
    win: "text-green-500",
    loss: "text-accent",
    push: "text-amber-500",
    pending: "text-electric"
  };

  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function RecordMoneyStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${value >= 0 ? "text-green-500" : "text-accent"}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function statusClass(status: LockedPick["status"]) {
  const classes = {
    won: "rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-black uppercase text-green-500",
    lost: "rounded-full bg-accent/10 px-2.5 py-1 text-xs font-black uppercase text-accent",
    push: "rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-black uppercase text-amber-600",
    pending: "rounded-full bg-electric/10 px-2.5 py-1 text-xs font-black uppercase text-electric"
  };

  return classes[status];
}

function realizedReturn(pick: LockedPick) {
  if (pick.status === "won") return profitIfWin(pick.stake, pick.odds);
  if (pick.status === "lost") return -pick.stake;
  return 0;
}

function profitIfWin(stake: number, odds: number) {
  if (odds === 0) return 0;
  return roundMoney(odds > 0 ? stake * (odds / 100) : stake * (100 / Math.abs(odds)));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function resultDueAt(date: Date) {
  const due = new Date(date);
  due.setHours(23, 59, 59, 999);

  return due;
}

function isAfterSubmitTime(date: Date) {
  return date.getHours() >= submitHour;
}

function isAfterGradeTime(date: Date) {
  return date.getHours() >= gradeHour;
}

function hasPendingPicks(record: LockedRecord) {
  return record.picks.some((pick) => pick.status === "pending");
}

function emptyHistory(): RecordHistory {
  return {
    version: historyVersion,
    summary: {
      daysTracked: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      roi: 0
    },
    records: []
  };
}

function loadHistory(key: string): RecordHistory {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return emptyHistory();

    const parsed = JSON.parse(stored) as Partial<RecordHistory>;
    if (parsed.version !== historyVersion || !parsed.summary || !Array.isArray(parsed.records)) {
      return emptyHistory();
    }

    return {
      version: historyVersion,
      summary: {
        daysTracked: parsed.summary.daysTracked ?? 0,
        wins: parsed.summary.wins ?? 0,
        losses: parsed.summary.losses ?? 0,
        pushes: parsed.summary.pushes ?? 0,
        roi: parsed.summary.roi ?? 0
      },
      records: parsed.records as LockedRecord[]
    };
  } catch {
    return emptyHistory();
  }
}

function upsertHistoryRecord(history: RecordHistory, record: LockedRecord): RecordHistory {
  const existing = history.records.find((item) => item.dateKey === record.dateKey);
  const existingSummary = existing ? summarizeRecord(existing) : null;
  const nextSummary = summarizeRecord(record);
  const records = [record, ...history.records.filter((item) => item.dateKey !== record.dateKey)]
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .slice(0, 50);

  return {
    version: historyVersion,
    summary: {
      daysTracked: existing ? history.summary.daysTracked : history.summary.daysTracked + 1,
      wins: history.summary.wins - (existingSummary?.wins ?? 0) + nextSummary.wins,
      losses: history.summary.losses - (existingSummary?.losses ?? 0) + nextSummary.losses,
      pushes: history.summary.pushes - (existingSummary?.pushes ?? 0) + nextSummary.pushes,
      roi: roundMoney(history.summary.roi - (existingSummary?.roi ?? 0) + nextSummary.roi)
    },
    records
  };
}

function summarizeRecord(record: LockedRecord): Omit<RecordSummary, "daysTracked"> {
  return {
    wins: record.picks.filter((pick) => pick.status === "won").length,
    losses: record.picks.filter((pick) => pick.status === "lost").length,
    pushes: record.picks.filter((pick) => pick.status === "push").length,
    roi: recordRoi(record)
  };
}

function recordRoi(record: LockedRecord) {
  return roundMoney(record.picks.reduce((total, pick) => total + realizedReturn(pick), 0));
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
