// Legacy Theme Store app-embed route. The independently deployed App Store owns discovery.
export const EMBEDS_COLLECTION_URL = 'https://apps.inneranimalmedia.com/collections/embeds';
export function marketplaceRedirect(pathname) {
  if (pathname === '/app-embeds' || pathname === '/app-embeds/') return EMBEDS_COLLECTION_URL;
  return null;
}

// Preserve only the selected package. The authenticated CMS owns site selection,
// login and the release validation immediately before creating a draft.
export function themeInstallerUrl(configuredUrl, sku, version) {
  if (!/^iam\.theme\.[a-z][a-z0-9-]{0,63}$/.test(sku || '') ||
      !/^\d+\.\d+\.\d+$/.test(version || '')) return null;
  let destination;
  try {
    destination = new URL(configuredUrl);
  } catch {
    return null;
  }
  if (destination.protocol !== 'https:' || destination.username || destination.password ||
      destination.search || destination.hash) return null;
  destination.search = new URLSearchParams({theme_sku: sku, theme_version: version, action: 'try'}).toString();
  return destination.href;
}
