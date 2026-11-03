import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveSite } from '../src/site.mjs';

const defaults = JSON.parse(await readFile(new URL('../src/site.default.json', import.meta.url), 'utf8'));

test('no override returns the defaults', () => {
  assert.deepEqual(resolveSite(defaults, undefined), defaults);
  assert.deepEqual(resolveSite(defaults, null), defaults);
  assert.deepEqual(resolveSite(defaults, 'garbage'), defaults);
});

test('valid edits apply, everything else keeps its default', () => {
  const site = resolveSite(defaults, { hero: { headlineEm: 'a new start.' }, tokens: { accent: '#112233' }, nav: { sitesHref: '/sites' } });
  assert.equal(site.hero.headlineEm, 'a new start.');
  assert.equal(site.hero.headlineLead, defaults.hero.headlineLead);
  assert.equal(site.tokens.accent, '#112233');
  assert.equal(site.nav.sitesHref, '/sites');
});

test('invalid or hostile values fall back and unknown keys are dropped', () => {
  const site = resolveSite(defaults, {
    tokens: { accent: 'red;} body{display:none', ink: 'url(javascript:x)' },
    nav: { sitesHref: 'javascript:alert(1)' },
    hero: { body: 'x'.repeat(5000), points: ['one', 7, ''] },
    injected: { evil: true },
  });
  assert.equal(site.tokens.accent, defaults.tokens.accent);
  assert.equal(site.tokens.ink, defaults.tokens.ink);
  assert.equal(site.nav.sitesHref, defaults.nav.sitesHref);
  assert.equal(site.hero.body, defaults.hero.body);
  assert.deepEqual(site.hero.points, ['one', defaults.hero.points[1], defaults.hero.points[2]]);
  assert.equal('injected' in site, false);
  assert.equal(site.schema, defaults.schema);
});
