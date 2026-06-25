import { Activity, ChevronDown, CircleDollarSign, ShieldAlert, TrendingUp } from "lucide-react";
import { opportunityGrade } from "@/lib/opportunity";
import { formatOdds } from "@/lib/format";
import { teamLogoUrl } from "@/lib/team-logos";
import type { GameOdds, SportsbookLine } from "@/lib/types";

export function OpportunityBadge({ score }: { score: number }) {
  const grade = opportunityGrade(score);

  return (
    <div className={`rounded-lg border ${grade.border} ${grade.bg} px-3 py-2`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Opportunity Score</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <span className={`text-3xl font-black ${grade.tone}`}>{score}</span>
        <span className={`text-sm font-black ${grade.tone}`}>{grade.grade}</span>
      </div>
      <p className={`mt-1 text-xs font-bold ${grade.tone}`}>{grade.label}</p>
    </div>
  );
}

export function ConfidenceRing({ value, label = "AI Confidence" }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = clamped >= 70 ? "#22c55e" : clamped >= 55 ? "#facc15" : "#ef4444";

  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-16 w-16 place-items-center rounded-full"
        style={{ background: `conic-gradient(${color} ${clamped * 3.6}deg, rgba(255,255,255,0.1) 0deg)` }}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-field-950 text-sm font-black text-white">
          {clamped}%
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="font-bold text-white">{clamped >= 70 ? "High" : clamped >= 55 ? "Medium" : "Low"}</p>
      </div>
    </div>
  );
}

export function TeamBadge({ name, sport }: { name: string; sport?: string }) {
  return (
    <div className="flex items-center gap-3">
      <TeamLogo name={name} sport={sport} />
      <div className="min-w-0">
        <p className="truncate font-black text-white">{name}</p>
        {sport && <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{sport}</p>}
      </div>
    </div>
  );
}

export function TeamLogo({ name, sport, size = "md" }: { name: string; sport?: string; size?: "sm" | "md" | "lg" }) {
  const initials = initialsFor(name, sport);
  const colors = colorsForName(name);
  const dimensions = size === "lg" ? "h-14 w-14 text-base" : size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-sm";
  const logo = teamLogoUrl(name);

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full border bg-white font-black text-white shadow-glow ${dimensions}`}
      style={{
        background: logo ? "#ffffff" : `radial-gradient(circle at 30% 25%, ${colors.light}, ${colors.dark})`,
        borderColor: colors.border
      }}
      aria-label={`${name} logo`}
      title={name}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-[82%] w-[82%] object-contain" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </div>
  );
}

export function SportsbookLogo({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const dimensions = size === "md" ? "h-10 w-10 text-xs" : "h-8 w-8 text-[10px]";
  const colors = sportsbookColors(name);

  return (
    <div
      className={`grid shrink-0 place-items-center rounded-lg border font-black text-white ${dimensions}`}
      style={{
        background: `linear-gradient(135deg, ${colors.light}, ${colors.dark})`,
        borderColor: colors.border
      }}
      aria-label={`${name} sportsbook`}
      title={name}
    >
      {sportsbookInitials(name)}
    </div>
  );
}

export function AiExplanationDrawer({
  title = "Why the AI likes this bet",
  factors,
  combinedEdge
}: {
  title?: string;
  factors: Array<{ label: string; value: number }>;
  combinedEdge: number;
}) {
  return (
    <details className="rounded-lg border border-white/10 bg-black/20 p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black uppercase tracking-[0.16em] text-white">
        {title}
        <ChevronDown size={16} className="text-slate-500" />
      </summary>
      <div className="mt-4 space-y-3">
        {factors.map((factor) => (
          <div key={factor.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-300">{factor.label}</span>
              <span className="font-bold text-green-400">+{factor.value}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/10">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-electric to-green-400" style={{ width: `${Math.min(100, factor.value * 7)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-green-400/10 p-3 text-sm">
        <span className="text-slate-300">Combined Edge </span>
        <span className="font-black text-green-400">+{combinedEdge}%</span>
      </div>
    </details>
  );
}

