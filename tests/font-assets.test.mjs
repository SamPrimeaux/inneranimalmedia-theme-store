import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { serveFontAssets } from '../src/font-assets.mjs';

const manifest = {
  source: 'fontsource',
  families: [{
    id: 'jetbrains-mono', family: 'JetBrains Mono', category: 'monospace', variable: true,
    weights: [100, 200, 300, 400, 500, 600, 700, 800],
    files: [
      { key: 'fonts/jetbrains-mono/latin-wght-normal.18be4527.woff2', subset: 'latin', weight: 'wght', style: 'normal' },
      { key: 'fonts/jetbrains-mono/latin-wght-italic.a8afa085.woff2', subset: 'latin', weight: 'wght', style: 'italic' },
      { key: 'fonts/jetbrains-mono/cyrillic-wght-normal.00000000.woff2', subset: 'cyrillic', weight: 'wght', style: 'normal' },
    ],
  }],
};
const manifestText = JSON.stringify(manifest);
const fontBytes = new TextEncoder().encode('woff2-font-bytes');

function object(value, etag = '"font-etag"') {
  const bytes = value instanceof Uint8Array ? value : new TextEncoder().encode(value);
  return {
    size: bytes.length,
    httpEtag: etag,
    body: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }),
    async text() { return new TextDecoder().decode(bytes); },
  };
}
function environment({ missing = [] } = {}) {
  const calls = [];
  const objects = new Map([
    ['fonts/manifest.json', object(manifestText, '"manifest-etag"')],
    ['fonts/jetbrains-mono/latin-wght-normal.18be4527.woff2', object(fontBytes)],
    ['fonts/jetbrains-mono/LICENSE.txt', object('SIL OPEN FONT LICENSE')],
  ]);
  return {
    calls,
    env: { THEME_PACKAGES: {
      async get(key) { calls.push(['get', key]); return missing.includes(key) ? null : objects.get(key) || null; },
      async head(key) { calls.push(['head', key]); return missing.includes(key) ? null : objects.get(key) || null; },
    } },
  };
}

test('font manifest is public, CORS-enabled, and cached briefly', async () => {
  const { env, calls } = environment();
  const response = await serveFontAssets(new Request('https://themes.example/fonts/manifest.json'), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), manifest);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.match(response.headers.get('cache-control'), /max-age=300/);
  assert.deepEqual(calls, [['get', 'fonts/manifest.json']]);
});

test('font CSS resolves manifest entries and declares variable weight/style ranges', async () => {
  const { env } = environment();
  const response = await serveFontAssets(new Request('https://themes.example/fonts/css?families=jetbrains-mono'), env);
  const css = await response.text();
  assert.equal(response.status, 200);
  assert.match(css, /font-family:"JetBrains Mono"/);
  assert.match(css, /font-weight:100 800/);
  assert.match(css, /font-style:italic/);
  assert.match(css, /font-display:swap/);
  assert.match(css, /https:\/\/themes\.example\/fonts\/jetbrains-mono\/latin-wght-normal/);
  assert.doesNotMatch(css, /cyrillic/);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
});

test('font files are served with immutable cache and cross-origin resource policy', async () => {
  const { env } = environment();
  const response = await serveFontAssets(new Request('https://themes.example/fonts/jetbrains-mono/latin-wght-normal.18be4527.woff2'), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'font/woff2');
  assert.match(response.headers.get('cache-control'), /immutable/);
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'cross-origin');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), fontBytes);
});

test('HEAD and license requests preserve content metadata', async () => {
  const { env, calls } = environment();
  const head = await serveFontAssets(new Request('https://themes.example/fonts/jetbrains-mono/latin-wght-normal.18be4527.woff2', { method: 'HEAD' }), env);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.ok(calls.some(([kind]) => kind === 'head'));
  const license = await serveFontAssets(new Request('https://themes.example/fonts/jetbrains-mono/LICENSE.txt'), env);
  assert.equal(license.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(await license.text(), 'SIL OPEN FONT LICENSE');
});

test('preflight and invalid paths fail safely without exposing other R2 prefixes', async () => {
  const { env, calls } = environment();
  const options = await serveFontAssets(new Request('https://themes.example/fonts/css', { method: 'OPTIONS' }), env);
  assert.equal(options.status, 204);
  const traversal = await serveFontAssets(new Request('https://themes.example/fonts/../install-index/index.json'), env);
  assert.equal(traversal.status, 404);
  const invalid = await serveFontAssets(new Request('https://themes.example/fonts/jetbrains-mono/../../install-index/index.json'), env);
  assert.equal(invalid.status, 404);
  assert.equal(calls.length, 0);
});

test('unknown families and methods are rejected', async () => {
  const { env } = environment();
  const unknown = await serveFontAssets(new Request('https://themes.example/fonts/css?families=not-a-font'), env);
  assert.equal(unknown.status, 404);
  const post = await serveFontAssets(new Request('https://themes.example/fonts/manifest.json', { method: 'POST' }), env);
  assert.equal(post.status, 405);
});


test('Wrangler routes font requests through the Worker before the SPA asset fallback', () => {
  const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  assert.match(config, /"run_worker_first"\s*:\s*\[[\s\S]*?"\/fonts\/\*"/);
});
