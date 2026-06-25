"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref = "/sportsbook" }: { fallbackHref?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push(fallbackHref);
      }}
      className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
    >
      <ChevronLeft size={16} />
      Back
    </button>
  );
}
