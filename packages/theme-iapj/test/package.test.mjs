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
const project=JSON.parse(fs.readFileSync(fromRoot('install-project.json'),'utf8'));

test('IAPJ ships a real standalone editable project owned by the Theme Store',()=>{
 assert.equal(createTheme().slug,'iapj');
 assert.equal(createTheme().displayName,'InnerAnimal Plain Jane');
 assert.equal(createTheme().installable,true);
 assert.equal(pkg.version,'0.3.0');
 assert.equal(pkg.name,'@inneranimalmedia/theme-iapj');
 assert.equal(pkg.agentsam.slug,'iapj');
 assert.equal(project.id,'theme_iapj');
 assert.equal(project.sourceThemeId,'iapj');
 assert.equal(project.sourcePackage,'@inneranimalmedia/theme-iapj');
 const classic=JSON.parse(fs.readFileSync(path.resolve(root,'../theme-plain-jane/package.json'),'utf8'));
 const classicProject=JSON.parse(fs.readFileSync(path.resolve(root,'../theme-plain-jane/install-project.json'),'utf8'));
 assert.equal(classic.agentsam.slug,'plain-jane');
 assert.equal(classicProject.id,'theme_plain-jane');
 assert.equal(classicProject.sourcePackageVersion,classic.version);
 assert.equal(classicProject.sourceReleaseSha256,classic.agentsam.store.release.sha256);
 assert.equal(classicProject.pages.length,9);
 assert.notEqual(classicProject.id,project.id);
 assert.equal(pkg.agentsam.sourceRepository,'SamPrimeaux/inneranimalmedia-theme-store');
 assert.equal(pkg.agentsam.sourceSeed,'SamPrimeaux/iapj');
 assert.ok(['preview','published'].includes(pkg.agentsam.store.release.status));
 assert.equal(provenance.publishApproved,true);
 if (pkg.agentsam.store.release.status === 'published') {
   assert.match(pkg.agentsam.store.release.sha256,/^[0-9a-f]{64}$/);
   assert.equal(pkg.agentsam.store.release.storageKey,
     `releases/iapj/${pkg.version}/${pkg.agentsam.store.release.sha256}.zip`);
   assert.equal(project.sourceReleaseSha256,pkg.agentsam.store.release.sha256);
 } else {
   assert.equal(pkg.agentsam.store.release.storageKey,null);
 }
 assert.match(provenance.commit,/^[0-9a-f]{40}$/);
 assert.equal(provenance.upstream,'https://github.com/SamPrimeaux/iapj');
 assert.ok(fs.existsSync(fromRoot('source/src/components/BrandLogo.tsx')));
 assert.ok(fs.existsSync(fromRoot('source/src/components/FooterBackdrop3D.tsx')));
 assert.ok(fs.existsSync(fromRoot('source/src/content/site.manifest.json')));
 assert.ok(!fs.existsSync(fromRoot('source/seed/plain-jane-journal.sql')),'legacy CMS SQL must not be copied');
 assert.ok(fs.existsSync(fromRoot('install-project.json')),'the authored editable project must accompany a stock theme');
});

