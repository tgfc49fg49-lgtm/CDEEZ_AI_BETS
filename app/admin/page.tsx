import { CheckCircle2, KeyRound, ServerCog, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const hasSportsKey = Boolean(process.env.SPORTS_GAME_ODDS_API_KEY);
const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const hasSupabaseAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const hasSupabaseService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Admin"
        description="Check required environment variables and database readiness before wiring scheduled updates."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <StatusPanel
          title="Sports Game Odds API"
          icon={KeyRound}
          items={[
            { label: "SPORTS_GAME_ODDS_API_KEY", ready: hasSportsKey },
            { label: "SPORTS_GAME_ODDS_BASE_URL", ready: true }
          ]}
        />
        <StatusPanel
          title="Supabase"
          icon={ServerCog}
          items={[
            { label: "NEXT_PUBLIC_SUPABASE_URL", ready: hasSupabaseUrl },
            { label: "NEXT_PUBLIC_SUPABASE_ANON_KEY", ready: hasSupabaseAnon },
            { label: "SUPABASE_SERVICE_ROLE_KEY", ready: hasSupabaseService }
          ]}
        />
      </section>

      <section className="mt-6 rounded-lg border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 shrink-0" />
          <div>
            <h2 className="font-bold">Analytics-only guardrail</h2>
            <p className="mt-2 text-sm leading-6">
              This app is designed for odds analysis, prediction confidence, tracking, and bankroll
              visibility. It does not include real-money bet placement workflows.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function StatusPanel({
  title,
  icon: Icon,
  items
}: {
  title: string;
  icon: typeof KeyRound;
  items: Array<{ label: string; ready: boolean }>;
}) {
  return (
    <div className="rounded-lg border border-line bg-field-900/80 p-5">
      <div className="flex items-center gap-3">
        <Icon className="text-accent" />
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg bg-black/20 px-3 py-2">
            <span className="font-mono text-xs text-slate-300">{item.label}</span>
            <span className={item.ready ? "flex items-center gap-1 text-sm text-accent" : "text-sm text-slate-500"}>
              {item.ready && <CheckCircle2 size={16} />}
              {item.ready ? "ready" : "missing"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
