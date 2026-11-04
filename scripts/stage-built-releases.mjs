#!/usr/bin/env node
/** Publish already-built, reviewed release ZIPs to private R2.
 * This is intentionally separate from catalog activation. Publishing the
 * product listing is the final step, after editable project validation.
 */
import { readFile, writeFile, mkdtemp, rm, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const releases=join(root,'.releases');
const nameOf = v => v.replace(/^theme-/,'');
function run(bin,args, cwd=root) {
 const x=spawnSync(bin,args,{cwd,encoding:'utf8',maxBuffer:8_000_000});
 if(x.status!==0)throw Error(bin+' '+args.join(' ')+': '+(x.stderr||x.stdout||x.error?.message||'failed'));
 return x.stdout.trim();
}
function hash(data){return createHash('sha256').update(data).digest('hex');}
const manifest=[];
for(const file of (await readdir(releases)).filter(n=>/^[a-z0-9-]+-\d+\.\d+\.\d+\.zip$/.test(n)).sort()) {
 const found=/^(.+)-(\d+\.\d+\.\d+)\.zip$/.exec(file);
 const [,slug,version]=found;
 const pkg=JSON.parse(await readFile(join(root,'packages','theme-'+slug,'package.json'),'utf8'));
 if(pkg.version!==version||pkg.agentsam?.slug!==slug)throw Error('version_mismatch:'+slug);
 const path=join(releases,file), data=await readFile(path);
 if(data.length>32*1024*1024)throw Error('oversized release:'+slug);
 run('unzip',['-tq',path]);
 const entries=run('unzip',['-Z1',path]).split('\n').filter(Boolean);
 if(entries.some(x=>x.startsWith('/')||x.split('/').some(part=>part==='..'||part==='')||
      !/^(site\/[a-zA-Z0-9._/-]+|theme-package\.json)$/.test(x)))throw Error('unsafe_zip_path:'+slug);
 const pkgInfo=JSON.parse(run('unzip',['-p',path,'theme-package.json']));
 if(pkgInfo.slug!==slug||pkgInfo.version!==version||pkgInfo.schema!=='iam.theme-package.v1'||!entries.includes('site/index.html'))throw Error('invalid_release_manifest:'+slug);
 const sha256=hash(data);
 if(pkg.agentsam.store.release?.status==='published' && pkg.agentsam.store.release.sha256!==sha256)throw Error('immutable_release_conflict:'+slug);
 manifest.push({slug,version,sha256,storageKey:'releases/'+slug+'/'+version+'/'+sha256+'.zip',file,bytes:data.length,files:entries.length,uploaded:false,alreadyPublished:pkg.agentsam.store.release?.status==='published'});
}
const destination=join(releases,'staged-releases.json');
if(process.argv.includes('--check')){console.log(JSON.stringify(manifest,null,2));process.exit(0);}
const temp=await mkdtemp(join(tmpdir(),'iam-verify-r2-'));
try {
 for(const item of manifest){
  const source=join(releases,item.file);
  const output=join(temp,item.file);
  console.log('STAGE',item.slug,item.version,item.bytes,'bytes','sha',item.sha256);
  if(!item.alreadyPublished){
   run('npx',['wrangler','r2','object','put','theme-store/'+item.storageKey,'--remote','--file',source,'--content-type','application/zip']);
  }
  run('npx',['wrangler','r2','object','get','theme-store/'+item.storageKey,'--remote','--file',output]);
  if(hash(await readFile(output))!==item.sha256)throw Error('remote_digest_mismatch:'+item.slug);
  item.uploaded=true;
  await writeFile(destination,JSON.stringify({schema:'iam.theme-stage.v1',products:manifest},null,2)+'\n');
  console.log('VERIFIED',item.slug,item.sha256);
 }
}finally{await rm(temp,{recursive:true,force:true});}
