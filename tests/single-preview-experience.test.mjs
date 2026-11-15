import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveDemoAlias } from '../src/preview-routes.mjs';

// This is a UI contract regression guard. All customer-facing preview
// actions operate on the existing live iframe, not a second demo tab.
test('Theme Store has one in-place interactive demo, with fullscreen and Add', () => {
  const src=readFileSync(new URL('../src/ThemeExperience.tsx',import.meta.url),'utf8');
  assert.equal((src.match(/<iframe\s/g)||[]).length,1);
  assert.match(src, /<iframe src=\{theme\.previewUrl!\}/);
  assert.match(src, /onClick=\{fullscreen\} className="experience-demo-button"/);
  assert.match(src, /Return to preview/);
  assert.match(src, /onClick=\{onTry\}>Add/);
  assert.doesNotMatch(src, /href=\{theme\.previewUrl!\}/);
  assert.doesNotMatch(src, /View demo/);
});

test('old IASF direct-demo URLs still resolve to the same versioned R2 preview',()=>{
  const themes=[{slug:'iasf',version:'2.6.19'}];
  assert.equal(resolveDemoAlias('/themes/iasf/presets/iasf/demo/',themes),
    '/theme-packages/iasf/2.6.19/preview/');
  assert.equal(resolveDemoAlias('/themes/iasf/presets/iasf/demo/shop',themes),
    '/theme-packages/iasf/2.6.19/preview/shop');
});
