#!/usr/bin/env node
// Mirror approved, existing Theme Store cover images into site-owned R2 assets.
// Uses actual source files; never generates fake app icons or screenshots.
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join,extname } from 'node:path';
import { spawnSync } from 'node:child_process';
const apply=process.argv.includes('--apply');
const dry=process.argv.includes('--dry-run');
const database='inneranimalmedia-business';
const catalog=JSON.parse(await readFile('src/catalog.generated.json','utf8')).themes;
const q=x=>"'"+String(x).replaceAll("'","''")+"'";
const j=x=>q(JSON.stringify(x));
function exec(command,args){
 const r=spawnSync(command,args,{encoding:'utf8',maxBuffer:8e6});
 if(r.status!==0)throw new Error(command+' '+args.join(' ')+' failed: '+(r.stderr||r.stdout));
 return r.stdout;
}
const assets=[];
for(const t of catalog){
 if(!/^\/[a-zA-Z0-9_./-]+$/.test(t.cardImage))throw new Error('invalid theme media path '+t.slug);
 const ext=extname(t.cardImage).toLowerCase();
 if(!['.svg','.webp','.png','.jpg','.jpeg'].includes(ext))throw new Error('invalid image extension '+ext);
 const bytes=await readFile('public'+t.cardImage);
 if(ext==='.svg'&&/<script|\bonload\s*=|javascript:|foreignObject/i.test(bytes.toString('utf8')))throw new Error('unsafe SVG '+t.cardImage);
 const hash=createHash('sha256').update(bytes).digest('hex');
 const partial=hash.slice(0,16);
 const key='sites/theme-store/media/previews/'+t.slug+'/'+partial+ext;
 const url='https://themes.inneranimalmedia.com/site-media/'+t.slug+'/'+partial+ext;
 const assetId='cmsa_store_theme_'+t.slug.replaceAll('-','_')+'_cover';
 const mime=ext==='.svg'?'image/svg+xml':ext==='.webp'?'image/webp':ext==='.png'?'image/png':'image/jpeg';
 assets.push({theme:t,bytes,hash,key,url,assetId,ext,mime});
}
if(!apply){
 console.log('DRY RUN: '+assets.length+' existing theme preview images → theme-store R2 and cms_assets / cms_collection_items.');
 console.log('App icons: not fabricated; apps/integrations may attach their own media later.');
 process.exit(0);
}
const directory=await mkdtemp(join(tmpdir(),'theme-store-media-'));
const statements=[];
try{
 for(const a of assets){
  const file=join(directory,'media-'+a.theme.slug+a.ext);
  await writeFile(file,a.bytes);
  // Assets live under the site branch, outside theme-packages/<slug>/<version>/.
  exec('npx',['wrangler','r2','object','put','theme-store/'+a.key,'--remote','--file',file,'--content-type',a.mime]);
  const row=['id','filename','original_filename','path','size','mime_type','category','tags','r2_key','public_url','thumbnail_url','metadata','alt_text','usage_context','asset_key','label','site_id','r2_bucket','is_live'];
  const values=[a.assetId,a.theme.slug+a.ext,a.theme.slug+a.ext,a.key,a.bytes.length,a.mime,'theme-cover','[]',a.key,a.url,a.url,
    JSON.stringify({schema:'iam.cms.asset.v1',source:'theme-store-approved-preview',sha256:a.hash,product_slug:a.theme.slug}),
    a.theme.name+' theme preview','marketplace-product-cover',a.key,a.theme.name+' cover','theme-store','theme-store',1];
  statements.push('INSERT OR IGNORE INTO cms_assets('+row.join(',')+') VALUES ('+values.map((v,i)=>i===4||i===18?String(v):q(v)).join(',')+');');
  statements.push('INSERT OR IGNORE INTO cms_collection_assets(collection_id,asset_id,order_index,added_at) VALUES (\'cmscol_store_themes\','+q(a.assetId)+','+Number(a.theme.sortOrder||0)+',unixepoch());');
  const present={schema:'iam.cms.product-presentation.v1',cover_asset_id:a.assetId,icon_asset_id:null,gallery_asset_ids:[a.assetId],caption:a.theme.name,visibility:'public'};
  statements.push("UPDATE cms_collection_items SET presentation_json="+j(present)+",updated_at=datetime('now') WHERE collection_id='cmscol_store_themes' AND item_type='product' AND item_ref IN (SELECT id FROM agentsam_products WHERE slug="+q(a.theme.slug)+") AND presentation_json='{}';");
  console.log(a.theme.slug+' → '+a.key+' ('+a.bytes.length+' bytes)');
 }
 const file=join(directory,'media.sql');await writeFile(file,statements.join('\n')+'\n');
 exec('npx',['wrangler','d1','execute',database,'--remote','--file',file]);
 console.log('Registered '+assets.length+' verified theme cover assets in CMS; pre-existing custom presentation preserved.');
}finally{await rm(directory,{recursive:true,force:true});}
