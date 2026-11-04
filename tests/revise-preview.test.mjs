import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { materializePrebuild } from '../packages/theme-revise/src/node.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const version = require('../packages/theme-revise/package.json').version;

test('Revise is a portable 5-route, source-backed presentation, not another SDK/editor', () => {
  const tmp = mkdtempSync(join(tmpdir(),'revise-test-'));
  const prefix = '/theme-packages/revise/' + version + '/preview/';
  try {
    const root = join(tmp,'site');
    const receipt = materializePrebuild(root,{basePath:prefix});
    assert.equal(receipt.basePath,prefix);
    const html = readFileSync(join(root,'index.html'),'utf8');
    assert.ok(html.includes(prefix+'assets/'));
    assert.equal(existsSync(join(root,'admin')),false,'Theme release must not bundle admin CMS UI');
    assert.equal(existsSync(join(root,'demos')),false,'Theme release must not bundle a separate demo editor');
    assert.equal(existsSync(join(root,'library')),false,'Theme release must not rebundle unrelated theme evidence');
    assert.equal(existsSync(join(root,'visual-01.svg')),true);
    const jsfiles = readdirSync(join(root,'assets')).filter(x=>x.endsWith('.js'));
    const script = jsfiles.map(x=>readFileSync(join(root,'assets',x),'utf8')).join('\n');
    for(const label of ['Earned Hours','Products','Project Stories','Campaigns','Good ideas']) {
      assert.ok(script.includes(label),label+' should be available in the actual site package');
    }
    for(const route of ['/products/','/stories/','/campaigns/','/ideas/']) {
      assert.ok(script.includes(route), route + ' route is missing');
    }
    assert.ok(script.includes(prefix),'Vite base must be embedded in route/navigation handling');
    assert.ok(!script.includes('cmsAdminNavigate'),'Storefront preview is not SDK Theme Studio');
    const port = materializePrebuild(join(tmp,'root'),{basePath:'/'});
    assert.equal(port.basePath,'/');
    assert.equal(readFileSync(join(tmp,'root','index.html'),'utf8').includes(prefix),false);
  } finally {rmSync(tmp,{recursive:true,force:true});}
});
