import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Theme Store release publication has no SDK product-registry dependency',()=>{
 const publisher=read('scripts/publish-install-projects.mjs');
 assert.match(publisher,/theme-store\/install-index\/index\.json/);
 assert.match(publisher,/Theme Store install index is authoritative/);
 assert.doesNotMatch(publisher,/register-product-releases|agentsam_products|agentsam_product_releases|theme_registry_sync_failed|spawnSync/);
});

test('Theme Store documentation makes catalog and install index the only theme inventory authority',()=>{
 const ownership=read('docs/RELEASE_REGISTRY_SYNC.md');
 assert.match(ownership,/sole authority for website-theme availability and distribution/);
 assert.match(ownership,/\/api\/catalog/);
 assert.match(ownership,/\/api\/install-index/);
 assert.doesNotMatch(ownership,/agentsam_products|agentsam_product_releases/);
});
