export type BadgeMetric = "cities" | "regions" | "memories";
export type BadgeTier = "Bronzo" | "Argento" | "Oro";
export type BadgeDefinition = { id: string; name: string; description: string; metric: BadgeMetric; threshold: number; tier: BadgeTier; icon: string; imageUrl?: string };
export const BADGES: readonly BadgeDefinition[] = [
  { id: "prima-impronta", name: "Prima impronta", description: "Ogni viaggio comincia da un primo passo.", metric: "cities", threshold: 1, tier: "Bronzo", icon: "Footprints" },
  { id: "esploratore-curioso", name: "Esploratore curioso", description: "La curiosità ti ha già portato lontano.", metric: "cities", threshold: 5, tier: "Bronzo", icon: "Compass" },
  { id: "viandante", name: "Viandante", description: "Dieci tappe, una strada tutta tua.", metric: "cities", threshold: 10, tier: "Argento", icon: "Backpack" },
  { id: "passaporto-vissuto", name: "Passaporto vissuto", description: "Tra le pagine, venticinque storie da custodire.", metric: "cities", threshold: 25, tier: "Argento", icon: "BookOpen" },
  { id: "girovago", name: "Girovago", description: "Cinquanta luoghi, e ancora voglia di partire.", metric: "cities", threshold: 50, tier: "Oro", icon: "Route" },
  { id: "cento-orizzonti", name: "Cento orizzonti", description: "Cento città hanno allargato il tuo orizzonte.", metric: "cities", threshold: 100, tier: "Oro", icon: "Sunrise" },
  { id: "tre-terre", name: "Tre terre", description: "Tre terre diverse, un unico desiderio di scoperta.", metric: "regions", threshold: 3, tier: "Bronzo", icon: "Mountain" },
  { id: "cinque-regioni", name: "Cinque regioni", description: "Il tuo cammino unisce cinque paesaggi.", metric: "regions", threshold: 5, tier: "Argento", icon: "Trees" },
  { id: "attraverso-italia", name: "Attraverso l'Italia", description: "Da una terra all'altra, l'Italia si racconta.", metric: "regions", threshold: 10, tier: "Oro", icon: "Navigation" },
  { id: "italia-in-tasca", name: "Italia in tasca", description: "Venti regioni, un paese da portare con te.", metric: "regions", threshold: 20, tier: "Oro", icon: "Globe" },
  { id: "primo-ricordo", name: "Primo ricordo", description: "Un istante di viaggio diventa un ricordo tuo.", metric: "memories", threshold: 1, tier: "Bronzo", icon: "Camera" },
  { id: "album-di-viaggio", name: "Album di viaggio", description: "Cinque città, un album di momenti preziosi.", metric: "memories", threshold: 5, tier: "Argento", icon: "Images" },
];
export const BADGE_SECTIONS: { metric: BadgeMetric; title: string }[] = [
  { metric: "cities", title: "Esplorazione delle città" }, { metric: "regions", title: "Scoperta delle regioni" }, { metric: "memories", title: "Ricordi di viaggio" },
];
export const badgeUnit = (metric: BadgeMetric) => metric === "cities" ? "città visitate" : metric === "regions" ? "regioni esplorate" : "città visitate con foto o video";
export type BadgeMetrics = Record<BadgeMetric, number>;
export type BadgeState = { earned: { badge_id: string; earned_at: string }[]; featured: { badge_id: string; position: number }[]; metrics: BadgeMetrics };
export function eligibleBadges(metrics: BadgeMetrics) { return BADGES.filter(b => metrics[b.metric] >= b.threshold).map(b => b.id); }
export function validateFeatured(ids: string[], earned: string[]) {
  if (ids.length > 3) throw new Error("Puoi esporre al massimo 3 conquiste.");
  if (new Set(ids).size !== ids.length) throw new Error("Una conquista può apparire una sola volta.");
  if (ids.some(id => !earned.includes(id))) throw new Error("Puoi esporre solo conquiste ottenute.");
  return ids;
}