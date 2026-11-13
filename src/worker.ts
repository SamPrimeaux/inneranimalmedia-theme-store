import { findTheme, publicTheme, themes } from './catalog';
import siteDefaults from './site.default.json';
import { normalizePreviewHtml, normalizePreviewManifest } from './preview-html.mjs';
import { previewFileHeaders } from './preview-headers.mjs';
import { resolveDemoAlias, publicDemoUrl, normalizeReleaseAssetRelative } from './preview-routes.mjs';
import { resolveSite, type SiteDocument } from './site.mjs';
import { normalizeFooter, defaultFooter } from './footer.mjs';
import { normalizeHeader, defaultHeader } from './header.mjs';
import { verifiedInstallEntries, hasEditableInstallProject } from './install-index.mjs';
import { marketplaceRedirect, themeInstallerUrl } from './marketplace-redirect.mjs';
import { publishedStoreSettings, publishedStoreGlobal } from './published-cms.mjs';
import { serveUiThemePackage } from './ui-theme-packages.mjs';

type Env = {
  ASSETS: Fetcher;
  THEME_PACKAGES: R2Bucket;
  DB?: D1Database;
  THEME_INSTALLER_URL?: string;
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

// A theme is previewable only when its versioned preview is actually in R2.
async function resolvePreview(env: Env, origin: string, theme: { slug: string; version: string }): Promise<string | null> {
  const root = 'theme-packages/' + theme.slug + '/' + theme.version + '/preview/';
  try {
    if (await env.THEME_PACKAGES.head(root + 'index.html')) return publicDemoUrl(origin, theme.slug);
  } catch { /* storage hiccup: treat as not previewable */ }
  return null;
}
const strictVersion = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9.-]+)?$/;
const digest = /^[0-9a-f]{64}$/;

