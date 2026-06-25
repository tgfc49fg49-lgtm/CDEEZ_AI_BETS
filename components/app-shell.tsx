import {
  BrainCircuit,
  BarChart3,
  Dices,
  Layers3,
  Radio,
  Search,
  Sparkles,
  Trophy
} from "lucide-react";

const navItems = [
  { href: "/", label: "Homepage", icon: Trophy },
  { href: "/sportsbook", label: "Sportsbook", icon: Search },
  { href: "/ai-predictions", label: "AI Predictions", icon: BrainCircuit },
  { href: "/arbitrages", label: "Arbitrages", icon: Sparkles },
  { href: "/parlay-builder", label: "Parlay Builder", icon: Dices },
  { href: "/dfs-builder", label: "DFS Builder", icon: Layers3 }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-root min-h-screen bg-field-950 text-slate-900 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="brand-sidebar relative border-b border-line px-4 py-4 backdrop-blur-xl lg:min-h-screen lg:border-b-0 lg:border-r lg:px-6">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-electric text-white shadow-blueglow">
            <BarChart3 size={25} strokeWidth={2.5} />
          </div>
          <div>
            <p className="bg-gradient-to-r from-white to-blue-300 bg-clip-text text-xl font-black tracking-tight text-transparent">
              Cdeez AI Bets
            </p>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan">Outcome predictor</p>
          </div>
        </a>

        <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                className="flex min-w-max items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-electric hover:text-white"
              >
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="mt-8 hidden rounded-lg border border-line bg-field-900/70 p-4 text-sm text-slate-300 shadow-blueglow lg:block">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent shadow-glow" />
            <p className="font-semibold text-white">Model status</p>
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">Operational</p>
          <div className="mt-4 h-2 rounded-full bg-white/10">
            <div className="h-2 w-[92%] rounded-full bg-gradient-to-r from-electric via-cyan to-accent" />
          </div>
          <p className="mt-3 text-sm">
            DraftKings priority. FanDuel shown for comparison where available.
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <Radio size={14} className="text-accent" />
            Analytics only. No bet placement.
          </p>
        </div>
      </aside>

      <main className="app-main relative min-h-screen bg-field-950 px-4 py-6 sm:px-6 lg:px-10">{children}</main>
    </div>
  );
}
