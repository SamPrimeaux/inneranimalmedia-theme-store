import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Try Theme preserves SKU/release for the authenticated Sites app without binding a live site', () => {
  const source = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('const tryTheme = (theme:ThemeRecord) => {');
  const end = source.indexOf('  function navigate(next:View)', start);
  assert.ok(start > 0 && end > start);
  const handler = source.slice(start, end);
  assert.match(handler, /theme_sku/);
  assert.match(handler, /theme_version/);
  assert.match(handler, /action', 'try'/);
  assert.match(handler, /window\.location\.assign\(destination\.href\)/);
  assert.doesNotMatch(handler, /searchParams\.set\('site_id'/);
  assert.doesNotMatch(handler, /preferredSiteId\.current/);
  // Browsing returns to the selected site context without making the Try
  // installer inherit the site as a write target.
  assert.match(source.slice(end, end+550), /preferredSiteId\.current/);
});