function initialsFor(name: string, fallback?: string) {
  const parts = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return fallback?.slice(0, 2).toUpperCase() || "AI";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function sportsbookInitials(name: string) {
  const lookup: Record<string, string> = {
    DraftKings: "DK",
    FanDuel: "FD",
    BetMGM: "MGM",
    Caesars: "CZ",
    BetRivers: "BR",
    "ESPN BET": "ES",
    Underdog: "UD",
    PrizePicks: "PP"
  };

  return lookup[name] ?? initialsFor(name);
}

function colorsForName(name: string) {
  const palettes = [
    { light: "#22c55e", dark: "#064e3b", border: "rgba(34,197,94,0.45)" },
    { light: "#38bdf8", dark: "#075985", border: "rgba(56,189,248,0.45)" },
    { light: "#a855f7", dark: "#581c87", border: "rgba(168,85,247,0.45)" },
    { light: "#f59e0b", dark: "#7c2d12", border: "rgba(245,158,11,0.45)" },
    { light: "#ef4444", dark: "#7f1d1d", border: "rgba(239,68,68,0.45)" },
    { light: "#14b8a6", dark: "#134e4a", border: "rgba(20,184,166,0.45)" }
  ];
  return palettes[hashString(name) % palettes.length];
}

function sportsbookColors(name: string) {
  const lookup: Record<string, { light: string; dark: string; border: string }> = {
    DraftKings: { light: "#16a34a", dark: "#f97316", border: "rgba(34,197,94,0.55)" },
    FanDuel: { light: "#2563eb", dark: "#0f172a", border: "rgba(59,130,246,0.55)" },
    BetMGM: { light: "#d97706", dark: "#111827", border: "rgba(251,191,36,0.5)" },
    Caesars: { light: "#facc15", dark: "#0f172a", border: "rgba(250,204,21,0.5)" },
    BetRivers: { light: "#38bdf8", dark: "#1e3a8a", border: "rgba(56,189,248,0.45)" },
    "ESPN BET": { light: "#ef4444", dark: "#111827", border: "rgba(239,68,68,0.5)" },
    Underdog: { light: "#fbbf24", dark: "#78350f", border: "rgba(251,191,36,0.55)" },
    PrizePicks: { light: "#22c55e", dark: "#111827", border: "rgba(34,197,94,0.55)" }
  };

  return lookup[name] ?? colorsForName(name);
}

function hashString(value: string) {
  return value.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
}

export function LineMovementPanel({ game, lines }: { game: GameOdds; lines: SportsbookLine[] }) {
  const primary = lines[0];

  return (
    <div className="rounded-lg border border-line bg-field-900/80 p-5">
      <div className="flex items-center gap-2">
        <TrendingUp size={18} className="text-green-400" />
        <h2 className="text-lg font-black text-white">Line Movement</h2>
      </div>
      {primary ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MovementCard label="Moneyline" current={`${formatOdds(primary.awayMoneyline)} / ${formatOdds(primary.homeMoneyline)}`} />
          <MovementCard label="Spread" current={`${primary.spread} (${formatOdds(primary.spreadOdds)})`} />
          <MovementCard label={game.sport === "Soccer" ? "Total Goals" : "Total"} current={`${primary.total} O/U`} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">No current lines available for movement tracking.</p>
      )}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <IntelPill icon={Activity} label="Last 1 hour" value="Tracking current feed" />
        <IntelPill icon={CircleDollarSign} label="Sharp Money" value="Ready for feed" />
        <IntelPill icon={ShieldAlert} label="Previous Line" value="Stored history needed" />
      </div>
    </div>
  );
}

function MovementCard({ label, current }: { label: string; current: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 font-black text-white">{current}</p>
      <p className="mt-2 text-xs text-slate-500">Previous line begins after history storage is connected.</p>
    </div>
  );
}

function IntelPill({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] p-3">
      <Icon size={16} className="text-green-400" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
