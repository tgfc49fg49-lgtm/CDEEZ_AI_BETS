import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-electric">Page not found</p>
        <h1 className="mt-3 text-3xl font-black text-white">This page is not available.</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
          The app could not find that route. Return home and keep working from the dashboard.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-lg bg-electric px-4 py-2 text-sm font-black text-white"
        >
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
