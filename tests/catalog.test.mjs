import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCatalog } from '../scripts/build-catalog.mjs';

const store = (extra = {}) => ({
  name: 'Fixture', summary: 'A fixture theme.', category: 'Services',
  tags: ['a'], pages: ['Home'], colorway: 'paper', ...extra,
});
async function addPackage(dir, slug, { version = '1.2.3', storeBlock = store(), agentsam = {} } = {}) {
  const folder = join(dir, 'theme-' + slug);
  await mkdir(folder, { recursive: true });
  const pkg = { name: '@fixture/theme-' + slug, version, agentsam: { slug, ...agentsam, ...(storeBlock ? { store: storeBlock } : {}) } };
  await writeFile(join(folder, 'package.json'), JSON.stringify(pkg));
}

test('adding a package adds a catalog entry with no other change', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'catalog-'));
  try {
    await addPackage(dir, 'alpha');
    assert.equal((await buildCatalog(dir)).length, 1);
    await addPackage(dir, 'beta', { version: '4.5.6' });
    const records = await buildCatalog(dir);
    assert.deepEqual(records.map(r => r.slug), ['alpha', 'beta']);
    assert.equal(records.find(r => r.slug === 'beta').version, '4.5.6'); // version comes from package.json only
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('packages without agentsam.store are not listed', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'catalog-'));
  try {
    await addPackage(dir, 'listed');
    await addPackage(dir, 'unlisted', { storeBlock: null });
    assert.deepEqual((await buildCatalog(dir)).map(r => r.slug), ['listed']);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('bad manifests fail loudly', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'catalog-'));
  try {
    await addPackage(dir, 'bad', { storeBlock: store({ category: 'Nonsense' }) });
    await assert.rejects(buildCatalog(dir), /category must be one of/);
    await rm(join(dir, 'theme-bad'), { recursive: true });
    await addPackage(dir, 'ok', { version: 'not-semver' });
    await assert.rejects(buildCatalog(dir), /semver/);
    await rm(join(dir, 'theme-ok'), { recursive: true });
    await mkdir(join(dir, 'theme-wrongdir'), { recursive: true });
    await writeFile(join(dir, 'theme-wrongdir', 'package.json'), JSON.stringify({ version: '1.0.0', agentsam: { slug: 'other', store: store() } }));
    await assert.rejects(buildCatalog(dir), /directory must be named theme-other/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('every listed package in this repo is publishable', async () => {
  const records = await buildCatalog(new URL('../packages', import.meta.url).pathname);
  assert.ok(records.length >= 9);
  assert.equal(new Set(records.map(r => r.slug)).size, records.length);
  for (const record of records) {
    if (record.previewBuild === 'external') continue;
    const entry = new URL('../packages/theme-' + record.slug + '/src/node.js', import.meta.url);
    await access(entry.pathname); // publish script imports this and calls materializePrebuild()
    const mod = await import(entry.href);
    assert.equal(typeof mod.materializePrebuild, 'function', record.slug + ' must export materializePrebuild');
  }
});
