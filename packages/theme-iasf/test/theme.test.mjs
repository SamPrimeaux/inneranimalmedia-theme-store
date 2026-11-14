import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTheme,
  createProductRow,
  createIasfStarterPackSeed,
  products,
  resolveStorefrontCssPath,
  readStorefrontCss,
} from '../src/index.js';

test('iasf is an installable stock theme', () => {
  const theme = createTheme();
  assert.equal(theme.slug, 'iasf');
  assert.equal(theme.installable, true);
  assert.equal(theme.stock, true);
  assert.equal(theme.package, '@inneranimalmedia/theme-iasf');
  assert.equal(theme.lineage, 'iasf');
  assert.ok(theme.pages.includes('Shop'));
});

test('iasf product row matches live agentsam_products columns', () => {
  const row = createProductRow({ repositoryId: 'repo_demo' });
  assert.equal(row.slug, 'iasf');
  assert.equal(row.kind, 'theme');
  assert.equal(row.status, 'wired');
  assert.equal(row.metadata.normalization_state, 'promoted_stock');
  assert.equal(row.metadata.stock, true);
  assert.equal(row.account_id, undefined);
});

test('iasf starter seed has multipage commerce routes', () => {
  const seed = createIasfStarterPackSeed();
  assert.equal(seed.id, 'iasf');
  assert.equal(seed.provenance.kind, 'builtin_starter');
  assert.ok(seed.pages.some((p) => p.slug === '/'));
  assert.ok(seed.pages.some((p) => p.slug === '/shop'));
  assert.ok(seed.pages.some((p) => p.slug === '/journal'));
  assert.ok(seed.pages.some((p) => p.slug === '/story'));
  assert.equal(products.length, 4);
  assert.ok(seed.theme.cssVars['--ia-acid']);
});

test('storefront css ships with the package', () => {
  const css = readStorefrontCss();
  assert.ok(css.includes('.ia-site'));
  assert.ok(resolveStorefrontCssPath().endsWith('storefront.css'));
});

// ── Global shell: header, footer, Join the Pack ─────────────────────────────
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { shellDefaults, mergeShellConfig, renderHeader, renderFooter, media } from '../src/index.js';
import { materializePrebuild } from '../src/node.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const runtimeDir = path.join(here, '..', 'src', 'runtime');

test('footer renders the signup form and ships no hotlinked or personal data', () => {
  const html = renderFooter(shellDefaults.footer, { year: 2030 });
  assert.match(html, /STAY CLOSE TO THE WILD\./);
  assert.match(html, /data-pack-form/);
  assert.match(html, /join the pack/i);
  assert.match(html, /<svg/); // signature credit
  assert.doesNotMatch(html, /imagedelivery\.net|unsplash|@gmail|tel:/i);
});

test('footer and header are editable: config merges and escapes', () => {
  const cfg = mergeShellConfig({ footer: { heading: '<b>x</b>' }, pack: { mode: 'preview' } });
  assert.equal(cfg.pack.mode, 'preview');
  assert.equal(cfg.footer.body, shellDefaults.footer.body); // untouched keys survive
  assert.doesNotMatch(renderFooter(cfg.footer), /<b>x<\/b>/);
  assert.match(renderHeader(cfg.header), /data-iasf-menu/);
});

test('every runtime file parses and the pack classifier maps the wire contract', () => {
  for (const f of fs.readdirSync(runtimeDir)) execFileSync(process.execPath, ['--check', path.join(runtimeDir, f)]);
  const sandbox = { module: { exports: {} }, window: {}, document: undefined };
  vm.runInNewContext(fs.readFileSync(path.join(runtimeDir, 'pack.js'), 'utf8'), sandbox);
  const { validEmail, classify, maskEmail } = sandbox.module.exports;
  assert.equal(validEmail('a@b.co'), true);
  assert.equal(validEmail('nope'), false);
  assert.equal(classify(200, {}).kind, 'success');
  assert.equal(classify(409, {}).kind, 'duplicate');
  assert.equal(classify(429, {}).kind, 'rate');
  assert.equal(classify(503, {}).kind, 'error');
  assert.ok(!maskEmail('sam@example.com').includes('sam@'));
});

test('materialized preview has shell, runtime, packaged media and no hotlinked hero', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iasf-'));
  const out = materializePrebuild(dir, { basePath: '/p/iasf/' });
  assert.equal(out.previewOnly, true);
  const home = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  assert.doesNotMatch(home, /<!--iasf:/);
  assert.match(home, /iasf-footer/);
  assert.match(home, /src="\/p\/iasf\/runtime\/pack\.js"/);
  assert.match(home, /"mode":"preview"/);
  for (const k of [media.hero, media.footer]) {
    assert.ok(fs.existsSync(path.join(dir, k.replace(/^\//, ''))), k);
  }
  assert.ok(fs.existsSync(path.join(dir, 'runtime', 'loader.js')));
  assert.doesNotMatch(fs.readFileSync(path.join(dir, 'journal', 'index.html'), 'utf8'), /unsplash/);
});

test('header is a floating pill with a looping announcement marquee', () => {
  const html = renderHeader(shellDefaults.header);
  assert.match(html, /class="ia-header-pill"/);
  assert.match(html, /data-iasf-dropbar/);
  const sets = html.match(/class="ia-dropbar-set"/g) || [];
  assert.equal(sets.length, 2); // duplicated set => seamless loop
  assert.match(html, /aria-hidden="true"><li>/);
  assert.match(html, /data-pack-open/);
  // single-text fallback still renders
  const one = renderHeader({ ...shellDefaults.header, dropbar: { enabled: true, text: 'HELLO', messages: [] } });
  assert.match(one, /<li>HELLO<\/li>/);
});

test('home ships the Resolve-grade section set, mockup hero and transition hooks', () => {
  const home = fs.readFileSync(path.join(here, '..', 'site', 'index.html'), 'utf8');
  for (const hook of ['ia-hero--atlas', 'ia-glass-card', 'ia-cream-card', 'data-iasf-carousel', 'ia-cats', 'ia-tiles', 'ia-rings', 'data-iasf-shelf', 'data-quick-add', 'ia-world', 'ia-feature', 'ia-quote']) {
    assert.ok(home.includes(hook), hook);
  }
  const css = readStorefrontCss();
  assert.match(css, /@view-transition\{navigation:auto\}/);
  assert.match(css, /view-transition-name:iasf-product/);
  assert.match(css, /@keyframes iasf-marquee/);
  const names = createIasfStarterPackSeed().pages.find((p) => p.slug === '/').sections.map((x) => x.name);
  for (const n of ['Atlas hero', 'Category cards', 'Editorial tiles', 'Story rings', 'Product shelf', 'Brand world', 'Material feature', 'Quote']) assert.ok(names.includes(n), n);
});

test('materialized preview loads the sections runtime and has no leaked markers', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iasf-sec-'));
  materializePrebuild(dir, { basePath: '/p/iasf/' });
  const home = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  assert.match(home, /src="\/p\/iasf\/runtime\/sections\.js"/);
  assert.match(home, /href="\/p\/iasf\/products\/wolf-heavyweight-tee\/"/);
  assert.ok(fs.existsSync(path.join(dir, 'runtime', 'sections.js')));
});
