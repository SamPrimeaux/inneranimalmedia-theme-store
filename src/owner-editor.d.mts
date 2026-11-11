export type AuthorizedThemeStoreEditor = {
  site_id: 'theme-store';
  pages_href: string;
  globals_href: string;
};
export function resolveOwnedThemeStoreEditor(inventory: unknown): AuthorizedThemeStoreEditor | null;
