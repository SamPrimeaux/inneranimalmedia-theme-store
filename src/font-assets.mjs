const PREFIX = 'fonts/';
const FONT_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*-(?:wght|\d{3})-(?:normal|italic)\.[a-f0-9]{8}\.woff2$/;
const FAMILY_ID = /^[a-z0-9-]{1,80}$/;
const FONT_CACHE = 'public, max-age=31536000, immutable';
const CATALOG_CACHE = 'public, max-age=300, stale-while-revalidate=86400';

function corsHeaders(extra = {}) {
  return new Headers({
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, HEAD, OPTIONS',
    'access-control-allow-headers': 'Origin, Range, If-None-Match',
    'access-control-max-age': '86400',
    'access-control-expose-headers': 'Content-Length, ETag, Cache-Control',
    'cross-origin-resource-policy': 'cross-origin',
    'x-content-type-options': 'nosniff',
    ...extra,
  });
}

function jsonError(error, status, cache = 'no-store') {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: corsHeaders({ 'content-type': 'application/json; charset=utf-8', 'cache-control': cache }),
  });
}

function responseFromObject(request, object, contentType, cacheControl) {
  const headers = corsHeaders({
    'content-type': contentType,
    'cache-control': cacheControl,
    'content-disposition': 'inline',
  });
  if (Number.isFinite(object.size)) headers.set('content-length', String(object.size));
  const etag = object.httpEtag || (object.etag ? `"${object.etag}"` : null);
  if (etag) {
    headers.set('etag', etag);
    const requested = request.headers.get('if-none-match')?.split(',').map((item) => item.trim()) || [];
    if (requested.includes(etag) || requested.includes('*')) return new Response(null, { status: 304, headers });
  }
  return new Response(request.method.toUpperCase() === 'HEAD' ? null : object.body, { status: 200, headers });
}

async function readManifest(bucket) {
  const object = await bucket.get(`${PREFIX}manifest.json`);
  if (!object || object.size > 2_000_000) return null;
  const raw = await object.text();
  const manifest = JSON.parse(raw);
  if (!manifest || !Array.isArray(manifest.families)) return null;
  return manifest;
}

function cssQuoted(value) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function familyCss(family, origin) {
  const files = Array.isArray(family.files) ? family.files : [];
  const latin = files.filter((file) => file.subset === 'latin');
  const selected = latin.length ? latin : files.slice(0, 2);
  const familyName = cssQuoted(family.family || family.id);
  const weights = (family.weights || []).map(Number).filter((value) => Number.isInteger(value) && value >= 100 && value <= 1000);
  const weightRange = weights.length > 1 ? `${Math.min(...weights)} ${Math.max(...weights)}` : String(weights[0] || 400);
  const rules = [];
  for (const file of selected) {
    if (!file || typeof file.key !== 'string' || !file.key.startsWith(`${PREFIX}${family.id}/`)) continue;
    const filename = file.key.slice(`${PREFIX}${family.id}/`.length);
    if (!FONT_FILE.test(filename)) continue;
    const style = file.style === 'italic' ? 'italic' : file.style === 'normal' ? 'normal' : null;
    if (!style) continue;
    const weight = file.weight === 'wght' && family.variable ? weightRange : /^\d{3}$/.test(String(file.weight)) ? String(file.weight) : null;
    if (!weight) continue;
    const src = new URL(`/${file.key}`, origin).href;
    rules.push(`@font-face{font-family:"${familyName}";font-style:${style};font-weight:${weight};font-display:swap;src:url("${src}") format("woff2");}`);
  }
  return rules.join('\n');
}

export async function serveFontAssets(request, env) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders({ 'cache-control': 'public, max-age=86400' }) });
  if (method !== 'GET' && method !== 'HEAD') return jsonError('method_not_allowed', 405);
  if (!env?.THEME_PACKAGES) return jsonError('font_storage_unavailable', 503);

  if (url.pathname === '/fonts/manifest.json') {
    try {
      const object = await env.THEME_PACKAGES.get(`${PREFIX}manifest.json`);
      if (!object || object.size > 2_000_000) return jsonError('font_manifest_unavailable', 503);
      return responseFromObject(request, object, 'application/json; charset=utf-8', CATALOG_CACHE);
    } catch {
      return jsonError('font_manifest_unavailable', 503);
    }
  }

  if (url.pathname === '/fonts/css') {
    const raw = url.searchParams.get('families') || '';
    const ids = [...new Set(raw.split(',').map((item) => item.trim()).filter(Boolean))];
    if (!ids.length || ids.length > 8 || ids.some((id) => !FAMILY_ID.test(id))) return jsonError('invalid_font_families', 400);
    try {
      const manifest = await readManifest(env.THEME_PACKAGES);
      if (!manifest) return jsonError('font_manifest_unavailable', 503);
      const byId = new Map(manifest.families.map((family) => [family.id, family]));
      const selected = ids.map((id) => byId.get(id));
      if (selected.some((family) => !family)) return jsonError('font_family_not_found', 404);
      const css = selected.map((family) => familyCss(family, url.origin)).filter(Boolean).join('\n');
      if (!css) return jsonError('font_files_unavailable', 404);
      return new Response(method === 'HEAD' ? null : css, {
        status: 200,
        headers: corsHeaders({
          'content-type': 'text/css; charset=utf-8',
          'cache-control': CATALOG_CACHE,
          'content-length': String(new TextEncoder().encode(css).length),
        }),
      });
    } catch {
      return jsonError('font_manifest_unavailable', 503);
    }
  }

  const match = url.pathname.match(/^\/fonts\/([a-z0-9-]{1,80})\/(.+)$/);
  if (!match) return jsonError('font_asset_not_found', 404);
  const [, familyId, filename] = match;
  const isLicense = filename === 'LICENSE.txt';
  if (!isLicense && !FONT_FILE.test(filename)) return jsonError('font_asset_not_found', 404);
  const key = `${PREFIX}${familyId}/${filename}`;
  try {
    const object = method === 'HEAD' && typeof env.THEME_PACKAGES.head === 'function'
      ? await env.THEME_PACKAGES.head(key)
      : await env.THEME_PACKAGES.get(key);
    if (!object) return jsonError('font_asset_not_found', 404);
    return responseFromObject(
      request,
      object,
      isLicense ? 'text/plain; charset=utf-8' : 'font/woff2',
      FONT_CACHE,
    );
  } catch {
    return jsonError('font_asset_unavailable', 503);
  }
}
