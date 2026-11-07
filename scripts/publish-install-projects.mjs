#!/usr/bin/env node
/** Publish reviewed, source-controlled CMS install projects as immutable R2 artifacts. */
import { readFile, writeFile, mkdtemp, rm, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { completeInstallProject } from '../src/install-project-repair.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const packages=join(root,'packages');
const hash=b=>createHash('sha256').update(b).digest('hex');
const SAFE_SLUG=/^[a-z][a-z0-9-]{0,63}$/;
function run(args){
  const p=spawnSync('npx',['wrangler','r2','object',...args],{cwd:root,encoding:'utf8',maxBuffer:8_000_000});
  if(p.status!==0)throw Error(p.stderr||p.stdout||'R2 operation failed');
}

const candidates=[];
for(const dir of await readdir(packages,{withFileTypes:true})){
  if(!dir.isDirectory())continue;
  const packagePath=join(packages,dir.name,'package.json');
  try{
    const pkg=JSON.parse(await readFile(packagePath,'utf8'));
    const meta=pkg.agentsam?.store;
    if(meta?.release?.status!=='published'||pkg.agentsam?.installable!==true)continue;
    const artifact=join(packages,dir.name,'install-project.json');
    // A missing source-backed project is a broken release pipeline, not a
    // reason to silently drop a previously installable theme from the index.
    try{await readFile(artifact);}catch{throw Error('published_installable_project_missing:'+pkg.agentsam.slug);}
    candidates.push({dir:dir.name,pkg,meta,artifact});
  }catch(error){if(String(error.message).startsWith('published_installable_project_missing:'))throw error;}
}
if(!candidates.length)throw Error('no_reviewed_install_projects_found');

const temp=await mkdtemp(join(tmpdir(),'iam-publish-projects-'));
const result=[];
try{
  for(const {dir,pkg,meta,artifact} of candidates){
    const slug=pkg.agentsam?.slug;
    const version=pkg.version;
    const release=meta.release;
    if(!SAFE_SLUG.test(slug||'')||!/^\d+\.\d+\.\d+$/.test(version||'')||
      !/^[0-9a-f]{64}$/.test(release.sha256||'')||
      release.storageKey!=='releases/'+slug+'/'+version+'/'+release.sha256+'.zip')
      throw Error('invalid_published_release:'+dir);
    const sourceBytes=await readFile(artifact);
    if(sourceBytes.length>8*1024*1024)throw Error('oversized_source_project:'+slug);
    const project=JSON.parse(sourceBytes.toString('utf8'));
    if(project.schema!=='agentsam.theme-project.v1'||project.id!=='theme_'+slug||
      project.sourceThemeId!==slug||project.sourcePackage!=='@inneranimalmedia/theme-'+slug||
      project.sourcePackageVersion!==version||project.sourceReleaseSha256!==release.sha256||
      !Array.isArray(project.pages)||project.pages.length<1||project.pages.length>80||
      project.pages.some(p=>!p.slug||!Array.isArray(p.sections)||!p.sections.length||
        !p.sections.some(s=>(s.schema?.fields||[]).length||(s.schema?.blocks||[]).some(b=>b.fields?.length)))||
      project.sourceAssetErrors?.length)throw Error('invalid_installable_project:'+slug);
    // A route which could not render may be included only when an actual
    // author-supplied CMS source manifest supplies its editable content.
    // No blank / missing routes may be represented as successful imports.
    const unresolved=(project.sourceRoutesNotRendered||[]).filter(entry=>{
      const route=String(entry).split(':')[0].replace(/^\/+|\/+$/g,'');
      return !project.pages.some(page=>page.sourceOrigin==='authored-cms-manifest-fallback'&&
        String(page.sourceRoute||'').replace(/^\/+|\/+$/g,'')===route);
    });
    if(unresolved.length)throw Error('unresolved_source_routes:'+slug+':'+unresolved.join(','));
    // Complete only missing platform pages. Preserve the verified, authored
    // source pages in the immutable install document; no preview rewriting.
    const completion=completeInstallProject(project);
    const bytes=Buffer.from(JSON.stringify(completion.project));
    if(bytes.length>8*1024*1024)throw Error('oversized_completed_project:'+slug);
    const completedArtifact=join(temp,slug+'-complete.json');
    await writeFile(completedArtifact,bytes);
    const projectHash=hash(bytes);
    const key='install-projects/'+slug+'/'+version+'/'+projectHash+'.json';
    console.log('PUBLISH PROJECT',slug,'authored',project.pages.length,'system',completion.added.length,'bytes',bytes.length,'hash',projectHash);
    run(['put','theme-store/'+key,'--remote','--file',completedArtifact,'--content-type','application/json']);
    const fetched=join(temp,slug+'.json');
    run(['get','theme-store/'+key,'--remote','--file',fetched]);
    if(hash(await readFile(fetched))!==projectHash)throw Error('r2_project_digest_mismatch:'+slug);
    result.push({slug,version,sha256:release.sha256,project_sha256:projectHash,
      project_key:key,page_count:completion.project.pages.length,manifest_page_count:project.sourceManifestPageCount||project.pages.length});
    console.log('VERIFIED PROJECT',slug,completion.project.pages.length);
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
