import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { materializePrebuild } from '../packages/theme-iasf/src/node.js';
import { createTheme, products } from '../packages/theme-iasf/src/index.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const version = require('../packages/theme-iasf/package.json').version;
test('IASF preview is a complete, versioned, navigable standalone theme-store package', () => {
  const dir = mkdtempSync(join(tmpdir(), 'iasf-preview-'));
  const base = '/theme-packages/iasf/' + version + '/preview/';
  try {
    const result = materializePrebuild(join(dir, 'site'), { basePath: base });
    assert.equal(result.basePath, base);
    assert.equal(createTheme().version, version);
    const root = join(dir, 'site');
    for (const page of [
      '', 'shop', 'collections', 'collections/wolf', 'collections/bear',
      'collections/panther', 'collections/bull', 'journal', 'story', 'checkout',
      ...products.map(product => 'products/' + product.slug),
    ]) {
      const file = join(root, page, 'index.html');
      assert.equal(existsSync(file), true, page + ' is a real HTML destination');
      const html = readFileSync(file, 'utf8');
      assert.ok(html.includes(base + 'storefront.css'), page + ' has its styled theme');
      assert.ok(html.includes(base + 'preview-ui.css'), page + ' has its UI styles');
      assert.ok(html.includes(base + 'preview-ui.js'), page + ' has its interactions');
      assert.equal(/(?:href|src)="\/(?!theme-packages\/)/.test(html), false, page + ' has no broken root-relative local links');
    }
    const data = JSON.parse(readFileSync(join(root, 'site-data.json')));
    assert.equal(data.products.length, 4);
    assert.equal(data.products[0].slug, products[0].slug);
    const starter = JSON.parse(readFileSync(join(root, 'cms-starter.json')));
    assert.equal(starter.id, 'iasf');
    assert.ok(starter.pages.some(page => page.slug === '/shop'));
    assert.ok(readFileSync(join(root, 'preview-ui.js'), 'utf8').includes('initCheckout'));
    assert.ok(readFileSync(join(root, 'checkout/index.html'), 'utf8').includes('No payment'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