test('IAPJ source-derived CMS manifest covers editorial pages, categories and all authored article routes',()=>{
 assert.equal(manifest.schema,'agentsam.cms-source-manifest.v1');
 assert.equal(manifest.theme,'iapj');
 assert.equal(manifest.sourceTheme,'iapj');
 assert.equal(manifest.editorProject,'install-project.json');
 assert.equal(manifest.editorScope,'account');
 assert.equal(manifest.sourceInventoryOnly,true);
 assert.ok(manifest.pages.length>=25,'IAPJ article/markdown corpus must be exported');
 assert.ok(manifest.definitions.length>=10);
 const routes=manifest.pages.map(page=>page.path);
 assert.equal(new Set(routes).size,routes.length);
 for(const route of ['', 'blog','about','work','photography','search',
    'blog/category/ai','blog/category/runtime','blog/category/ui-ux',
    'blog/structured-decisions','blog/infrastructure-cookbooks','blog/ux-guide']){
   assert.ok(routes.includes(route),'missing IAPJ route: '+route);
 }
 for(const [key,media] of Object.entries(manifest.mediaCatalog)){
   if(!media.url)continue;
   assert.ok(media.url.startsWith('/themes/iapj/demo/assets/'),key+' source media leaked into manifest');
   assert.ok(fs.existsSync(fromRoot('site/assets/'+path.basename(media.url))),key+' has no compiled media');
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

test('every authored IAPJ route is a genuine editable CMS page, not a placeholder',()=>{
 assert.equal(project.schema,'agentsam.theme-project.v1');
 assert.equal(project.id,'theme_iapj');
 assert.equal(project.sourcePackage,pkg.name);
 assert.equal(project.sourcePackageVersion,pkg.version);
 assert.equal(project.sourcePreviewUrl,'https://themes.inneranimalmedia.com/iapj/');
 const immutableAssetBase=`https://themes.inneranimalmedia.com/theme-packages/iapj/${pkg.version}/preview/`;
 assert.ok(project.pages.every(page=>page.assetBase===immutableAssetBase),
   'CMS editor assets must use the immutable, version-pinned package route');
 assert.match(project.sourceReleaseSha256,/^[0-9a-f]{64}$/);
 assert.equal(project.sourceManifestPageCount,31);
 assert.equal(project.pages.length,31);
 assert.deepEqual(project.sourceRoutesNotRendered,[]);
 assert.deepEqual(project.sourceAssetErrors,[]);
 const routes=new Set(manifest.pages.map(p=>p.path));
 const slugs=new Set();
 let fieldCount=0;
 for(const page of project.pages){
   assert.ok(routes.has(page.sourceRoute),'original authored route missing from editor: '+page.slug);
   assert.ok(!slugs.has(page.slug),'duplicate editable page '+page.slug);
   slugs.add(page.slug);
   assert.ok(!/<script\b/i.test(page.template),'React hydration would overwrite customer edits: '+page.slug);
   assert.ok(page.template.includes('<!--theme-section:'),'source content was not extracted: '+page.slug);
   const editorMarkup=page.template+' '+page.sections.map(section=>section.html).join(' ');
   assert.ok(editorMarkup.includes(immutableAssetBase+'assets/index-'),
     'the embedded editor preview must load its stylesheet from the immutable release: '+page.slug);
   assert.ok(!editorMarkup.includes('https://themes.inneranimalmedia.com/iapj/assets/'),
     'the mutable public alias must not supply cross-origin editor assets: '+page.slug);
   assert.equal(page.route,'/'+(page.sourceRoute?page.sourceRoute+'/':''),'authored routes must resolve within the installed site');
   assert.ok(!/<a\b[^>]*href="https:\/\/themes\.inneranimalmedia\.com\/iapj\/(?!assets\/)/.test(page.template+' '+page.sections.map(s=>s.html).join(' ')),'installed navigation must not bounce back to provider demo: '+page.slug);
   assert.ok(page.sections.length>=3,'missing real header/body/footer: '+page.slug);
   assert.ok(page.sections.some(s=>s.zone==='HEADER'),'missing header: '+page.slug);
   assert.ok(page.sections.some(s=>s.zone==='BODY'),'missing body: '+page.slug);
   assert.ok(page.sections.some(s=>s.zone==='FOOTER'),'missing footer: '+page.slug);
   assert.ok(page.sections.some(s=>s.schema.fields.length>0),'no editable source fields: '+page.slug);
   for(const section of page.sections){
     assert.ok(page.template.includes('<!--theme-section:'+section.key+'-->'),'unbound source section: '+page.slug+' '+section.key);
     assert.ok(section.html.length>50,'empty source section: '+page.slug+' '+section.key);
     fieldCount+=(section.schema.fields||[]).length;
   }
 }
 assert.ok(fieldCount>1000,'IAPJ section text/images/links were not extracted');
 assert.ok(fs.statSync(fromRoot('install-project.json')).size < 8*1024*1024,'SDK save contract limit exceeded');
});
