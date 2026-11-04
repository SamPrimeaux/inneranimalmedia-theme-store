/** Compatibility shim for reviewed legacy previews compiled with './' + absolute base paths.
 * New packages normalize this at build time. This never changes immutable R2 objects. */
export function normalizePreviewHtml(html, slug, version, { spaFallback = false } = {}) {
  const prefix = '/theme-packages/' + slug + '/' + version + '/preview/';
  let output = html.replaceAll('.' + prefix, prefix);
  // When a client-side route reuses the package homepage, relative links
  // must resolve at the installation root, not the nested route URL.
  if (spaFallback && !/<base\b/i.test(output))
    output = output.replace(/<head(?:\s[^>]*)?>/i, match => match + '<base href="' + prefix + '">');
  return output;
}
