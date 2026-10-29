import assert from 'node:assert/strict';
import { test } from 'node:test';
import { npmChildEnvironment } from '../scripts/npm-child-environment.mjs';

test('nested npm does not inherit a CLI-level allow-scripts override', () => {
  const parent = {
    npm_config_allow_scripts: 'esbuild,workerd',
    NPM_CONFIG_ALLOW_SCRIPTS: 'esbuild',
    'npm_config_allow-scripts': 'fsevents',
    HOME: '/home/example',
    PATH: '/usr/local/bin',
    npm_config_registry: 'https://registry.npmjs.org/'
  };
  const child = npmChildEnvironment(parent);
  for (const key of Object.keys(child)) {
    assert.equal(/^npm_config_allow[-_]scripts$/i.test(key), false);
  }
  assert.equal(child.HOME, parent.HOME);
  assert.equal(child.PATH, parent.PATH);
  assert.equal(child.npm_config_registry, parent.npm_config_registry);
  assert.equal(parent.npm_config_allow_scripts, 'esbuild,workerd');
});

test('does not modify other npm security or lifecycle settings', () => {
  const parent = { npm_config_ignore_scripts: 'true', npm_config_audit: 'false' };
  assert.deepEqual(npmChildEnvironment(parent), parent);
});
