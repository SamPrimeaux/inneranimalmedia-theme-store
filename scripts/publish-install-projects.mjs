#!/usr/bin/env node
/** Publish source-derived editable CMS projects as immutable R2 artifacts.
 * A single common release pipeline serves every website starter. The index is
 * uploaded only after all approved ZIPs and projects pass remote SHA checks.
 * Usage: node scripts/publish-install-projects.mjs --sdk-root /path/to/agentsam-sdk
 */
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const flag=process.argv.indexOf('--sdk-root');
const sdkRoot=flag>=0?resolve(process.argv[flag+1]||''):null;
if(!sdkRoot)throw Error('Usage: publish-install-projects.mjs --sdk-root /path/to/agentsam-sdk');
const source=join(sdkRoot,'apps/ecommerce-cms-agentsam/frontend/static/data/site-theme-projects');
const staged=JSON.parse(await readFile(join(root,'.releases/staged-releases.json'),'utf8'));
const localIndex=JSON.parse(await readFile(join(source,'index.json'),'utf8'));
if(staged.schema!=='iam.theme-stage.v1'||localIndex.schema!=='agentsam.website-theme-install-index.v1'||
 staged.products.length!==11||localIndex.packages.length!==11) throw Error('release_batch_must_have_11');
const hash=b=>createHash('sha256').update(b).digest('hex');
function run(args){
 const p=spawnSync('npx',['wrangler','r2','object',...args],{cwd:root,encoding:'utf8',maxBuffer:8_000_000});
 if(p.status!==0)throw Error(p.stderr||p.stdout||'R2 operation failed');
}
const temp=await mkdtemp(join(tmpdir(),'iam-publish-projects-'));
const result=[];
try {
 for(const release of staged.products){
   if(!release.uploaded)throw Error('unverified_release:'+release.slug);
   const src=localIndex.packages.find(p=>p.slug===release.slug&&p.version===release.version&&p.sha256===release.sha256);
   if(!src)throw Error('installer_index_mismatch:'+release.slug);
   const path=join(source,release.slug+'-'+release.version+'.json');
   const bytes=await readFile(path);
   if(bytes.length>8*1024*1024)throw Error('oversized_project:'+release.slug);
   const project=JSON.parse(bytes.toString('utf8'));
   if(project.schema!=='agentsam.theme-project.v1'||
     project.id!=='theme_'+release.slug||project.sourceThemeId!==release.slug||
     project.sourcePackage!=='@inneranimalmedia/theme-'+release.slug||
     project.sourcePackageVersion!==release.version||project.sourceReleaseSha256!==release.sha256||
     !Array.isArray(project.pages)||project.pages.length!==src.page_count||src.page_count<1||
     project.pages.some(p=>!p.slug||!Array.isArray(p.sections)||!p.sections.length||
       !p.sections.some(s=>(s.schema?.fields||[]).length||(s.schema?.blocks||[]).some(b=>b.fields?.length)))) {
     throw Error('invalid_installable_project:'+release.slug);
   }
   if(project.sourceAssetErrors?.length)throw Error('unresolved_preview_assets:'+release.slug+':'+project.sourceAssetErrors.join(','));
   const projectHash=hash(bytes);
   const key='install-projects/'+release.slug+'/'+release.version+'/'+projectHash+'.json';
   console.log('PUBLISH PROJECT',release.slug,'pages',src.page_count,'bytes',bytes.length,'hash',projectHash);
   run(['put','theme-store/'+key,'--remote','--file',path,'--content-type','application/json']);
   const fetched=join(temp,release.slug+'.json');
   run(['get','theme-store/'+key,'--remote','--file',fetched]);
   if(hash(await readFile(fetched))!==projectHash)throw Error('r2_project_digest_mismatch:'+release.slug);
   result.push({slug:release.slug,version:release.version,sha256:release.sha256,project_sha256:projectHash,
     project_key:key,page_count:src.page_count,manifest_page_count:src.manifest_page_count});
   console.log('VERIFIED PROJECT',release.slug,src.page_count);
 }
 const manifest={schema:'agentsam.website-theme-install-index.v1',packages:result.sort((a,b)=>a.slug.localeCompare(b.slug))};
 const content=Buffer.from(JSON.stringify(manifest,null,2)+'\n');
 const manifestFile=join(temp,'install-index.json');await writeFile(manifestFile,content);
 run(['put','theme-store/install-index/index.json','--remote','--file',manifestFile,'--content-type','application/json']);
 const checked=join(temp,'install-index-remote.json');
 run(['get','theme-store/install-index/index.json','--remote','--file',checked]);
 if(hash(await readFile(checked))!==hash(content))throw Error('install_index_remote_digest_mismatch');
 console.log('VERIFIED BATCH',result.length,'projects and index',hash(content));
}finally{await rm(temp,{recursive:true,force:true});}
