import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Try Theme stays in Theme Store, preserving SKU/release without binding a live site', () => {
  const source = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('const tryTheme = (theme:ThemeRecord) => {');
  const end = source.indexOf('  function navigate(next:View)', start);
  assert.ok(start > 0 && end > start);
  const handler = source.slice(start, end);
  assert.ok(handler.includes("new URL('/studio', window.location.origin)"));
  assert.ok(handler.includes("searchParams.set('panel', 'install')"));
  assert.ok(handler.includes("searchParams.set('theme_sku', theme.sku)"));
  assert.ok(handler.includes("searchParams.set('theme_version', theme.version)"));
  assert.ok(handler.includes('window.location.assign(destination.pathname + destination.search)'));
  assert.ok(!handler.includes("searchParams.set('site_id'"));
  assert.ok(!handler.includes('preferredSiteId.current'));
  assert.ok(source.slice(end, end + 550).includes('preferredSiteId.current'));
});

test('same-domain installer hosts canonical AgentSam site selection without new CMS writes', () => {
  const source = readFileSync(new URL('../src/StoreStudio.tsx', import.meta.url), 'utf8');
  assert.ok(source.includes("new URL('/sites','https://agentsam.inneranimalmedia.com')"));
  assert.ok(source.includes("target.searchParams.set('action','try')"));
  assert.ok(source.includes("installing ? <div className=\"store-studio-body\""));
  assert.ok(!source.includes("target.searchParams.set('site_id'"));
  assert.ok(source.includes('iframe'));
});
