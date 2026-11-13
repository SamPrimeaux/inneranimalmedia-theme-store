#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const value = (name, fallback) => {
  const item = args.find((arg) => arg.startsWith(`--${name}=`));
  return item ? item.slice(name.length + 3) : fallback;
};
const bucket = value('bucket', 'theme-store');
const prefix = value('prefix', 'fonts').replace(/^\/+|\/+$/g, '');
const familyIds = args.filter((arg) => arg.startsWith('--family=')).map((arg) => arg.slice(9));
const apply = args.includes('--apply');
const temp = mkdtempSync(path.join(os.tmpdir(), 'agentsam-fontsource-'));
const immutable = 'public, max-age=31536000, immutable';
const catalogUrl = 'https://api.fontsource.org/v1/fonts';
const cdn = 'https://cdn.jsdelivr.net/fontsource/fonts/';
const headers = { 'User-Agent': 'AgentSam-Font-Catalog/1.0' };

async function get(url, method = 'GET') {
  const response = await fetch(url, { method, headers, redirect: 'follow' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return method === 'HEAD' ? null : Buffer.from(await response.arrayBuffer());
}
function wrangler(args, options = {}) {
  return execFileSync('npx', ['wrangler', ...args], {
    cwd: process.cwd(),
    encoding: options.encoding || 'buffer',
    maxBuffer: 8 * 1024 * 1024,
    stdio: options.stdio || ['ignore', 'pipe', 'inherit'],
  });
}
function upload(key, bytes, contentType, cacheControl) {
  const file = path.join(temp, createHash('sha256').update(key).digest('hex').slice(0, 16));
  writeFileSync(file, bytes);
  wrangler(['r2', 'object', 'put', `${bucket}/${key}`, '--file', file, '--content-type', contentType, '--cache-control', cacheControl, '--remote'], { stdio: 'inherit' });
}
function verify(key, expected) {
  const actual = wrangler(['r2', 'object', 'get', `${bucket}/${key}`, '--pipe', '--remote']);
  const digest = createHash('sha256').update(actual).digest('hex');
  const expectedDigest = createHash('sha256').update(expected).digest('hex');
  if (digest !== expectedDigest) throw new Error(`R2 verification failed: ${key}`);
}
function nearestWeights(weights) {
  const available = (weights || []).map(Number).filter(Number.isFinite);
  if (!available.length) return [400];
  return [...new Set([400, 700].map((target) => available.reduce((best, weight) => Math.abs(weight - target) < Math.abs(best - target) ? weight : best, available[0])))].sort((a, b) => a - b);
}
async function buildFamily(id, catalogEntry) {
  const detail = await (await fetch(`https://api.fontsource.org/v1/fonts/${id}`, { headers })).json();
  if (!detail || detail.id !== id) throw new Error(`Fontsource family not found: ${id}`);
  const version = String(detail.npmVersion || catalogEntry.npmVersion || 'latest');
  const subsets = [...new Set(['latin', ...(detail.defSubset && detail.defSubset !== 'latin' ? [detail.defSubset] : [])])]
    .filter((subset) => (detail.subsets || []).includes(subset));
  const styles = detail.styles || catalogEntry.styles || ['normal'];
  const planned = [];
  if (detail.variable) {
    for (const subset of subsets) {
      for (const style of styles) {
        planned.push({ url: `${cdn}${id}:vf@latest/${subset}-wght-${style}.woff2`, subset, weight: 'wght', style });
      }
    }
  } else {
    const weights = nearestWeights(detail.weights || catalogEntry.weights);
    for (const weight of weights) {
      for (const subset of subsets) {
        for (const style of styles) {
          const file = detail.variants?.[String(weight)]?.[style]?.[subset]?.url?.woff2;
          if (file) planned.push({ url: file, subset, weight: String(weight), style });
        }
      }
    }
  }
  const files = [];
  const blobs = [];
  for (const item of planned) {
    let bytes;
    try { bytes = await get(item.url); }
    catch (error) { process.stderr.write(`skip ${id} ${item.subset}/${item.weight}/${item.style}: ${error.message}\n`); continue; }
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const filename = `${item.subset}-${item.weight}-${item.style}.${sha256.slice(0, 8)}.woff2`;
    const key = `${prefix}/${id}/${filename}`;
    files.push({ key, subset: item.subset, weight: item.weight, style: item.style, bytes: bytes.length, sha256 });
    blobs.push({ key, bytes, contentType: 'font/woff2' });
  }
  if (!files.length) throw new Error(`No usable WOFF2 files found for ${id}`);
  let license;
  try { license = await get(`https://cdn.jsdelivr.net/npm/@fontsource/${id}@${version}/LICENSE`); }
  catch { license = await get(`https://cdn.jsdelivr.net/npm/@fontsource/${id}/LICENSE`); }
  const licenseKey = `${prefix}/${id}/LICENSE.txt`;
  blobs.push({ key: licenseKey, bytes: license, contentType: 'text/plain; charset=utf-8' });
  return {
    entry: {
      id,
      family: detail.family || catalogEntry.family,
      category: detail.category || catalogEntry.category,
      license: detail.license || catalogEntry.license,
      variable: Boolean(detail.variable),
      weights: detail.weights || catalogEntry.weights || [],
      styles,
      subsets,
      default_subset: detail.defSubset || catalogEntry.defSubset || 'latin',
      npm_version: version,
      files,
      license_key: licenseKey,
    },
    blobs,
  };
}

try {
  const catalog = await (await fetch(catalogUrl, { headers })).json();
  const catalogById = new Map(catalog.map((item) => [item.id, item]));
  const manifestBytes = wrangler(['r2', 'object', 'get', `${bucket}/${prefix}/manifest.json`, '--pipe', '--remote']);
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  if (!Array.isArray(manifest.families)) throw new Error('Invalid font manifest: families array missing');

  // Enrich the existing 248 records with authoritative Fontsource axis metadata.
  for (const family of manifest.families) {
    const source = catalogById.get(family.id);
    if (!source) continue;
    family.weights = source.weights || family.weights || [];
    family.styles = source.styles || family.styles || ['normal'];
    family.subsets = source.subsets || family.subsets || [];
    family.default_subset = source.defSubset || family.default_subset || 'latin';
    family.npm_version = source.npmVersion || family.npm_version || null;
  }

  const additions = familyIds.length ? familyIds : [];
  const blobs = [];
  for (const id of additions) {
    if (!/^[a-z0-9-]{1,80}$/.test(id)) throw new Error(`Invalid family id: ${id}`);
    if (manifest.families.some((family) => family.id === id)) {
      process.stdout.write(`already present: ${id}\n`);
      continue;
    }
    const source = catalogById.get(id);
    if (!source) throw new Error(`Fontsource catalog does not contain ${id}`);
    const built = await buildFamily(id, source);
    manifest.families.push(built.entry);
    blobs.push(...built.blobs);
  }
  manifest.families.sort((a, b) => String(a.family).localeCompare(String(b.family)));
  manifest.updated_at = new Date().toISOString();
  const output = Buffer.from(`${JSON.stringify(manifest, null, 1)}\n`);
  const fontBytes = blobs.filter((blob) => blob.contentType === 'font/woff2').reduce((sum, blob) => sum + blob.bytes.length, 0);
  process.stdout.write(`mode=${apply ? 'APPLY' : 'DRY RUN'} bucket=${bucket} prefix=${prefix}\n`);
  process.stdout.write(`families=${manifest.families.length} new_objects=${blobs.length} new_font_bytes=${fontBytes} manifest_bytes=${output.length}\n`);
  for (const blob of blobs) process.stdout.write(`  ${blob.key} (${blob.bytes.length} bytes)\n`);
  if (!apply) {
    process.stdout.write('No objects written. Pass --apply to upload and verify.\n');
  } else {
    for (const blob of blobs) {
      upload(blob.key, blob.bytes, blob.contentType, immutable);
      verify(blob.key, blob.bytes);
    }
    upload(`${prefix}/manifest.json`, output, 'application/json; charset=utf-8', 'public, max-age=300, stale-while-revalidate=86400');
    verify(`${prefix}/manifest.json`, output);
    process.stdout.write('Font objects, licenses, and manifest uploaded and SHA-256 verified.\n');
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