async function loadInstallIndex(env: Env) {
  try {
    const object = await env.THEME_PACKAGES.get('install-index/index.json');
    if (!object || object.size > 256_000) return null;
    return verifiedInstallEntries(await object.json(), themes);
  } catch { return null; }
}
function publicInstallableTheme(theme: (typeof themes)[number], previewUrl: string | null, installed: Awaited<ReturnType<typeof loadInstallIndex>>) {
  const product = publicTheme(theme, previewUrl);
  product.downloadReady = hasEditableInstallProject(theme, installed);
  return product;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    if (url.pathname.startsWith('/api/ui-themes/')) return serveUiThemePackage(request,env);
    // The old store-owned Studio has been retired. Keep this explicit 404
    // because SPA asset fallbacks would otherwise render the store at this URL.
    if (url.pathname === '/studio' || url.pathname.startsWith('/studio/')) return missing('route_not_found');
    const destination = marketplaceRedirect(url.pathname);
    if (destination && (method === 'GET' || method === 'HEAD')) {
      return new Response(null, { status:302, headers:{ location:destination, 'cache-control':'no-store' } });
    }
    if (url.pathname === '/api/account/me') {
      if (method !== 'GET') return missing('method_not_allowed',405);
      const headers = { 'cache-control':'private, no-store, max-age=0', 'vary':'Cookie', 'x-content-type-options':'nosniff' };
      const guest = () => Response.json({authenticated:false,requires_sso:true},{headers});
      // Proxy only the canonical session cookie to the authoritative AgentSam
      // session endpoint. No persisted user identities, public profile guesses,
      // or cached / R2 account records.
      const cookie = request.headers.get('Cookie')?.match(/(?:^|;\s*)session=([^;]+)/)?.[1];
      if (!cookie || cookie.length>4096) return guest();
      try {
        const result = await fetch('https://agentsam.inneranimalmedia.com/api/auth/me',{
          method:'GET',headers:{Accept:'application/json',Cookie:'session='+cookie},
          signal:AbortSignal.timeout(4500),redirect:'manual'
        });
        if (!result.ok || !result.headers.get('content-type')?.includes('application/json')) return guest();
        const body:any = await result.json();
        const user = body?.user ?? body?.data?.user ?? body?.data?.account ?? body?.account ?? body;
        const id = user?.id ?? user?.user_id ?? user?.auth_user_id;
        if (!body || body.ok===false || !(typeof id==='string' && id.length>0)) return guest();
        const clean=(s:unknown,n:number)=>typeof s==='string'?s.slice(0,n):'';
        const avatar=clean(user.avatar_url??user.avatarUrl??user.picture??user.profile_image_url??user.image_url,700);
        return Response.json({authenticated:true,user:{
          id:clean(id,100),name:clean(user.display_name??user.full_name??user.name,200),
          email:clean(user.email,250),avatar_url:avatar.startsWith('https://')?avatar:''
        }},{headers});
      } catch { return guest(); }
    }
    if (url.pathname === '/api/site') {
      if (method !== 'GET') return missing('method_not_allowed', 405);
      // The published CMS site row is authoritative. The versioned R2
      // delivery snapshot is a compatibility fallback, not an edit authority.
      let override: unknown;
      let source = 'r2-fallback';
      try {
        override = await publishedStoreSettings(env.DB);
        if (override) source = 'cms-d1';
      } catch (error) {
        console.error('Theme Store CMS site settings unavailable', error instanceof Error ? error.message : 'unknown');
      }
      if (!override) {
        try { const object = await env.THEME_PACKAGES.get('site/store-site.json'); override = object ? await object.json() : undefined; }
        catch { override = undefined; }
      }
      const site = resolveSite(siteDefaults as SiteDocument, override);
      return Response.json({ ok: true, site }, { headers: { 'cache-control': 'public, max-age=60', 'x-content-type-options': 'nosniff' } });
    }
    if (url.pathname === '/api/header' || url.pathname === '/api/footer') {
      if (method !== 'GET') return missing('method_not_allowed', 405);
      const header = url.pathname === '/api/header';
      const current = 'sites/theme-store/globals/' + (header ? 'header' : 'footer') + '/current.json';
      const legacy = header ? null : 'site/theme-store-footer.json';
      let value = header ? defaultHeader : defaultFooter;
      let published = null;
      try { published = await publishedStoreGlobal(env.DB, header ? 'header' : 'footer'); }
      catch (error) {
        console.error('Theme Store published CMS global unavailable', error instanceof Error ? error.message : 'unknown');
      }
      if (published) value = header ? normalizeHeader(published) : normalizeFooter(published);
      else try {
        const snapshot = await env.THEME_PACKAGES.get(current) || (legacy ? await env.THEME_PACKAGES.get(legacy) : null);
        if (snapshot && snapshot.size <= 128_000) value = header ? normalizeHeader(await snapshot.json()) : normalizeFooter(await snapshot.json());
      } catch { /* Retain bundled fallback if R2 is temporarily unavailable. */ }
      return Response.json(header ? { ok:true, header:value } : { ok:true, footer:value }, {
        headers:{ 'cache-control':'public, max-age=60', 'x-content-type-options':'nosniff' }
      });
    }
    const collectionPath = /^\/api\/collections\/([a-z0-9-]+)\/?$/.exec(url.pathname);
    if (collectionPath) {
      if (method !== 'GET') return missing('method_not_allowed',405);
      try {
        const obj = await env.THEME_PACKAGES.get('sites/theme-store/collections/'+collectionPath[1]+'/current.json');
        if (!obj || obj.size>256_000) return missing('collection_not_published');
        const collection:any=await obj.json();
        if (collection?.schema!=='iam.cms.public-collection.v1'||collection.site_id!=='theme-store'||collection.collection?.slug!==collectionPath[1])
          return missing('collection_invalid');
        return Response.json({ok:true,...collection},{headers:{'cache-control':'public, max-age=120','x-content-type-options':'nosniff'}});
      }catch{return missing('collection_unavailable',503);}
    }
    const mediaPath = /^\/site-media\/(?:(products)\/)?([a-z0-9-]+)\/([0-9a-f]{16})\.(webp|png|jpg|jpeg|svg)$/.exec(url.pathname);
    if (mediaPath) {
      if (method!=='GET'&&method!=='HEAD')return missing('method_not_allowed',405);
      const [,category,slug,hash,extension]=mediaPath;
      const key='sites/theme-store/media/'+(category==='products'?'products':'previews')+'/'+slug+'/'+hash+'.'+extension;
      try {
        const asset=await env.THEME_PACKAGES.get(key);
        if(!asset)return missing('media_not_found');
        const contentType=extension==='svg'?'image/svg+xml':extension==='webp'?'image/webp':extension==='png'?'image/png':'image/jpeg';
        return new Response(method==='HEAD'?null:asset.body,{status:200,headers:{
          'content-type':contentType,'cache-control':'public, max-age=31536000, immutable',
          'x-content-type-options':'nosniff','cross-origin-resource-policy':'same-site',
          ...(extension==='svg'?{'content-security-policy':'sandbox'}:{})
        }});
      }catch{return missing('media_unavailable',503);}
    }
    if (url.pathname === '/api/catalog') {
      if (method !== 'GET') return missing('method_not_allowed', 405);
      const installed = await loadInstallIndex(env);
      const products = await Promise.all(themes.map(async theme => {
        const product = publicInstallableTheme(theme, await resolvePreview(env, url.origin, theme), installed);
        product.installUrl = product.downloadReady ? themeInstallerUrl(env.THEME_INSTALLER_URL, theme.sku, theme.version) : null;
        return product;
      }));
      // Public CMS presentation is intentionally separate from signed theme releases.
      // Images, product copy and galleries may be changed without regenerating an
      // installable package; release/installation data remains package-owned.
      try {
        const obj=await env.THEME_PACKAGES.get('sites/theme-store/collections/themes/current.json');
        if(obj && obj.size<256_000){
          const catalog:any=await obj.json();
          if(catalog?.schema==='iam.cms.public-collection.v1'&&catalog.site_id==='theme-store'&&Array.isArray(catalog.items)){
            const approved=new Map<string,any>(catalog.items.filter((x:any)=>typeof x.slug==='string').map((x:any)=>[x.slug,x]));
            const safe=(url:any)=>typeof url==='string'&&url.startsWith('https://themes.inneranimalmedia.com/site-media/')?url:null;
            for(const product of products){
              const item=approved.get(product.slug);
              if(!item)continue;
              const cover=safe(item.cover_url);
              product.cardImage=cover||product.cardImage;
              product.iconUrl=safe(item.icon_url);
              product.galleryUrls=Array.isArray(item.gallery)?item.gallery.slice(0,12).filter((x:any)=>safe(x.url)).map((x:any)=>({url:safe(x.url),alt:typeof x.alt==='string'?x.alt.slice(0,250):product.name})):[];
              if(typeof item.name==='string'&&item.name.length<150)product.name=item.name;
              if(typeof item.summary==='string'&&item.summary.length<1000&&item.summary)product.summary=item.summary;
            }
          }
        }
      } catch { /* Installed theme metadata still comes from its verified package. */ }
      return response({ ok: true, schema: 'iam.theme-catalog.v1', products });
    }
    if (url.pathname === '/api/install-index') {
      if (method !== 'GET') return missing('method_not_allowed', 405);
      const packages = await loadInstallIndex(env);
      return response({ ok:true, schema:'agentsam.website-theme-install-index.v1', packages: packages ?? [] });
    }
    // Editable source projects are public immutable *starter* packages. Private
    // customer drafts/revisions are only in the authenticated AgentSam CMS.
    const installProject = /^\/api\/themes\/([a-z0-9-]+)\/([0-9]+\.[0-9]+\.[0-9]+)\/project$/.exec(url.pathname);
    if (installProject) {
      if (method !== 'GET' && method !== 'HEAD') return missing('method_not_allowed',405);
      const [,slug,version] = installProject;
      const installed = (await loadInstallIndex(env) ?? []).find(item=>item.slug===slug && item.version===version);
      if (!installed) return missing('installer_not_published');
      try {
        const project = await env.THEME_PACKAGES.get(installed.project_key);
        if (!project?.body || project.size > 8 * 1024 * 1024) return missing('installer_artifact_missing',503);
        return new Response(method==='HEAD'?null:project.body,{status:200,headers:{
          'content-type':'application/json; charset=utf-8',
          'cache-control':'public, max-age=31536000, immutable',
          'x-project-sha256':installed.project_sha256,
          'x-content-type-options':'nosniff',
          'access-control-allow-origin':'*',
        }});
      } catch {return missing('installer_artifact_unavailable',503);}
    }
    // Versioned, fully functional theme-package previews served from private R2.
    // R2 files: theme-packages/<slug>/<version>/preview/<relative-file>.
    const aliasPath = resolveDemoAlias(url.pathname, themes);
    if (url.pathname.startsWith('/themes/') && url.pathname.includes('/presets/') && !aliasPath) return missing('preview_not_found');
    const demo = /^\/theme-packages\/([a-z0-9-]+)\/([0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9.-]+)?)\/preview\/?(.*)$/.exec(aliasPath ?? url.pathname);
    if (demo) {
      if (method !== 'GET' && method !== 'HEAD') return missing('method_not_allowed', 405);
      const [, slug, version, relative] = demo;
      const theme = findTheme(slug);
      let approvedArchived = false;
      if (theme && version !== theme.version) {
        try { approvedArchived = !!(await env.THEME_PACKAGES.head('theme-packages/' + slug + '/' + version + '/preview/preview-files.json')); }
        catch { approvedArchived = false; }
      }
      if (!theme || (version !== theme.version && !approvedArchived)) return missing('preview_not_found');
      const canonicalRelative = normalizeReleaseAssetRelative(relative, slug, version);
      const segments = canonicalRelative.split('/').filter(Boolean);
      if (segments.some(segment => segment === '..' || segment.startsWith('.') || !/^[a-zA-Z0-9._-]+$/.test(segment))) return missing('invalid_preview_path', 400);
      const file = segments.length === 0 || canonicalRelative.endsWith('/') ? [...segments, 'index.html'].join('/') : segments.join('/');
      const keyRoot = 'theme-packages/' + slug + '/' + version + '/preview/';
      const types: Record<string, string> = {
        html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8',
        css: 'text/css; charset=utf-8', json: 'application/json',
        svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg',
        jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif',
        ico: 'image/x-icon', woff: 'font/woff', woff2: 'font/woff2',
      };
      try {
        let object = await env.THEME_PACKAGES.get(keyRoot + file);
        let contentFile = file;
        // Support a client-side router only if the requested route is not a static file.
        if (!object && !segments.at(-1)?.includes('.')) {
          object = await env.THEME_PACKAGES.get(keyRoot + 'index.html');
          contentFile = 'index.html';
        }
        if (!object) return missing('preview_asset_missing');
        const ext = contentFile.split('.').at(-1)?.toLowerCase() ?? '';
        const headers = previewFileHeaders(ext, types);
        if (contentFile === 'preview-files.json') {
          const manifest = await object.json<{schema:string;slug:string;version:string;files:Array<{path:string;sha256:string}>}>();
          const htmlByPath:Record<string,string> = {};
          await Promise.all(manifest.files.filter(entry=>entry.path.toLowerCase().endsWith('.html')).map(async entry=>{
            const htmlObject = await env.THEME_PACKAGES.get(keyRoot + entry.path);
            if (!htmlObject) throw new Error('Preview manifest HTML missing');
            htmlByPath[entry.path] = await htmlObject.text();
          }));
          const servedManifest = await normalizePreviewManifest(manifest, htmlByPath, slug, version);
          return new Response(method === 'HEAD' ? null : JSON.stringify(servedManifest), {status:200, headers});
        }
        if (ext === 'html') {
          const body = method === 'HEAD' ? null : normalizePreviewHtml(await object.text(), slug, version, { spaFallback: contentFile === 'index.html' && file !== 'index.html' });
          return new Response(body, {status: 200, headers});
        }
        return new Response(method === 'HEAD' ? null : object.body, {status: 200, headers});
      } catch {
        return missing('preview_storage_unavailable', 503);
      }
    }
    const match = /^\/api\/themes\/([^/]+)(?:\/([^/]+)\/(manifest\.json|download))?$/.exec(url.pathname);
    if (match) {
      if (method !== 'GET' && method !== 'HEAD') return missing('method_not_allowed', 405);
      const [, slug, version, operation] = match;
      if (!strictSlug.test(slug)) return missing('invalid_theme');
      const theme = findTheme(slug);
      if (!theme) return missing('theme_not_found');
      if (!version || !operation) return response({ ok: true, product: publicInstallableTheme(theme, await resolvePreview(env, url.origin, theme), await loadInstallIndex(env)) });
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
