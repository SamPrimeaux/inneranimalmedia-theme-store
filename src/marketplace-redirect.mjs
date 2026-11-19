// Legacy Theme Store app-embed route. The independently deployed App Store owns discovery.
export const EMBEDS_COLLECTION_URL = 'https://apps.inneranimalmedia.com/collections/embeds';
export function marketplaceRedirect(pathname) {
  if (pathname === '/app-embeds' || pathname === '/app-embeds/') return EMBEDS_COLLECTION_URL;
  return null;
}

// Preserve only the selected package. The authenticated CMS owns site selection,
// login and the release validation immediately before creating a draft.
const AGENTSAM_INSTALL_ORIGIN = 'https://agentsam.inneranimalmedia.com';
const AGENTSAM_INSTALL_PATH = '/sites';

// /sites is the stable public handoff. AgentSam owns authentication, site selection,
// release verification and private-draft creation; the store never chooses a site.
export function themeInstallerUrl(sku, version) {
  if (!/^iam\.theme\.[a-z][a-z0-9-]{0,63}$/.test(sku || '') ||
      !/^\d+\.\d+\.\d+$/.test(version || '')) return null;
  const destination = new URL(AGENTSAM_INSTALL_PATH, AGENTSAM_INSTALL_ORIGIN);
  destination.search = new URLSearchParams({theme_sku: sku, theme_version: version, action: 'try'}).toString();
  return destination.href;
}
