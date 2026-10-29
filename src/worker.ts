import { findTheme, publicTheme, themes } from './catalog';

type Env = {
  ASSETS: Fetcher;
  THEME_PACKAGES: R2Bucket;
};

function response(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: {
    'cache-control': 'public, max-age=120',
    'x-content-type-options': 'nosniff',
  } });
}
function missing(message: string, status = 404): Response {
  return response({ ok: false, error: message }, status);
}
const strictSlug = /^[a-z0-9-]+$/;
const strictVersion = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9.-]+)?$/;
const digest = /^[0-9a-f]{64}$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    if (url.pathname === '/api/catalog') {
      if (method !== 'GET') return missing('method_not_allowed', 405);
      return response({ ok: true, schema: 'iam.theme-catalog.v1', products: themes.map(publicTheme) });
    }
    const match = /^\/api\/themes\/([^/]+)(?:\/([^/]+)\/(manifest\.json|download))?$/.exec(url.pathname);
    if (match) {
      if (method !== 'GET' && method !== 'HEAD') return missing('method_not_allowed', 405);
      const [, slug, version, operation] = match;
      if (!strictSlug.test(slug)) return missing('invalid_theme');
      const theme = findTheme(slug);
      if (!theme) return missing('theme_not_found');
      if (!version || !operation) return response({ ok: true, product: publicTheme(theme) });
      if (!strictVersion.test(version) || version !== theme.version) return missing('release_not_found');
      if (
        theme.release.status !== 'published' ||
        !theme.release.sha256 || !digest.test(theme.release.sha256) ||
        !theme.release.storageKey ||
        !theme.release.storageKey.endsWith('/' + theme.release.sha256 + '.zip') ||
        !theme.release.storageKey.startsWith('releases/' + slug + '/' + version + '/')
      ) return missing('release_not_published', 409);

      const packageManifest = {
        schema: 'iam.theme-release.v1',
        slug: theme.slug,
        sku: theme.sku,
        version: theme.version,
        cmsSchema: theme.minCmsSchema,
        sha256: theme.release.sha256,
        filename: theme.slug + '-' + theme.version + '.zip',
        downloadUrl: '/api/themes/' + theme.slug + '/' + theme.version + '/download',
      };
      if (operation === 'manifest.json') return response(packageManifest);
      try {
        const object = await env.THEME_PACKAGES.get(theme.release.storageKey);
        if (!object?.body) return missing('artifact_not_found_in_r2', 503);
        // SHA verification is enforced by the client CLI; the immutable key
        // carries the expected digest. Never serve drafts or paid products here.
        if (theme.priceUsd !== 0) return missing('release_requires_entitlement', 403);
        const headers = new Headers({
          'content-type': 'application/zip',
          'content-disposition': 'attachment; filename="' + packageManifest.filename + '"',
          'cache-control': 'public, max-age=31536000, immutable',
          'x-package-sha256': theme.release.sha256,
          'x-content-type-options': 'nosniff',
        });
        if (method === 'HEAD') return new Response(null, { status: 200, headers });
        return new Response(object.body, { status: 200, headers });
      } catch {
        return missing('artifact_storage_unavailable', 503);
      }
    }
    if (url.pathname.startsWith('/api/')) return missing('route_not_found');
    return env.ASSETS.fetch(request);
  },
};
