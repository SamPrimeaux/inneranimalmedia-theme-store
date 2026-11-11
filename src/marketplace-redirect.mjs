// Legacy Theme Store app-embed route. The independently deployed App Store owns discovery.
export const EMBEDS_COLLECTION_URL = 'https://apps.inneranimalmedia.com/collections/embeds';
export function marketplaceRedirect(pathname) {
  if (pathname === '/app-embeds' || pathname === '/app-embeds/') return EMBEDS_COLLECTION_URL;
  return null;
}
