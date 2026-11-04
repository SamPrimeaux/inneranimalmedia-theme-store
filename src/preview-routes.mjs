/** Stable theme-demo URLs resolve to immutable R2 releases.
 * No tenant identity or CMS data is stored or inferred here.
 */
export function resolveDemoAlias(pathname, themes) {
  const match = /^\/themes\/([a-z0-9-]+)\/presets\/([a-z0-9-]+)\/demo\/?(.*)$/.exec(pathname);
  if (!match) return null;
  const [,slug,preset,rest] = match;
  const theme = themes.find(record => record.slug === slug);
  if (!theme || (preset !== slug && preset !== 'default')) return null;
  return '/theme-packages/' + slug + '/' + theme.version + '/preview/' + rest;
}
export function publicDemoUrl(origin, slug) {
  return origin + '/themes/' + slug + '/presets/' + slug + '/demo/';
}
