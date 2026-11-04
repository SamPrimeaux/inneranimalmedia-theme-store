#!/usr/bin/env node
/**
 * Generate the Theme Store catalog from the packages themselves.
 *
 * A package lists itself by declaring `agentsam.store` in its package.json
 * (the same idea as a Shopify theme's `theme_info`). Nothing about a theme is
 * typed anywhere else: the version always comes from `package.json#version`,
 * and the slug must match the package directory.
 *
 * Usage: node scripts/build-catalog.mjs   → writes src/catalog.generated.json
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CATEGORIES = ['Commerce', 'Nonprofit', 'Editorial', 'Services', 'Portfolio'];
export const COLORWAYS = ['wine', 'violet', 'paper'];
const SEMVER = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9.-]+)?$/;
const SLUG = /^[a-z0-9-]+$/;
const DEFAULT_PUBLISHER = 'InnerAnimalMedia';

function fail(dir, message) {
  throw new Error('catalog: ' + dir + ': ' + message);
}
function requireString(dir, store, key) {
  if (typeof store[key] !== 'string' || !store[key].trim()) fail(dir, 'agentsam.store.' + key + ' must be a non-empty string');
  return store[key];
}
function optionalStringList(dir, store, key, fallback) {
  if (store[key] === undefined) return fallback;
  const value = store[key];
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim())) fail(dir, 'agentsam.store.' + key + ' must be a list of strings');
  return value;
}
function requireStringList(dir, store, key) {
  const value = store[key];
  if (!Array.isArray(value) || !value.length || value.some(item => typeof item !== 'string' || !item.trim())) {
    fail(dir, 'agentsam.store.' + key + ' must be a non-empty array of strings');
  }
  return value;
}

/** Build catalog records from every `<packagesDir>/<dir>/package.json` that declares agentsam.store. */
export async function buildCatalog(packagesDir) {
  const dirs = (await readdir(packagesDir, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  const records = [];
  for (const dir of dirs) {
    let pkg;
    try { pkg = JSON.parse(await readFile(join(packagesDir, dir, 'package.json'), 'utf8')); } catch { continue; }
    const store = pkg?.agentsam?.store;
    if (!store) continue; // package has not opted in to the store
    const slug = pkg.agentsam.slug;
    if (typeof slug !== 'string' || !SLUG.test(slug)) fail(dir, 'agentsam.slug must match ' + SLUG);
    if (dir !== 'theme-' + slug) fail(dir, 'directory must be named theme-' + slug);
    if (typeof pkg.version !== 'string' || !SEMVER.test(pkg.version)) fail(dir, 'package.json version must be semver');
    const category = requireString(dir, store, 'category');
    if (!CATEGORIES.includes(category)) fail(dir, 'agentsam.store.category must be one of ' + CATEGORIES.join(', '));
    const colorway = requireString(dir, store, 'colorway');
    if (!COLORWAYS.includes(colorway)) fail(dir, 'agentsam.store.colorway must be one of ' + COLORWAYS.join(', '));
    const release = store.release;
    if (release?.status === 'published' && (
      !/^[a-f0-9]{64}$/.test(release.sha256 || '') ||
      release.storageKey !== 'releases/' + slug + '/' + pkg.version + '/' + release.sha256 + '.zip'
    )) fail(dir, 'published release must reference its immutable sha256 zip key');
    records.push({
      slug,
      sku: 'iam.theme.' + slug,
      name: requireString(dir, store, 'name'),
      summary: requireString(dir, store, 'summary'),
      category,
      tags: requireStringList(dir, store, 'tags'),
      pages: requireStringList(dir, store, 'pages'),
      industries: optionalStringList(dir, store, 'industries', [category]),
      features: optionalStringList(dir, store, 'features', requireStringList(dir, store, 'pages')),
      catalogSizes: optionalStringList(dir, store, 'catalogSizes', []),
      colorway,
      version: pkg.version,
      publisher: store.publisher ?? DEFAULT_PUBLISHER,
      priceUsd: store.priceUsd ?? null,
      minCmsSchema: '2',
      cardImage: typeof store.cardImage === 'string' ? store.cardImage : '/previews/' + slug + '.webp',
      sortOrder: Number.isFinite(store.sortOrder) ? store.sortOrder : 1000,
      previewBuild: store.previewBuild === 'external' ? 'external' : 'package',
      ...(store.editorial ? { editorial: store.editorial } : {}),
      // Only immutable, checksum-addressed releases declared by the source
      // package may be downloaded. No external catalog overrides this.
      release: pkg.agentsam?.store?.release?.status === 'published'
        ? { status: 'published',
            sha256: pkg.agentsam.store.release.sha256,
            storageKey: pkg.agentsam.store.release.storageKey }
        : { status: 'preview', sha256: null, storageKey: null },
    });
  }
  const seen = new Set();
  for (const record of records) {
    if (seen.has(record.slug)) throw new Error('catalog: duplicate slug ' + record.slug);
    seen.add(record.slug);
  }
  return records.sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug));
}

const here = dirname(fileURLToPath(import.meta.url));
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const records = await buildCatalog(join(here, '..', 'packages'));
  if (!records.length) throw new Error('catalog: no packages declare agentsam.store');
  const out = join(here, '..', 'src', 'catalog.generated.json');
  await writeFile(out, JSON.stringify({ schema: 'iam.theme-catalog-source.v1', themes: records }, null, 2) + '\n');
  console.log('catalog: ' + records.length + ' themes → src/catalog.generated.json (' + records.map(r => r.slug + '@' + r.version).join(', ') + ')');
}
