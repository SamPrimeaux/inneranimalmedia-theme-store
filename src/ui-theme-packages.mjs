const FILES = Object.freeze({
  'theme.css': 'text/css; charset=utf-8',
  'theme.json': 'application/json; charset=utf-8',
  'manifest.json': 'application/json; charset=utf-8',
  'monaco.json': 'application/json; charset=utf-8',
  'preview.svg': 'image/svg+xml',
});
const REGEX = /^\/api\/ui-themes\/([a-z0-9-]{1,100})\/([0-9a-f]{16})\/(theme\.css|theme\.json|manifest\.json|monaco\.json|preview\.svg)$/;

export function parseUiThemePackagePath(pathname) {
  const match = REGEX.exec(pathname);
  return match ? {slug: match[1], digest: match[2], file: match[3]} : null;
}

function unavailable(status = 404) {
  return new Response(JSON.stringify({ok:false,error:status===503?'ui_theme_storage_unavailable':'ui_theme_package_not_found'}),{
    status,
    headers:{'content-type':'application/json','cache-control':'private, no-store','x-content-type-options':'nosniff'},
  });
}

export async function authorizeStudioTheme(request, row) {
  const cookie = request.headers.get('Cookie')?.match(/(?:^|;\s*)session=([^;]+)/)?.[1];
  if (!cookie || cookie.length > 4096) return false;
  try {
    // The existing authenticated Studio registry is the source of truth.
    // Do not infer ownership from R2 objects, slug, or public user information.
    const result = await fetch('https://agentsam.inneranimalmedia.com/api/studio/themes',{
      method:'GET',
      headers:{Accept:'application/json',Cookie:'session='+cookie},
      redirect:'manual',
      signal:AbortSignal.timeout(4500),
    });
    if (!result.ok || !result.headers.get('content-type')?.includes('application/json')) return false;
    const data = await result.json();
    return data?.accountId === row.account_id && Array.isArray(data.themes) &&
      data.themes.some(theme => theme.id === row.id && theme.source === 'account-custom');
  } catch { return false; }
}

/** Read-only delivery of the current content-addressed UI theme package.
 * Unlike public installable site packages, private account themes require
 * proof from AgentSam's authenticated theme registry on every request.
 */
export async function serveUiThemePackage(request, env, authenticate = authorizeStudioTheme) {
  const url = new URL(request.url);
  const match = parseUiThemePackagePath(url.pathname);
  if (!match) return unavailable();
  if (request.method !== 'GET' && request.method !== 'HEAD') return unavailable(404);
  if (!env.DB || !env.THEME_PACKAGES) return unavailable(503);
  try {
    const row = await env.DB.prepare(
      'SELECT id,slug,status,visibility,account_id,css_r2_bucket,css_r2_key,compiled_css_hash FROM cms_themes WHERE slug = ? LIMIT 1'
    ).bind(match.slug).first();
    const base = 'cms/ui-themes/v1/'+match.slug+'/'+match.digest+'/';
    if (!row || row.status !== 'active' || row.css_r2_bucket !== 'theme-store' ||
        row.css_r2_key !== base+'theme.css' ||
        typeof row.compiled_css_hash !== 'string' || !/^[0-9a-f]{64}$/.test(row.compiled_css_hash) ||
        !row.compiled_css_hash.startsWith(match.digest)) return unavailable();
    const publicTheme = row.visibility === 'public' && !row.account_id;
    if (!publicTheme && !(await authenticate(request,row))) return unavailable();
    const object = await env.THEME_PACKAGES.get(base+match.file);
    if (!object?.body) return unavailable();
    const headers = new Headers({
      'content-type': FILES[match.file],
      'x-content-type-options':'nosniff',
      'cache-control': publicTheme ? 'public, max-age=31536000, immutable' : 'private, no-store, max-age=0',
      'x-theme-css-hash':row.compiled_css_hash,
    });
    if (!publicTheme) headers.set('vary','Cookie');
    if (object.httpEtag) headers.set('etag',object.httpEtag);
    if (match.file === 'preview.svg') headers.set('content-security-policy',"default-src 'none'; style-src 'none'; sandbox");
    return new Response(request.method === 'HEAD' ? null : object.body,{status:200,headers});
  } catch { return unavailable(503); }
}
