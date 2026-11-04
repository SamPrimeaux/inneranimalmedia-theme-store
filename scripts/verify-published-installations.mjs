#!/usr/bin/env node
/** Verify the *deployed* package-to-private-draft installation contract.
 * Reusable for every future website package without editing this script.
 * This validates public release assets; authenticated persistence is covered by
 * the canonical CMS installation integration tests.
 *
 * node scripts/verify-published-installations.mjs --min 11
 */
import { createHash } from 'node:crypto';
const origin = process.env.THEME_STORE_ORIGIN || 'https://themes.inneranimalmedia.com';
const minIndex = process.argv.indexOf('--min');
const minimum = minIndex >= 0 ? Number(process.argv[minIndex + 1]) : 1;
if(!Number.isSafeInteger(minimum)||minimum<1)throw Error('--min must be a positive integer');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function json(path, requireOk=true){
 const r=await fetch(origin+path,{headers:{accept:'application/json','cache-control':'no-cache'},signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error(path+' failed HTTP '+r.status);
 const value=await r.json();
 if(requireOk&&value?.ok!==true)throw Error(path+' invalid response');
 return value;
}
const [catalog,index]=await Promise.all([json('/api/catalog?verify='+Date.now()),json('/api/install-index?verify='+Date.now())]);
if(!Array.isArray(catalog.products)||!Array.isArray(index.packages)||index.packages.length<minimum)
 throw Error('incomplete_release_index');
const rows=[];
for (const item of index.packages) {
 const product=catalog.products.find(p=>p.slug===item.slug&&p.version===item.version);
 const result={slug:item.slug,version:item.version,published:false,zip:false,project:false,pages:item.page_count};
 try {
  if(!product||product.release?.status!=='published'||product.downloadReady!==true||
     product.release.sha256!==item.sha256)throw Error('release_not_live');
  result.published=true;
  const [manifest,projectRes]=await Promise.all([
    json('/api/themes/'+item.slug+'/'+item.version+'/manifest.json',false),
    fetch(origin+item.project_url,{signal:AbortSignal.timeout(20000)})]);
  if(manifest.sha256!==item.sha256||manifest.slug!==item.slug||manifest.version!==item.version)
     throw Error('zip_manifest_mismatch');
  result.zip=true;
  if(!projectRes.ok)throw Error('project_http_'+projectRes.status);
  const bytes=Buffer.from(await projectRes.arrayBuffer());
  const project=JSON.parse(bytes.toString());
  if(sha(bytes)!==item.project_sha256||project.sourceReleaseSha256!==item.sha256||
     project.sourceThemeId!==item.slug||project.sourcePackageVersion!==item.version||
     !Array.isArray(project.pages)||project.pages.length!==item.page_count||
     !project.pages.every(p=>Array.isArray(p.sections)&&p.sections.length>0&&p.sections.some(s=>
       (s.schema?.fields?.length || (s.schema?.blocks||[]).some(b=>b.fields?.length)))))
    throw Error('editable_project_invalid');
  result.project=true;
 }catch(error){result.error=String(error.message||error)}
 rows.push(result);
 console.log([item.slug,item.version,result.published?'published':'NOT PUBLISHED',result.zip?'zip-valid':'ZIP FAIL',result.project?'project-valid':'PROJECT FAIL',item.page_count,result.error||''].join('\t'));
}
const passed=rows.filter(r=>r.published&&r.zip&&r.project).length;
console.log(JSON.stringify({required:minimum,checked:rows.length,passed,failed:rows.length-passed,results:rows}));
if(passed!==rows.length||rows.length<minimum)process.exitCode=1;
