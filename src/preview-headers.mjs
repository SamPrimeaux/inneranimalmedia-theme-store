/**
 * Public, immutable preview assets may be loaded inside the CMS editor's
 * sandboxed srcdoc preview (an opaque origin). Stylesheets and module scripts
 * require CORS even when their original storefront URL is on this same host.
 */
export function previewFileHeaders(ext, types = {}) {
  const asset = String(ext || '').toLowerCase();
  const headers = new Headers({
    'content-type': types[asset] ?? 'application/octet-stream',
    'cache-control': asset === 'html'
      ? 'public, max-age=60'
      : 'public, max-age=31536000, immutable',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "frame-ancestors 'self'",
  });
  if (asset !== 'html') {
    // All objects reachable by the public /theme-packages/.../preview/ route
    // are published preview resources, never private theme draft documents.
    headers.set('access-control-allow-origin', '*');
  }
  return headers;
}
