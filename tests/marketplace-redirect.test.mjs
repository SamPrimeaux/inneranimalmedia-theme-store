import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {marketplaceRedirect, EMBEDS_COLLECTION_URL} from '../src/marketplace-redirect.mjs';

const readJson=(name)=>JSON.parse(readFileSync(new URL('../src/'+name,import.meta.url),'utf8'));
test('legacy Theme Store app embeds paths point to the standalone App Store collection',()=>{
  assert.equal(marketplaceRedirect('/app-embeds'),EMBEDS_COLLECTION_URL);
  assert.equal(marketplaceRedirect('/app-embeds/'),EMBEDS_COLLECTION_URL);
  for(const path of ['/', '/themes/', '/themes/cypress/', '/apps/', '/app-embeds/example','/admin/store'])
    assert.equal(marketplaceRedirect(path),null);
});
test('editable global header and footer defaults share the external marketplace destination',()=>{
  const header=readJson('header.default.json');
  const footer=readJson('footer.default.json');
  const nav=header.navigation.items.find(item=>item.key==='app-embeds');
  const link=footer.blocks.find(block=>block.key==='resources-app-embeds');
  assert.equal(nav.href,EMBEDS_COLLECTION_URL);
  assert.equal(nav.type,'external');
  assert.equal(link.settings.href,EMBEDS_COLLECTION_URL);
});
test('Cloudflare Worker handles the old route before its SPA asset fallback',()=>{
  const cfg=readJson('../wrangler.jsonc');
  assert.ok(cfg.assets.run_worker_first.includes('/app-embeds'));
  assert.ok(cfg.assets.run_worker_first.includes('/app-embeds/*'));
});

test('retired Theme Store studio is not an embedded CMS entry point',()=>{
  const worker=readFileSync(new URL('../src/worker.ts',import.meta.url),'utf8');
  const app=readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8');
  const account=readFileSync(new URL('../src/AccountMenu.tsx',import.meta.url),'utf8');
  assert.match(worker,/url\.pathname === '\/studio' \|\| url\.pathname\.startsWith\('\/studio\/'\)/);
  assert.doesNotMatch(worker,/resolveOwnedThemeStoreEditor|legacyInstall|\/api\/admin\/cms\/sites/);
  assert.doesNotMatch(app,/StoreStudio|studioRoute/);
  assert.doesNotMatch(account,/account-manage|\/studio|state\.editor/);
});
