import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFooter,defaultFooter,footerFromCmsRows } from '../src/footer.mjs';

test('footer defaults are real CMS section/block data with the GLB and signature',()=>{
  assert.equal(defaultFooter.section.type,'global-footer');
  assert.equal(defaultFooter.section.settings.background,'#050505');
  assert.match(defaultFooter.section.settings.glb_url,/inneranimalmediafooterglb\.glb$/);
  assert.ok(defaultFooter.blocks.length>=20);
  const dev=defaultFooter.blocks.find(x=>x.key==='signature');
  assert.match(dev.settings.logo_url,/238de9d1-a470-4fe5-5424-9182f4bc0500/);
  assert.ok(defaultFooter.blocks.some(x=>x.key==='product-agentsam'&&x.settings.icon_url));
  for (const icon of ['facebook','instagram','youtube']) {
    assert.ok(defaultFooter.blocks.some(x=>x.type==='social-link'&&x.settings.icon===icon&&x.settings.href===''));
  }
});
test('edited CMS block fields, reordering and extra links survive publication',()=>{
  const edited=structuredClone(defaultFooter);
  edited.blocks.find(b=>b.key==='company-about').settings.href='https://example.com/company';
  edited.blocks.find(b=>b.key==='company-about').order=99;
  edited.blocks.push({key:'company-new',type:'link',parent:'company',order:10,settings:{label:'New',href:'https://example.com/new'}});
  const saved=normalizeFooter(edited);
  assert.equal(saved.blocks.find(x=>x.key==='company-new').settings.label,'New');
  assert.equal(saved.blocks.find(x=>x.key==='company-about').settings.href,'https://example.com/company');
  assert.equal(saved.blocks.find(x=>x.key==='company-about').order,99);
});
test('invalid links, markup injection and unknown blocks are not published',()=>{
  const evil=structuredClone(defaultFooter);
  evil.section.settings.background='url(javascript:evil)';
  evil.section.settings.glb_url='javascript:alert(1)';
  evil.blocks.find(b=>b.key==='product-agentsam').settings.href='javascript:alert(1)';
  evil.blocks.find(b=>b.key==='contact').settings.heading='<img src=x onerror=alert(1)>';
  evil.blocks.push({key:'evil',type:'script',parent:null,order:2,settings:{script:'evil'}});
  const safe=normalizeFooter(evil);
  assert.equal(safe.section.settings.background,'#050505');
  assert.match(safe.section.settings.glb_url,/^https:/);
  assert.equal(safe.blocks.find(b=>b.key==='product-agentsam').settings.href,'');
  assert.ok(!safe.blocks.find(b=>b.key==='evil'));
});
test('CMS D1 rows project to the published footer structure',()=>{
  const rows=defaultFooter.blocks.map(b=>({block_key:b.key,block_type:b.type,parent_block_key:b.parent,sort_order:b.order,settings_json:JSON.stringify(b.settings)}));
  const projected=footerFromCmsRows({section_type:'global-footer',section_data:JSON.stringify(defaultFooter.section.settings)},rows);
  assert.equal(projected.blocks.length,rows.length);
  assert.deepEqual(projected,defaultFooter);
});
