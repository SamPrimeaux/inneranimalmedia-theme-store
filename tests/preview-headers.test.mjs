import assert from 'node:assert/strict';
import test from 'node:test';
import { previewFileHeaders, withPublicAssetCors } from '../src/preview-headers.mjs';

const types = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  png: 'image/png',
  woff2: 'font/woff2',
};

test('published preview styles/scripts/images/fonts allow opaque-origin editor previews', () => {
  for (const ext of ['css', 'js', 'png', 'woff2']) {
    const headers = previewFileHeaders(ext, types);
    assert.equal(headers.get('access-control-allow-origin'), '*', ext);
    assert.equal(headers.get('content-type'), types[ext], ext);
    assert.match(headers.get('cache-control'), /immutable/);
    assert.equal(headers.get('x-content-type-options'), 'nosniff');
  }
});

test('the public IAPJ alias grants CORS to static assets for embedded CMS previews', async () => {
  const asset = withPublicAssetCors(new Response('body{color:white}', {
    headers: { 'content-type': 'text/css', 'cache-control': 'public, max-age=0' },
  }));
  assert.equal(asset.headers.get('access-control-allow-origin'), '*');
  assert.equal(asset.headers.get('cross-origin-resource-policy'), 'cross-origin');
  assert.equal(asset.headers.get('content-type'), 'text/css');
  assert.equal(await asset.text(), 'body{color:white}');

  const document = withPublicAssetCors(new Response('<html></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  assert.equal(document.headers.get('access-control-allow-origin'), null);
});

test('HTML remains short-lived and does not introduce broad CORS on documents', () => {
  const headers = previewFileHeaders('html', types);
  assert.equal(headers.get('access-control-allow-origin'), null);
  assert.equal(headers.get('content-type'), types.html);
  assert.equal(headers.get('cache-control'), 'public, max-age=60');
  assert.equal(headers.get('content-security-policy'), "frame-ancestors 'self'");
});
