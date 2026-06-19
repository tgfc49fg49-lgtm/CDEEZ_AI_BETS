const leagueSuffixes = new Set([
  "mlb",
  "nba",
  "wnba",
  "nfl",
  "nhl",
  "ufc",
  "mma",
  "pga",
  "f1",
  "nascar",
  "atp",
  "wta",
  "ncaaf",
  "ncaab",
  "ncaawb"
]);

const nameOverrides: Record<string, string> = {
  athletics: "Athletics",
  diamondbacks: "Diamondbacks",
  dbacks: "Diamondbacks",
  white_sox: "White Sox",
  red_sox: "Red Sox",
  blue_jays: "Blue Jays",
  maple_leafs: "Maple Leafs",
  trail_blazers: "Trail Blazers",
  golden_knights: "Golden Knights"
};

export function cleanEntityLabel(value: string, fallback = "Market") {
  const raw = value?.trim();
  if (!raw || raw.toLowerCase() === "market") return fallback;

  const cleaned = raw
    .replace(/[|]+/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleaned.split(" ").filter(Boolean);
  const withoutLeague =
    parts.length > 1 && leagueSuffixes.has(parts[parts.length - 1].toLowerCase())
      ? parts.slice(0, -1)
      : parts;

  const normalized = withoutLeague
    .join("_")
    .toLowerCase();

  if (nameOverrides[normalized]) return nameOverrides[normalized];

  return withoutLeague
    .map((part) => {
      const lower = part.toLowerCase();
      if (leagueSuffixes.has(lower)) return lower.toUpperCase();
      if (part.length <= 3 && part === part.toUpperCase()) return part;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
