export type SiteDocument = {
  schema: string;
  brand: { monogram: string; label: string; ariaLabel: string };
  nav: { discover: string; howItWorks: string; sitesLabel: string; sitesHref: string; originNote: string };
  hero: { eyebrow: string; headlineLead: string; headlineEm: string; body: string; points: string[] };
  library: { eyebrow: string; title: string; filters: { prices: string; industries: string; catalogSizes: string; features: string }; browseLabel: string };
  howItWorks: { eyebrow: string; title: string; body: string; steps: { title: string; body: string }[] };
  categoryLabels: Record<string, string>;
  tokens: { accent: string; accentDark: string; accentDeep: string; ink: string; inkAlt: string };
};
export function resolveSite(defaults: SiteDocument, override: unknown): SiteDocument;
