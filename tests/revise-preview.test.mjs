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

test('Revise installs the original global chrome, hero buttons and commerce templates', () => {
  const project = require('../packages/theme-revise/install-project.json');
  const bySlug = Object.fromEntries(project.pages.map(page => [page.slug, page]));
  assert.equal(bySlug.product.sourceRoute, '/products/');
  assert.equal(bySlug.collection.sourceRoute, '/ideas/');
  assert.equal(bySlug.product.template_key, 'product');
  assert.equal(bySlug.collection.template_key, 'collection');
  for (const page of project.pages) {
    assert.deepEqual(page.sections.slice(0, 2).map(section => section.globalKey), ['site-announcement', 'site-header']);
    assert.equal(page.sections.at(-1).globalKey, 'site-footer');
    assert.ok(page.sections.filter(section => section.zone === 'BODY').length > 1);
    for (const section of page.sections) {
      assert.ok(page.template.includes('<!--theme-section:' + section.key + '-->'));
      for (const block of section.content.__editor.blocks) {
        assert.ok(section.schema.blocks.some(candidate => candidate.key === block.templateKey));
        assert.ok(section.html.includes('<!--theme-block:' + block.templateKey + '-->'));
      }
    }
  }
  const hero = bySlug.home.sections.find(section => section.sourceKind === 'revise/sticky-curtain');
  assert.deepEqual(hero.schema.blocks.map(block => block.defaults.label), ['Preview the drop', 'See campaign directions']);
  assert.deepEqual(hero.schema.blocks.map(block => block.fields.map(field => field.key)), [['label', 'href'], ['label', 'href']]);
  assert.ok(bySlug.collection.sections.every(section => !section.html.includes('[object Object]')));
});
