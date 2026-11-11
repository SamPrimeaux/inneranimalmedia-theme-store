/** Site editor entry requires an account-authorized CMS inventory response.
 * The public Worker never grants editing rights from an identity claim, hostname,
 * account guess, or an arbitrary site_id query parameter. */
export function resolveOwnedThemeStoreEditor(inventory) {
  const sites = Array.isArray(inventory?.sites) ? inventory.sites : [];
  const site = sites.find(row =>
    row && row.id === 'theme-store' && row.slug === 'theme-store' &&
    row.source === 'shared-d1' && row.can_edit === true
  );
  if (!site) return null;
  const base = 'https://agentsam.inneranimalmedia.com';
  return {
    site_id: 'theme-store',
    pages_href: base + '/admin/pages?site_id=theme-store',
    globals_href: base + '/admin/theme-editor?site_id=theme-store&slug=site-shell&page_id=cmsp_theme_store_site_shell'
  };
}
