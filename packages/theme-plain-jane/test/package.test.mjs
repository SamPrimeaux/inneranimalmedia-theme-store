import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createTheme} from '../src/index.js';
import {materializePrebuild,resolvePrebuildRoot} from '../src/node.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fromRoot=p=>path.join(root,p);
const pkg=JSON.parse(fs.readFileSync(fromRoot('package.json'),'utf8'));
const provenance=JSON.parse(fs.readFileSync(fromRoot('provenance.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(fromRoot('site/iapj-cms-manifest.json'),'utf8'));

test('IAPJ replaces the old Plain Jane source without publishing or claiming CMS installation',()=>{
 assert.equal(createTheme().slug,'plain-jane');
 assert.equal(createTheme().displayName,'InnerAnimal Plain Jane');
 assert.equal(createTheme().installable,false);
 assert.equal(pkg.version,'0.2.0');
 assert.equal(pkg.agentsam.sourceRepository,'SamPrimeaux/iapj');
 assert.equal(pkg.agentsam.store.release.status,'preview');
 assert.equal(pkg.agentsam.store.release.storageKey,null);
 assert.equal(provenance.publishApproved,false);
 assert.match(provenance.commit,/^[0-9a-f]{40}$/);
 assert.equal(provenance.upstream,'https://github.com/SamPrimeaux/iapj');
 assert.ok(fs.existsSync(fromRoot('source/src/components/BrandLogo.tsx')));
 assert.ok(fs.existsSync(fromRoot('source/src/components/FooterBackdrop3D.tsx')));
 assert.ok(fs.existsSync(fromRoot('source/src/content/site.manifest.json')));
 assert.ok(!fs.existsSync(fromRoot('source/seed/plain-jane-journal.sql')),'legacy CMS SQL must not be copied');
 assert.ok(!fs.existsSync(fromRoot('install-project.json')),'legacy beige CMS install project must not be shipped');
});

test('IAPJ source-derived CMS manifest covers editorial pages, categories and all authored article routes',()=>{
 assert.equal(manifest.schema,'agentsam.cms-source-manifest.v1');
 assert.equal(manifest.theme,'plain-jane');
 assert.equal(manifest.sourceTheme,'iapj');
 assert.equal(manifest.preview_only,true);
 assert.equal(manifest.requiresRuntimeAdapter,true);
 assert.ok(manifest.pages.length>=25,'IAPJ article/markdown corpus must be exported');
 assert.ok(manifest.definitions.length>=10);
 const routes=manifest.pages.map(page=>page.path);
 assert.equal(new Set(routes).size,routes.length);
 for(const route of ['', 'blog','about','work','photography','search',
    'blog/category/ai','blog/category/runtime','blog/category/ui-ux',
    'blog/structured-decisions','blog/infrastructure-cookbooks','blog/ux-guide']){
   assert.ok(routes.includes(route),'missing IAPJ route: '+route);
 }
 for(const page of manifest.pages){
   assert.ok(page.sections.length>=3,page.slug+' must not be an empty editorial scaffold');
   assert.ok(page.sections.every(sec=>manifest.definitions.includes(sec.definition_key)));
 }
 const old=fs.readFileSync(fromRoot('site/index.html'),'utf8');
 assert.match(old,/assets\/index-/);
 assert.ok(!fs.existsSync(fromRoot('site/images/cover-slow-travel.svg')),'old beige journal artwork leaked into IAPJ');
});

test('IAPJ materializes a self-contained multi-route preview at a nested path',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'iapj-preflight-'));
 try{
   const target=path.join(directory,'theme');
   const result=materializePrebuild(target,{basePath:'/test/customer/blog'});
   assert.equal(result.pages,manifest.pages.length);
   assert.equal(result.basePath,'/test/customer/blog/');
   assert.match(fs.readFileSync(path.join(target,'index.html'),'utf8'),/\/test\/customer\/blog\/assets\//);
   for(const route of ['about','work','photography','blog/structured-decisions','blog/category/ui-ux','blog/ux-guide']){
     assert.ok(fs.existsSync(path.join(target,route,'index.html')),'deep link missing '+route);
   }
   assert.throws(()=>materializePrebuild(target),/already exists/);
   assert.throws(()=>materializePrebuild(null),/target/);
   assert.ok(fs.existsSync(path.join(resolvePrebuildRoot(),'iapj-cms-manifest.json')));
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
