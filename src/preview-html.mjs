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

export async function normalizePreviewManifest(manifest, htmlByPath, slug, version) {
  if (manifest?.schema !== 'iam.theme-preview-files.v1' || manifest.slug !== slug
      || manifest.version !== version || !Array.isArray(manifest.files)) {
    throw new Error('Invalid theme preview manifest identity');
  }
  if (!manifest.files.some(entry => entry.path === 'index.html')) throw new Error('Theme preview manifest has no index.html');
  const files = await Promise.all(manifest.files.map(async entry => {
    if (!entry.path.toLowerCase().endsWith('.html')) return entry;
    if (typeof htmlByPath[entry.path] !== 'string') throw new Error('Missing HTML for theme preview manifest');
    const normalized = normalizePreviewHtml(htmlByPath[entry.path], slug, version);
    const bytes = new TextEncoder().encode(normalized);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    const sha256 = [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    return {...entry, sha256};
  }));
  return {...manifest, files};
}
