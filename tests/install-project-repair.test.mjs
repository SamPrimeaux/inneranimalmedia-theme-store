import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SYSTEM_PAGE_BASELINES,completeInstallProject} from '../src/install-project-repair.mjs';

const packages=fileURLToPath(new URL('../packages/',import.meta.url));

test('all published install projects acquire editable, source-aware system baselines',async()=>{
  const directories=(await readdir(packages,{withFileTypes:true})).filter(dir=>dir.isDirectory()&&dir.name.startsWith('theme-'));
  let checked=0;
  for(const dir of directories) {
    let original;
    try{original=JSON.parse(await readFile(join(packages,dir.name,'install-project.json'),'utf8'));}
    catch(error){if(error?.code==='ENOENT')continue;throw error;}
    checked++;
    const source=structuredClone(original);
    const {project,added}=completeInstallProject(source);
    assert.deepEqual(source,original,dir.name+' input was mutated');
    assert.deepEqual(project.pages.slice(0,original.pages.length),original.pages,dir.name+' authored pages were rewritten');
    assert.equal(new Set(project.pages.map(p=>p.slug)).size,project.pages.length,dir.name+' duplicate routes');
    assert.ok(project.pages.length<=80&&Buffer.byteLength(JSON.stringify(project))<=8*1024*1024);
    for(const baseline of SYSTEM_PAGE_BASELINES) {
      const page=project.pages.find(p=>p.slug===baseline.slug || (baseline.slug==='404' && p.slug==='not-found'));
      assert.ok(page,dir.name+' missing '+baseline.slug);
      if(!added.includes(baseline.slug))continue;
      assert.equal(page.sourceOrigin,'platform-system-baseline');
      assert.equal(page.isSystemFallback,true);
      assert.equal(page.requiresRuntimeAdapter,baseline.requiresAdapter||undefined);
      assert.ok(page.template.includes('<!--theme-section:'));
      assert.ok(page.template.includes('data-iam-system-baseline'));
      assert.ok(!/<script(?:\s|>)/i.test(page.template));
      assert.ok(page.sections.some(section=>section.key.startsWith('system_')&&section.schema.fields.length>=4));
      assert.ok(page.sections.every(section=>page.template.includes('<!--theme-section:'+section.key+'-->')));
      const home=original.pages.find(p=>p.slug==='home')||original.pages[0];
      const originalHeader=home.sections.filter(s=>s.zone==='HEADER'||s.schema?.zone==='HEADER');
      const pageHeader=page.sections.filter(s=>s.zone==='HEADER'||s.schema?.zone==='HEADER');
      assert.deepEqual(pageHeader,originalHeader,dir.name+' lost source header');
    }
    assert.deepEqual(completeInstallProject(project).added,[],dir.name+' completion is not idempotent');
    assert.deepEqual(completeInstallProject(project).project,project,dir.name+' second completion modified project');
  }
  assert.equal(checked,11,'expected all eleven source-verified install projects');
});

test('author-defined 404 pages and alternate not-found routes are not replaced',()=>{
  const original={schema:'agentsam.theme-project.v1',id:'theme_fixture',name:'Fixture',pages:[
    {slug:'home',title:'Home',template:'<html><head><style>.source{color:red}</style></head><body><!--theme-section:intro--></body></html>',sections:[
      {key:'intro',zone:'BODY',html:'<div></div>',content:{},schema:{fields:[{key:'text'}]}}
    ]},
    {slug:'not-found',title:'Original 404',template:'<html>author page</html>',sections:[]}
  ]};
  const {project,added}=completeInstallProject(original);
  assert.ok(!added.includes('404'));
  assert.deepEqual(project.pages[1],original.pages[1]);
  assert.ok(project.pages.find(page=>page.slug==='password'));
  assert.ok(project.pages.find(page=>page.slug==='password').template.includes('.source{color:red}'));
});

test('invalid source projects are refused instead of masked by a system baseline',()=>{
  assert.throws(()=>completeInstallProject({schema:'agentsam.theme-project.v1',pages:[]}),/invalid_install_project/);
});
