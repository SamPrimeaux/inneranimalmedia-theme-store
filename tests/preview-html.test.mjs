import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePreviewHtml } from '../src/preview-html.mjs';

test('legacy relative prefixes become absolute without mutating other paths',()=>{
  const bad='<link href="./theme-packages/resolve/2.6.13/preview/assets/main.css"><script src="./theme-packages/resolve/2.6.13/preview/assets/main.js"></script>';
  const corrected=normalizePreviewHtml(bad,'resolve','2.6.13');
  assert.ok(corrected.includes('href="/theme-packages/resolve/2.6.13/preview/assets/main.css"'));
  assert.ok(corrected.includes('src="/theme-packages/resolve/2.6.13/preview/assets/main.js"'));
  assert.equal(normalizePreviewHtml(corrected,'resolve','2.6.13'),corrected);
});
test('does not rewrite another theme or arbitrary URL',()=>{
  const source='<link href="./theme-packages/harbor/2.6.13/preview/global.css">';
  assert.equal(normalizePreviewHtml(source,'resolve','2.6.13'),source);
});

test('SPA routes retain root-relative navigation under the released preview root', () => {
 const html='<html><head><title>Test</title></head><body><a href="./shop.html">Shop</a></body></html>';
 assert.match(normalizePreviewHtml(html,'ember','2.6.13',{spaFallback:true}),/<base href="\/theme-packages\/ember\/2\.6\.13\/preview\/">/);
 assert.equal(normalizePreviewHtml(html,'ember','2.6.13'),html);
});
