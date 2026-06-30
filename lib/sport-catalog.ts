export type SportCategory = {
  id: string;
  label: string;
  leagues: string[];
};

export const sportCatalog: SportCategory[] = [
  { id: "featured", label: "Featured", leagues: ["WORLD_CUP", "NFL", "NBA", "WNBA", "MLB", "NHL", "UFC", "PGA", "ATP", "WTA", "TENNIS"] },
  { id: "football", label: "Football", leagues: ["NFL"] },
  { id: "basketball", label: "Basketball", leagues: ["NBA", "WNBA", "NCAAB", "NCAAWB", "EUROLEAGUE", "FIBA"] },
  { id: "baseball", label: "MLB", leagues: ["MLB"] },
  { id: "hockey", label: "Hockey", leagues: ["NHL", "AHL", "KHL", "SHL", "LIIGA", "PWHL"] },
  { id: "soccer", label: "Soccer", leagues: ["WORLD_CUP", "CLUB_WORLD_CUP", "WOMENS_WORLD_CUP", "MLS", "EPL", "UCL", "UEL", "LALIGA", "SERIE_A", "BUNDESLIGA", "LIGUE_1", "LIGA_MX", "NWSL", "FIFA"] },
  { id: "tennis", label: "Tennis", leagues: ["ATP", "WTA", "TENNIS"] },
  { id: "combat", label: "Combat", leagues: ["UFC", "MMA", "BOXING", "PFL", "BELLATOR", "ONE"] },
  { id: "golf", label: "Golf", leagues: ["PGA", "LIV", "LPGA", "DP_WORLD_TOUR"] },
  { id: "motorsports", label: "Motorsports", leagues: ["NASCAR", "F1", "FORMULA_1", "INDYCAR", "MOTOGP"] },
  { id: "racing", label: "Racing", leagues: ["HORSE_RACING", "GREYHOUND"] },
  { id: "esports", label: "Esports", leagues: ["LOL", "CS2", "DOTA2", "VALORANT", "COD", "OVERWATCH"] },
  { id: "other", label: "Other", leagues: ["CRICKET", "RUGBY", "AFL", "LACROSSE", "VOLLEYBALL", "TABLE_TENNIS", "DARTS"] }
];

export const sportsbookLeagueIDs = Array.from(new Set(sportCatalog.flatMap((category) => category.leagues)));

export function categoryForLeague(league: string) {
  return sportCatalog.find((category) => category.leagues.includes(league));
}

export function leaguesForCategory(categoryId: string) {
  return sportCatalog.find((category) => category.id === categoryId)?.leagues ?? [];
}

export function leagueLabel(league: string) {
  const labels: Record<string, string> = {
    WORLD_CUP: "World Cup",
    CLUB_WORLD_CUP: "Club World Cup",
    WOMENS_WORLD_CUP: "Women’s World Cup",
    NCAAF: "College Football",
    NCAAB: "College Basketball",
    NCAAWB: "Women’s College Basketball",
    NCAABASEBALL: "College Baseball",
    DP_WORLD_TOUR: "DP World Tour",
    FORMULA_1: "F1",
    HORSE_RACING: "Horse Racing",
    TABLE_TENNIS: "Table Tennis",
    TENNIS: "Tennis"
  };

  return labels[league] ?? league.replace(/_/g, " ");
}

export function sortGamesByLeaguePriority<T extends { league: string }>(games: T[], categoryId: string) {
  const leagues = leaguesForCategory(categoryId);

  return [...games].sort((a, b) => {
    const aIndex = leagues.includes(a.league) ? leagues.indexOf(a.league) : leagues.length;
    const bIndex = leagues.includes(b.league) ? leagues.indexOf(b.league) : leagues.length;

    return aIndex - bIndex;
  });
}

export function sortLeaguesByFeaturedPriority(leagues: string[]) {
  const featuredLeagues = leaguesForCategory("featured");

  return [...leagues].sort((a, b) => {
    const aIndex = featuredLeagues.includes(a) ? featuredLeagues.indexOf(a) : featuredLeagues.length;
    const bIndex = featuredLeagues.includes(b) ? featuredLeagues.indexOf(b) : featuredLeagues.length;

    return aIndex - bIndex || leagueLabel(a).localeCompare(leagueLabel(b));
  });
}
