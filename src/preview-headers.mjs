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

/** Public static preview aliases may also be loaded by a cross-origin CMS
 * editor. Preserve the asset response and grant CORS only to non-HTML files;
 * the document itself must not become a broadly readable cross-origin page.
 */
export function withPublicAssetCors(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || /^text\/html(?:;|$)/i.test(contentType)) return response;
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', '*');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
