#!/usr/bin/env node
/** Register reviewed Theme Store packages in the existing product/release spine.
 * The metadata source is R2's verified install index, not a second registry.
 * --stage marks the batch reviewed but not public; --publish promotes only
 * when AgentSam can consume its remote immutable project URLs.
 */
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const action=process.argv.includes('--publish')?'published':'staged';
const only=process.argv.find(arg=>arg.startsWith('--only='))?.slice(7);
if(only!==undefined&&!/^[a-z][a-z0-9-]{0,63}$/.test(only))throw Error('invalid_theme_slug');
const staged=JSON.parse(await readFile(join(root,'.releases/staged-releases.json'),'utf8'));
function run(bin,args) {
 const r=spawnSync(bin,args,{cwd:root,encoding:'utf8',maxBuffer:10_000_000});
 if(r.status!==0)throw Error((r.stderr||r.stdout||'command failed')+' for '+bin+' '+args.join(' '));
 return r.stdout;
}
const tmp=await mkdtemp(join(tmpdir(),'iam-product-release-'));
const raw=join(tmp,'install-index.json');
try {
 run('npx',['wrangler','r2','object','get','theme-store/install-index/index.json','--remote','--file',raw]);
 const idx=JSON.parse(await readFile(raw,'utf8'));
 const selected=only?staged.products.filter(item=>item.slug===only):staged.products;
 if(idx.schema!=='agentsam.website-theme-install-index.v1'||!Array.isArray(idx.packages)||
    selected.length!==(only?1:11))throw Error('invalid_release_batch');
 const q=v=>"'"+String(v).replaceAll("'","''")+"'";
 const safe=p=>/^[a-z][a-z0-9-]{0,63}$/.test(p.slug)&&/^\d+\.\d+\.\d+$/.test(p.version)&&/^[a-f0-9]{64}$/.test(p.sha256);
 const sql=['PRAGMA foreign_keys=ON;'];
 for (const item of selected) {
   const published=idx.packages.find(p=>p.slug===item.slug&&p.version===item.version&&p.sha256===item.sha256);
   if(!safe(item)||!published||!/^[a-f0-9]{64}$/.test(published.project_sha256||'')||
       published.project_key!=='install-projects/'+item.slug+'/'+item.version+'/'+published.project_sha256+'.json')
     throw Error('unverified_installer_release:'+item.slug);
   const productMetadata={
     themeStore:true,source:'theme-store',category:'website-theme',version:item.version,
     releaseSha256:item.sha256,projectSha256:published.project_sha256,
     editablePageCount:published.page_count,previewUrl:'https://themes.inneranimalmedia.com/theme-packages/'+item.slug+'/'+item.version+'/preview/',
   };
   const releaseId='release_theme_'+item.slug.replaceAll('-','_')+'_'+item.version.replaceAll('.','_');
   // A legitimate existing product retains its identity, especially IASF.
   sql.push(`UPDATE agentsam_products SET version=${q(item.version)},
    source_type='theme-store-package',source_id=${q(item.slug)},
    package_name=${q('@inneranimalmedia/theme-'+item.slug)},
    metadata=json_patch(metadata,${q(JSON.stringify(productMetadata))}),
    updated_at=unixepoch()${action==='published'?",status='production',catalog_visibility='public'":''}
    WHERE slug=${q(item.slug)} AND kind='theme';`);
   const releaseMeta=JSON.stringify({installer_schema:'agentsam.theme-project.v1',
     project_r2_key:published.project_key,project_sha256:published.project_sha256,
     editable_page_count:published.page_count,manifest_page_count:published.manifest_page_count});
   sql.push(`INSERT INTO agentsam_product_releases
     (id,product_id,product_slug,sku,version,channel,release_status,review_status,artifact_kind,
      r2_bucket,r2_key,sha256,byte_size,package_name,preview_url,compatible_schema_version,
      metadata_json,published_at_unix)
     SELECT ${q(releaseId)},id,${q(item.slug)},${q('iam.theme.'+item.slug)},${q(item.version)},
      'release',${q(action)},'approved','theme_zip','theme-store',${q(item.storageKey)},
      ${q(item.sha256)},${item.bytes},${q('@inneranimalmedia/theme-'+item.slug)},
      ${q('https://themes.inneranimalmedia.com/theme-packages/'+item.slug+'/'+item.version+'/preview/')},
      '2',${q(releaseMeta)},${action==='published'?'unixepoch()':'NULL'}
     FROM agentsam_products WHERE slug=${q(item.slug)} AND kind='theme'
     ON CONFLICT(id) DO UPDATE SET
      release_status=CASE WHEN agentsam_product_releases.sha256=excluded.sha256 THEN excluded.release_status ELSE agentsam_product_releases.release_status END,
      published_at_unix=CASE WHEN agentsam_product_releases.sha256=excluded.sha256 THEN excluded.published_at_unix ELSE agentsam_product_releases.published_at_unix END;`);
 }
 const file=join(tmp,'releases.sql');
 await writeFile(file,sql.join('\n')+'\n');
 console.log('REGISTER',action,selected.length);
 if(process.argv.includes('--dry-run')){console.log(sql.join('\n').slice(0,1000));process.exit(0);}
 console.log(run('npx',['wrangler','d1','execute','inneranimalmedia-business','--remote','--file',file]).slice(-6000));
}finally{await rm(tmp,{recursive:true,force:true});}
