import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../packages/',import.meta.url));
const directories=(await readdir(root,{withFileTypes:true})).filter(item=>item.isDirectory());
const entries=[];
for(const dir of directories){
 try{
  const pkg=JSON.parse(await readFile(join(root,dir.name,'package.json'),'utf8'));
  if(pkg.agentsam?.store?.release?.status!=='published')continue;
  entries.push({dir:dir.name,pkg});
 }catch(error){if(error?.code!=='ENOENT')throw error;}
}

test('every published, installable theme has a real immutable-source editable CMS project',async()=>{
 assert.ok(entries.length>0,'expected at least one published theme release');
 const names=new Set();
 let totalPages=0;
 for(const {dir,pkg} of entries){
  const meta=pkg.agentsam;
  const slug=meta.slug,version=pkg.version;
  assert.equal(meta.installable,true,slug+' should be installed from verified source');
  assert.equal(meta.store.release.status,'published');
  assert.match(meta.store.release.sha256,/^[0-9a-f]{64}$/);
  assert.equal(meta.store.release.storageKey,'releases/'+slug+'/'+version+'/'+meta.store.release.sha256+'.zip');
  assert.ok(!names.has(slug),'duplicate package identity');names.add(slug);
  const project=JSON.parse(await readFile(join(root,dir,'install-project.json'),'utf8'));
  assert.equal(project.schema,'agentsam.theme-project.v1');
  assert.equal(project.id,'theme_'+slug);
  assert.equal(project.sourceThemeId,slug);
  assert.equal(project.sourcePackage,'@inneranimalmedia/theme-'+slug);
  assert.equal(project.sourcePackageVersion,version);
  assert.equal(project.sourceReleaseSha256,meta.store.release.sha256);
  assert.equal(project.sourcePreviewUrl,'https://themes.inneranimalmedia.com/theme-packages/'+slug+'/'+version+'/preview/');
  assert.equal(project.sourceAssetErrors?.length,0,slug+' has missing source media');
  assert.ok(project.pages.length>0&&project.pages.length<=80);
  assert.equal(new Set(project.pages.map(p=>p.slug)).size,project.pages.length,slug+' has duplicate pages');
  for(const page of project.pages){
   assert.match(page.sourceRoute,/^\//);
   assert.ok(page.template.includes('<!--theme-section:'),slug+':'+page.slug+' not a real editable renderer');
   assert.ok(!/<script(?:\s|>)/i.test(page.template),slug+':'+page.slug+' executes source app scripts');
   assert.ok(page.sections.length>0);
   assert.ok(page.sections.some(s=>(s.schema?.fields?.length||0)||(s.schema?.blocks||[]).some(b=>b.fields?.length)),slug+':'+page.slug+' has no editor fields');
  }
  const unresolved=(project.sourceRoutesNotRendered||[]).filter(item=>{
   const sourceRoute=String(item).split(':')[0].replace(/^\/+|\/+$/g,'');
   return !project.pages.some(page=>page.sourceOrigin==='authored-cms-manifest-fallback'&&
     String(page.sourceRoute||'').replace(/^\/+|\/+$/g,'')===sourceRoute);
  });
  assert.deepEqual(unresolved,[],slug+' has unconverted source routes');
  totalPages+=project.pages.length;
 }
 assert.ok(totalPages>=entries.length,'each installable release must contain a real editable page');
});

test('recovered pages disclose their real authored source and do not masquerade as rendered routes',async()=>{
 for(const {dir} of entries){
  const project=JSON.parse(await readFile(join(root,dir,'install-project.json'),'utf8'));
  for(const page of project.pages){
   if(page.sourceOrigin==='authored-cms-manifest-fallback'){
    assert.equal(page.sourceManifestSchema,'agentsam.cms-source-manifest.v1');
    assert.ok(page.sections.some(s=>s.schema?.fields?.length),'empty authored fallback');
   }
   if(page.sourceOrigin==='authored-product-card-starter'){
    assert.ok(page.template.includes('cms-product-source-starter'));
    assert.ok(page.sections.some(s=>s.html.includes('theme-packages/')),'catalog media path missing');
   }
  }
 }
});
