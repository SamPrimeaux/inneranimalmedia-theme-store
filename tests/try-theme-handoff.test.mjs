import test from 'node:test';
import assert from 'node:assert/strict';
import { themeInstallerUrl } from '../src/marketplace-redirect.mjs';

test('preserves package and version in the configured shared CMS handoff', () => {
  const href = themeInstallerUrl('https://cms.example.test/sites', 'iam.theme.revise', '0.1.2');
  const target = new URL(href);
  assert.equal(target.origin, 'https://cms.example.test');
  assert.equal(target.pathname, '/sites');
  assert.deepEqual(Object.fromEntries(target.searchParams), {
    theme_sku: 'iam.theme.revise', theme_version: '0.1.2', action: 'try',
  });
});

test('rejects invalid package input and invalid installer configuration', () => {
  const cms = 'https://cms.example.test/sites';
  assert.equal(themeInstallerUrl(cms, 'iam.theme.revise&site_id=other', '0.1.2'), null);
  assert.equal(themeInstallerUrl(cms, 'iam.theme.revise', 'latest'), null);
  for (const url of [undefined, '//cms.example.test', 'http://cms.example.test', cms+'?site_id=x', cms+'#fragment', 'https://user@cms.example.test']) {
    assert.equal(themeInstallerUrl(url, 'iam.theme.revise', '0.1.2'), null);
  }
});
