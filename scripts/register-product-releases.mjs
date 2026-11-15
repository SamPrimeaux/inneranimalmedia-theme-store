#!/usr/bin/env node
/**
 * Sync verified, published Theme Store releases to AgentSam's EXISTING product
 * registry. Source authority: Theme Store public catalog and R2 install index.
 * Use --dry-run to inspect; --publish to write D1. No staged JSON snapshot.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { selectVerifiedThemeReleases, planProductReleaseSql } from './product-release-registry.mjs';

const STORE = 'https://themes.inneranimalmedia.com';
const only = process.argv.find(x => x.startsWith('--only='))?.slice(7);
const output = process.argv.find(x => x.startsWith('--sql-output='))?.slice(13);
const publish = process.argv.includes('--publish');
if (process.argv.slice(2).some(x => !['--publish','--dry-run'].includes(x) &&
  !x.startsWith('--only=') && !x.startsWith('--sql-output=')))
  throw Error('unknown_registry_argument');
if (publish && process.argv.includes('--dry-run')) throw Error('conflicting_registry_mode');
const sha = data => createHash('sha256').update(data).digest('hex');

// Some published Theme Store releases are entitlement-gated for shopper
// downloads. Publisher access is different from customer access: verify the
// immutable R2 ZIP using authorized Wrangler, never open a public bypass.
async function verifiedReleaseZip(entry) {
  const path = '/api/themes/' + entry.slug + '/' + entry.version + '/download';
  const res = await fetch(STORE + path, {signal: AbortSignal.timeout(30000)});
  if (res.status !== 403) {
    if (!res.ok || new URL(res.url).origin !== STORE) throw Error('release_zip_unavailable:' + entry.slug);
    if (Number(res.headers.get('content-length') || 0) > 64 * 1024 * 1024)
      throw Error('oversized_release:' + entry.slug);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 64 * 1024 * 1024) throw Error('oversized_release:' + entry.slug);
    return bytes;
  }
  const error = await res.json().catch(() => ({}));
  if (error.error !== 'release_requires_entitlement')
    throw Error('release_zip_denied:' + entry.slug);
  const dir = await mkdtemp(join(tmpdir(), 'iam-entitled-release-'));
  try {
    const file = join(dir, 'release.zip');
    const result = spawnSync('npx',['wrangler','r2','object','get',
      'theme-store/' + entry.storageKey,'--remote','--file',file],
      {encoding:'utf8',maxBuffer:10_000_000});
    if (result.status !== 0) throw Error('publisher_r2_read_required:' + entry.slug);
    const bytes = await readFile(file);
    if (bytes.length > 64 * 1024 * 1024) throw Error('oversized_release:' + entry.slug);
    return bytes;
  } finally { await rm(dir,{recursive:true,force:true}); }
}

async function fetchBytes(path, limit = 64 * 1024 * 1024) {
  const url = STORE + path;
  const res = await fetch(url, { headers: { accept: '*/*' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok || new URL(res.url).origin !== STORE) throw Error('release_endpoint_unavailable:' + path);
  if (Number(res.headers.get('content-length') || 0) > limit) throw Error('oversized_release:' + path);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > limit) throw Error('oversized_release:' + path);
  return bytes;
}
const [indexBytes, catalogBytes] = await Promise.all([
  fetchBytes('/api/install-index', 2 * 1024 * 1024),
  fetchBytes('/api/catalog', 2 * 1024 * 1024),
]);
const releases = selectVerifiedThemeReleases(
  JSON.parse(indexBytes.toString('utf8')), JSON.parse(catalogBytes.toString('utf8')), { only });
for (const entry of releases) {
  const path = '/api/themes/' + entry.slug + '/' + entry.version;
  const [manifestBytes, projectBytes, zipBytes] = await Promise.all([
    fetchBytes(path + '/manifest.json', 1024 * 1024),
    fetchBytes(path + '/project', 8 * 1024 * 1024),
    verifiedReleaseZip(entry),
  ]);
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  const project = JSON.parse(projectBytes.toString('utf8'));
  if (manifest.schema !== 'iam.theme-release.v1' ||
    manifest.slug !== entry.slug || manifest.version !== entry.version ||
    manifest.sha256 !== entry.sha256 ||
    manifest.downloadUrl !== path + '/download' ||
    sha(projectBytes) !== entry.projectHash ||
    project.schema !== 'agentsam.theme-project.v1' ||
    project.sourceThemeId !== entry.slug ||
    project.sourcePackageVersion !== entry.version ||
    project.sourceReleaseSha256 !== entry.sha256 ||
    !Array.isArray(project.pages) || project.pages.length !== entry.pageCount ||
    sha(zipBytes) !== entry.sha256) throw Error('published_theme_bytes_mismatch:' + entry.slug);
  entry.byteSize = zipBytes.length;
  console.log('VERIFIED',entry.slug,entry.version,entry.pageCount,'pages',entry.byteSize,'bytes');
}
const sql = planProductReleaseSql(releases);
if (output) await writeFile(output, sql);
if (!publish) {
  console.log('DRY RUN: '+releases.length+' verified releases; no database mutation.');
  if (!output) console.log(sql);
} else {
  const dir = await mkdtemp(join(tmpdir(),'iam-release-registry-'));
  try {
    const file = join(dir,'release-registry.sql');
    await writeFile(file,sql);
    const child = spawnSync('npx',['wrangler','d1','execute','inneranimalmedia-business','--remote','--file',file],
      {encoding:'utf8',maxBuffer:10_000_000});
    if(child.status !== 0) throw Error('registry_d1_write_failed: '+(child.stderr || child.stdout));
    const list = releases.map(entry => "'" + entry.slug + "'").join(',');
    const verifySql = `SELECT p.slug, p.version AS product_version, r.version AS release_version,
      r.release_status, r.sha256, r.r2_key, r.byte_size
      FROM agentsam_products p JOIN agentsam_product_releases r ON r.product_id=p.id
      WHERE p.kind='theme' AND p.slug IN (${list}) AND r.version=p.version;`;
    const checked = spawnSync('npx',['wrangler','d1','execute','inneranimalmedia-business','--remote',
      '--command',verifySql,'--json'],{encoding:'utf8',maxBuffer:10_000_000});
    if (checked.status !== 0) throw Error('registry_d1_readback_failed:'+(checked.stderr||checked.stdout));
    const response = JSON.parse(checked.stdout);
    const rows = (Array.isArray(response) ? response : [response]).flatMap(entry => entry.results || []);
    for (const entry of releases) {
      const matches = rows.filter(row => row.slug===entry.slug &&
        row.product_version===entry.version && row.release_version===entry.version &&
        row.release_status==='published' && row.sha256===entry.sha256 &&
        row.r2_key===entry.storageKey && Number(row.byte_size)===entry.byteSize);
      if (matches.length !== 1) throw Error('registry_d1_readback_mismatch:'+entry.slug);
    }
    console.log('SYNCED AND VERIFIED',releases.length,'releases to agentsam_product_releases');
  } finally { await rm(dir,{recursive:true,force:true}); }
}
