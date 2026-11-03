#!/usr/bin/env node
/**
 * Package an existing reviewed compiled theme into an immutable distribution
 * ZIP. The authored site remains in packages/theme-<slug>/; this never copies
 * the private source tree, secrets, browser profiles or user/customer records.
 * No one-off Plain Jane logic; future themes use exactly the same contract.
 *
 * node scripts/build-theme-release.mjs plain-jane             # local QA
 * node scripts/build-theme-release.mjs plain-jane --publish   # R2 + verify + record
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readdir, lstat, readFile, writeFile, rm, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, relative } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
const publish = process.argv.includes('--publish');
if (!/^[a-z][a-z0-9-]{0,62}$/.test(slug || '')) throw new Error('Usage: build-theme-release.mjs <theme-slug> [--publish]');
const pkgDir = join(ROOT, 'packages', 'theme-' + slug);
const pkgPath = join(pkgDir, 'package.json');
const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
if (pkg.agentsam?.slug !== slug || !pkg.agentsam?.store || !/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error('theme_package_invalid');
const provenancePath = join(pkgDir, 'provenance.json');
let provenance = {};
try { provenance = JSON.parse(await readFile(provenancePath, 'utf8')); } catch {}
if (pkg.private && !provenance.publishApproved) throw new Error('source_owner_release_approval_required');

function call(bin, args, cwd=ROOT) {
  const r = spawnSync(bin, args, { cwd, encoding: 'utf8', maxBuffer: 8_000_000 });
  if (r.error || r.status !== 0) throw new Error(bin + ': ' + (r.stderr || r.error?.message || r.stdout || r.status));
  return r.stdout.trim();
}
async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) throw new Error('hidden_asset_not_allowed: ' + entry.name);
    const file=join(directory,entry.name);
    const st=await lstat(file);
    if (st.isSymbolicLink()) throw new Error('theme_symlink_not_allowed');
    if (st.isDirectory()) result.push(...await files(file));
    else if (st.isFile()) result.push(file);
    else throw new Error('unexpected_theme_asset');
  }
  return result.sort();
}
const stage=await mkdtemp(join(tmpdir(),'iam-theme-release-'));
try {
  const materializer=await import(pathToFileURL(join(pkgDir,'src/node.js')).href);
  if (typeof materializer.materializePrebuild !== 'function') throw new Error('no_source_backed_materializer');
  const site=join(stage,'site');
  materializer.materializePrebuild(site,{basePath:'/'});
  const themeFiles=await files(site);
  if (!themeFiles.some(x=>x.endsWith('/index.html'))) throw new Error('theme_has_no_homepage');
  const manifest={
    schema:'iam.theme-package.v1',
    slug,sku:'iam.theme.'+slug,version:pkg.version,
    minCmsSchema:'2',publisher:'InnerAnimalMedia',
    distribution:'compiled-site-and-manifest',
    sourcePackage:pkg.name,
    pages:pkg.agentsam.store.pages,
    siteRoot:'site/',
    mediaAssets:themeFiles.map(file=>relative(site,file).replaceAll('\\','/')),
    permissionNotice:'First-party compiled package. Source package is not licensed for republishing or resale.',
  };
  await writeFile(join(stage,'theme-package.json'),JSON.stringify(manifest,null,2)+'\n');
  const targetDir=join(ROOT,'.releases');
  await mkdir(targetDir,{recursive:true});
  const tempZip=join(targetDir,slug+'-'+pkg.version+'.zip');
  await rm(tempZip,{force:true});
  const entries=['theme-package.json',...themeFiles.map(file=>'site/'+relative(site,file).replaceAll('\\','/'))];
  // All paths are constrained to the materialized site; reject escaping names.
  if (entries.some(x=>x.startsWith('/') || x.split('/').includes('..'))) throw new Error('invalid_archive_path');
  call('zip',['-X','-q',tempZip,...entries],stage);
  const bytes=await readFile(tempZip);
  const sha=createHash('sha256').update(bytes).digest('hex');
  const key='releases/'+slug+'/'+pkg.version+'/'+sha+'.zip';
  if (publish && pkg.agentsam.store.release?.status === 'published' &&
      pkg.agentsam.store.release.sha256 !== sha) {
    throw new Error('version_already_published_with_different_hash; bump package version before republishing');
  }
  console.log(JSON.stringify({slug,version:pkg.version,files:entries.length,bytes:bytes.length,sha256:sha,storageKey:key,local:tempZip}));
  if (publish) {
    const wrangler=JSON.parse(await readFile(join(ROOT,'wrangler.jsonc'),'utf8'));
    const bucket=wrangler.r2_buckets?.find(x=>x.binding==='THEME_PACKAGES')?.bucket_name;
    if(!bucket)throw new Error('theme_release_bucket_missing');
    call('npx',['wrangler','r2','object','put',bucket+'/'+key,'--remote','--file',tempZip,'--content-type','application/zip']);
    const roundTrip=join(stage,'verified.zip');
    call('npx',['wrangler','r2','object','get',bucket+'/'+key,'--remote','--file',roundTrip]);
    const check=createHash('sha256').update(await readFile(roundTrip)).digest('hex');
    if(check!==sha)throw new Error('r2_roundtrip_digest_mismatch');
    pkg.agentsam.store.release={status:'published',sha256:sha,storageKey:key};
    await writeFile(pkgPath,JSON.stringify(pkg,null,2)+'\n');
    console.log('Published and verified immutable artifact:',key);
  }
} finally {
  await rm(stage,{recursive:true,force:true});
}
