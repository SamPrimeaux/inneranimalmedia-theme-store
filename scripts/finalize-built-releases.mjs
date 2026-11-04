#!/usr/bin/env node
/** Final catalog activation: never rebuild an existing validated release ZIP.
 * The uploader has already verified the immutable R2 ZIP/project round-trips.
 * This step only pins the exact hashes in each canonical package.json.
 */
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const stage=JSON.parse(await readFile(join(root,'.releases/staged-releases.json'),'utf8'));
const tmp=await mkdtemp(join(tmpdir(),'iam-finalize-release-'));
function run(args){
 const r=spawnSync('npx',['wrangler','r2','object',...args],{cwd:root,encoding:'utf8',maxBuffer:5_000_000});
 if(r.status!==0)throw Error(r.stderr||r.stdout||'r2_failure');
}
try {
 const file=join(tmp,'install-index.json');
 run(['get','theme-store/install-index/index.json','--remote','--file',file]);
 const idx=JSON.parse(await readFile(file,'utf8'));
 if(idx.schema!=='agentsam.website-theme-install-index.v1'||idx.packages.length!==stage.products.length)
   throw Error('install_index_incomplete');
 const changes=[];
 for(const entry of stage.products){
   if(entry.uploaded!==true)throw Error('release_not_verified:'+entry.slug);
   const project=idx.packages.find(p=>p.slug===entry.slug&&p.version===entry.version&&p.sha256===entry.sha256&&
     /^([a-f0-9]{64})$/.test(p.project_sha256||''));
   if(!project)throw Error('release_installer_not_verified:'+entry.slug);
   const path=join(root,'packages/theme-'+entry.slug+'/package.json');
   const pkg=JSON.parse(await readFile(path,'utf8'));
   if(pkg.version!==entry.version||pkg.agentsam?.slug!==entry.slug||pkg.agentsam?.store?.release?.status==='published'&&
     pkg.agentsam.store.release.sha256!==entry.sha256)throw Error('immutable_release_conflict:'+entry.slug);
   changes.push({path,pkg,entry,project});
 }
 console.log('REVIEWED',changes.map(x=>x.entry.slug+'@'+x.entry.version).join(', '));
 if(!process.argv.includes('--apply')){console.log('No files changed (pass --apply to activate)');process.exit(0);}
 for(const {path,pkg,entry} of changes){
   pkg.agentsam.store.release={status:'published',sha256:entry.sha256,storageKey:entry.storageKey};
   await writeFile(path,JSON.stringify(pkg,null,2)+'\n');
 }
 console.log('ACTIVATED',changes.length,'source packages; run npm run check and deploy from main.');
}finally{await rm(tmp,{recursive:true,force:true});}
