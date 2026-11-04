import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDemoAlias, publicDemoUrl, normalizeReleaseAssetRelative } from '../src/preview-routes.mjs';
const records = [{slug:'resolve',version:'2.6.13'}];
test('stable theme demo resolves to pinned version without a database',()=>{
  assert.equal(resolveDemoAlias('/themes/resolve/presets/resolve/demo/',records),
    '/theme-packages/resolve/2.6.13/preview/');
  assert.equal(resolveDemoAlias('/themes/resolve/presets/resolve/demo/collections/all',records),
    '/theme-packages/resolve/2.6.13/preview/collections/all');
  assert.equal(publicDemoUrl('https://themes.inneranimalmedia.com','resolve'),
    'https://themes.inneranimalmedia.com/themes/resolve/presets/resolve/demo/');
});
test('invalid presets do not alias another theme',()=>{
  assert.equal(resolveDemoAlias('/themes/resolve/presets/other/demo/',records),null);
  assert.equal(resolveDemoAlias('/themes/unknown/presets/unknown/demo/',records),null);
  assert.equal(resolveDemoAlias('/themes/resolve/',records),null);
});

test('repairs nested own-release asset paths without crossing theme boundaries', () => {
  assert.equal(normalizeReleaseAssetRelative('portal/theme-packages/resolve/2.6.13/preview/assets/photo.webp','resolve','2.6.13'),'assets/photo.webp');
  assert.equal(normalizeReleaseAssetRelative('portal/theme-packages/other/2.6.13/preview/assets/photo.webp','resolve','2.6.13'),'portal/theme-packages/other/2.6.13/preview/assets/photo.webp');
  assert.equal(normalizeReleaseAssetRelative('portal/cart/index.html','resolve','2.6.13'),'portal/cart/index.html');
});
