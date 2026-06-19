"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

type ResearchPayload = {
  player: string;
  market: string;
  side: string;
  awayTeam: string;
  homeTeam: string;
  league: string;
};

type FreeResearch = {
  status: "ready" | "limited";
  summary: string;
  findings: string[];
};

export function GooglePropResearch({ payload }: { payload: ResearchPayload }) {
  const [research, setResearch] = useState<FreeResearch | null>(null);
  const [loading, setLoading] = useState(false);
  const links = buildResearchLinks(payload);

  async function runFreeResearch() {
    setLoading(true);

    try {
      const response = await fetch("/api/free-prop-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as FreeResearch;
      setResearch(data);
    } catch {
      setResearch({
        status: "limited",
        summary: "Free research could not load right now. Use the Google shortcuts for manual verification.",
        findings: []
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Free research tools</p>
        <button
          type="button"
          onClick={runFreeResearch}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-bold text-accent transition hover:bg-accent/15 disabled:cursor-not-allowed disabled:border-line disabled:text-slate-500"
        >
          <Sparkles size={14} />
          {loading ? "Researching..." : "Build free summary"}
        </button>
      </div>

      {research ? (
        <div className="mt-3 rounded-lg border border-accent/20 bg-accent/10 p-3">
          <p className="text-sm font-bold text-white">Prediction summary</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{research.summary}</p>
          {research.findings.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {research.findings.map((finding) => (
                <span key={finding} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-400">
                  {finding}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={googleUrl(link.query)}
            target="_blank"
            rel="noreferrer"
            title={link.query}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/[0.04] px-3 py-2 text-sm font-bold text-slate-300 transition hover:border-accent/50 hover:text-white"
          >
            <span className="text-base">{link.emoji}</span>
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function buildResearchLinks({ player, market, side, awayTeam, homeTeam, league }: ResearchPayload) {
  const matchup = [awayTeam, homeTeam].filter(Boolean).join(" at ");
  return [
    {
      emoji: "📰",
      label: "News / Weather",
      query: `what are the weather conditions predicted for this matchup to watch? ${matchup} ${league} ${player} ${market} ${side}`
    },
    {
      emoji: "🩹",
      label: "Injuries",
      query: `what is the injury report in this matchup? ${matchup} ${league} ${player}`
    },
    {
      emoji: "🔥",
      label: "Key Factors",
      query: `what are the key factors in today's matchup? ${matchup} ${league} ${player} ${market} ${side}`
    }
  ];
}

function googleUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
