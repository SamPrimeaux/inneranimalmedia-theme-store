import type { ThemeRecord } from './catalog';
export type CatalogFilters = {
  query?: string;
  prices?: string[];
  industries?: string[];
  catalogSizes?: string[];
  features?: string[];
  sort?: string;
};
export function availableFilters(themes: ThemeRecord[]): {
  industries: string[];
  catalogSizes: string[];
  features: string[];
};
export function filterThemes(themes: ThemeRecord[], filters?: CatalogFilters): ThemeRecord[];
