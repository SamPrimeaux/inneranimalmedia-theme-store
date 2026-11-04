/** Compatibility shim for reviewed legacy previews compiled with './' + absolute base paths.
 * New packages normalize this at build time. This never changes immutable R2 objects. */
export function normalizePreviewHtml(html, slug, version) {
  const prefix = '/theme-packages/' + slug + '/' + version + '/preview/';
  return html.replaceAll('.' + prefix, prefix);
}
