import generated from './catalog.generated.json';

/**
 * The catalog is GENERATED from `packages/*\/package.json#agentsam.store` by
 * `scripts/build-catalog.mjs`. Do not add themes here; add a package.
 * The catalog is a product listing, NOT a tenant, site, installation or CMS registry.
 */
export type ThemeCategory = 'Commerce' | 'Nonprofit' | 'Editorial' | 'Services' | 'Portfolio';
export type ReleaseState = 'preview' | 'published';
export type ThemeRecord = {
  slug: string; sku: string; name: string; summary: string;
  category: ThemeCategory; tags: string[]; pages: string[]; industries: string[]; features: string[]; catalogSizes: string[];
  colorway: 'wine' | 'violet' | 'paper'; version: string;
  publisher: string; priceUsd: number | null; downloadReady?: boolean;
  /** Resolved at request time by the Worker: live R2 preview if published, else null. */
  previewUrl: string | null;
  cardImage: string;
  sortOrder: number;
  previewBuild: 'package' | 'external';
  minCmsSchema: '2';
  editorial?: {eyebrow: string; headline: string; body: string; notes: string[]};
  release: {status: ReleaseState; sha256: string | null; storageKey: string | null};
};

type SourceRecord = Omit<ThemeRecord, 'previewUrl'>;
export const themes: SourceRecord[] = (generated as { themes: SourceRecord[] }).themes;

export function findTheme(slug: string) { return themes.find(theme => theme.slug === slug); }
export function publicTheme(theme: SourceRecord, previewUrl: string | null): ThemeRecord {
  return {
    ...theme,
    previewUrl,
    downloadReady: theme.release.status === 'published' && !!theme.release.storageKey && !!theme.release.sha256,
  } as ThemeRecord & { downloadReady: boolean };
}
