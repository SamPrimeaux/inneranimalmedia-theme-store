import test from 'node:test';
import assert from 'node:assert/strict';
import { themeInstallerUrl } from '../src/marketplace-redirect.mjs';

test('preserves package and version in the configured shared CMS handoff', () => {
  const href = themeInstallerUrl('iam.theme.revise', '0.1.2');
  const target = new URL(href);
  assert.equal(target.origin, 'https://agentsam.inneranimalmedia.com');
  assert.equal(target.pathname, '/sites');
  assert.deepEqual(Object.fromEntries(target.searchParams), {
    theme_sku: 'iam.theme.revise', theme_version: '0.1.2', action: 'try',
  });
});

test('rejects invalid package input', () => {
  assert.equal(themeInstallerUrl('iam.theme.revise&site_id=other', '0.1.2'), null);
  assert.equal(themeInstallerUrl('iam.theme.revise', 'latest'), null);
});
