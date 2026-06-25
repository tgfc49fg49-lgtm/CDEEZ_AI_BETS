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
};

const recordVersion = 3;

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
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("Today's top 5 locks once generated.");
  const storageKey = `cdeez-ai-daily-record-${dateKey}`;

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);

    if (stored) {
      const parsed = JSON.parse(stored) as Partial<LockedRecord>;

      if (parsed.version === recordVersion && parsed.picks?.length) {
        setRecord(parsed as LockedRecord);
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

    const now = new Date();
    const lockedRecord: LockedRecord = {
      version: recordVersion,
      dateKey,
      submittedAt: now.toISOString(),
      resultDueAt: resultDueAt(now).toISOString(),
      picks: picks.slice(0, 5).map((pick) => ({
        ...pick,
        status: "pending"
      }))
    };

    window.localStorage.setItem(storageKey, JSON.stringify(lockedRecord));
    setRecord(lockedRecord);
    setMessage("Today's AI top 5 has been submitted and locked.");
  }, [dateKey, picks, storageKey]);

  const counts = useMemo(() => {
    const lockedPicks = record?.picks ?? [];
    const roi = lockedPicks.reduce((total, pick) => total + realizedReturn(pick), 0);

    return {
      wins: lockedPicks.filter((pick) => pick.status === "won").length,
      losses: lockedPicks.filter((pick) => pick.status === "lost").length,
      pushes: lockedPicks.filter((pick) => pick.status === "push").length,
      pending: lockedPicks.filter((pick) => pick.status === "pending").length,
      roi
    };
  }, [record]);

  async function checkResults() {
    if (!record || checking) return;

    setChecking(true);
    setMessage("Checking final scores from the scores feed...");

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
      setMessage("Record checked. Unfinished games stay pending until final scores are available.");
    } catch {
      setMessage("Could not check results yet. Try again later.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="home-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-electric">
            <CalendarCheck size={17} />
            AI record tracker
          </div>
          <h2 className="mt-2 text-xl font-black text-white">Today&apos;s locked top 5 picks</h2>
          <p className="mt-1 text-sm text-slate-500">
            Same-day picks only. Once submitted, this record is locked for {dateKey}.
          </p>
        </div>

        <button
          type="button"
          onClick={checkResults}
          disabled={!record || checking}
          className="inline-flex items-center gap-2 rounded-lg border border-electric/30 bg-electric px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
          {checking ? "Checking" : "Check results"}
        </button>
      </div>

      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-5">
          <RecordStat label="W" value={counts.wins} tone="win" />
          <RecordStat label="L" value={counts.losses} tone="loss" />
          <RecordStat label="P" value={counts.pushes} tone="push" />
          <RecordStat label="Pending" value={counts.pending} tone="pending" />
          <RecordMoneyStat label="ROI" value={counts.roi} />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-white p-3 text-sm text-slate-500">
          <Lock size={15} className="text-electric" />
          {message}
        </div>

        {!record ? (
          <div className="mt-4 rounded-lg border border-line bg-white p-6 text-slate-400">
            No same-day picks are available from the odds feed yet.
          </div>
        ) : (
          <details className="mt-4 rounded-lg border border-line bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-500">
              Locked pick history ({record.picks.length})
            </summary>
            <div className="divide-y divide-line">
              {record.picks.map((pick, index) => (
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
          </details>
        )}
      </div>
    </section>
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
