export type SportCategory = {
  id: string;
  label: string;
  leagues: string[];
};

export const sportCatalog: SportCategory[] = [
  { id: "featured", label: "Featured", leagues: ["NFL", "NBA", "MLB", "NHL", "WNBA", "UFC", "PGA", "WORLD_CUP"] },
  { id: "football", label: "Football", leagues: ["NFL", "NCAAF", "CFL", "UFL", "XFL"] },
  { id: "basketball", label: "Basketball", leagues: ["NBA", "WNBA", "NCAAB", "NCAAWB", "EUROLEAGUE", "FIBA"] },
  { id: "baseball", label: "Baseball", leagues: ["MLB", "KBO", "NPB", "CPBL", "NCAABASEBALL"] },
  { id: "hockey", label: "Hockey", leagues: ["NHL", "AHL", "KHL", "SHL", "LIIGA", "PWHL"] },
  { id: "soccer", label: "Soccer", leagues: ["WORLD_CUP", "CLUB_WORLD_CUP", "WOMENS_WORLD_CUP", "MLS", "EPL", "UCL", "UEL", "LALIGA", "SERIE_A", "BUNDESLIGA", "LIGUE_1", "LIGA_MX", "NWSL", "FIFA"] },
  { id: "tennis", label: "Tennis", leagues: ["ATP", "WTA", "ITF", "DAVIS_CUP", "BILLIE_JEAN_KING_CUP"] },
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
