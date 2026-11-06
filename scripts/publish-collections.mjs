#!/usr/bin/env node
// Publish only approved public CMS collections; keep private app drafts private.
// Image galleries resolve against real cms_assets rows stored in the Theme Store R2.
import { readFile,writeFile,mkdtemp,rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
const db='inneranimalmedia-business';
const q=x=>"'"+String(x).replaceAll("'","''")+"'";
const j=x=>q(JSON.stringify(x));
function cli(cmd,argv){
 const r=spawnSync(cmd,argv,{encoding:'utf8',maxBuffer:10e6});
 if(r.status!==0)throw new Error(cmd+' failed: '+(r.stderr||r.stdout));
 return r.stdout;
}
function sql(query){
 const r=JSON.parse(cli('npx',['wrangler','d1','execute',db,'--remote','--json','--command',query]))[0];
 if(!r?.success)throw new Error('D1 collection query failed');
 return r;
}
const collections=sql("SELECT id,site_id,name,description,slug,seo_title,seo_description,thumbnail_asset_id,metadata_json FROM cms_collections WHERE site_id='theme-store' AND status='active' AND visibility='public' ORDER BY sort_order,name").results;
const assets=sql("SELECT id,site_id,public_url,thumbnail_url,r2_key,mime_type,alt_text,category FROM cms_assets WHERE site_id='theme-store' AND is_live=1").results;
const assetById=new Map(assets.map(asset=>[asset.id,asset]));
const validAsset=id=>assetById.get(id);
const drafts=await mkdtemp(join(tmpdir(),'theme-collections-pub-'));
try{
 for(const collection of collections){
   if(!/^[a-z0-9-]+$/.test(collection.slug))throw new Error('invalid collection slug');
   const rows=sql("SELECT ci.id,ci.item_ref,ci.sort_order,ci.presentation_json,p.slug,p.name,p.description,p.kind,p.status,p.catalog_visibility,p.metadata FROM cms_collection_items ci JOIN agentsam_products p ON p.id=ci.item_ref WHERE ci.site_id='theme-store' AND ci.collection_id="+q(collection.id)+" AND ci.item_type='product' AND ci.status='active' AND p.catalog_visibility='public' ORDER BY ci.sort_order,ci.id").results;
   const items=rows.map(row=>{
    let presentation={};
    try{presentation=JSON.parse(row.presentation_json||'{}');}catch{}
    const cover=validAsset(presentation.cover_asset_id);
    const icon=validAsset(presentation.icon_asset_id);
    const gallery=(Array.isArray(presentation.gallery_asset_ids)?presentation.gallery_asset_ids:[]).map(validAsset).filter(Boolean);
    const productMeta=JSON.parse(row.metadata||'{}');
    return {
     id:row.item_ref,slug:row.slug,kind:row.kind,name:presentation.title||row.name,
     summary:presentation.summary||row.description||'',
     cover_url:cover?.public_url||null,
     icon_url:icon?.public_url||null,
     gallery:gallery.map(a=>({asset_id:a.id,url:a.public_url,alt:a.alt_text||row.name})),
     product_status:row.status,
     version:productMeta.version||null,
     sort_order:row.sort_order
    };
   });
   const document={schema:'iam.cms.public-collection.v1',site_id:'theme-store',
    collection:{id:collection.id,slug:collection.slug,name:collection.name,
      description:collection.description||'',seo_title:collection.seo_title||'',
      seo_description:collection.seo_description||'',
      thumbnail_url:validAsset(collection.thumbnail_asset_id)?.public_url||null},
    items};
   const body=JSON.stringify(document,null,2)+'\n';
   const hash=createHash('sha256').update(body).digest('hex');
   const metadata=JSON.parse(collection.metadata_json||'{}');
   const version=metadata.published_hash===hash&&Number(metadata.published_version)>0
      ? metadata.published_version : (Number(metadata.published_version)||0)+1;
   const key='sites/theme-store/collections/'+collection.slug+'/v'+String(version).padStart(6,'0')+'-'+hash+'.json';
   const current='sites/theme-store/collections/'+collection.slug+'/current.json';
   const file=join(drafts,collection.slug+'.json'),verify=join(drafts,collection.slug+'-verify.json');
   await writeFile(file,body);
   for(const path of [key,current]){
    cli('npx',['wrangler','r2','object','put','theme-store/'+path,'--remote','--file',file,'--content-type','application/json']);
    cli('npx',['wrangler','r2','object','get','theme-store/'+path,'--remote','--file',verify]);
    if(await readFile(verify,'utf8')!==body)throw new Error('R2 verification failed: '+path);
   }
   const updated={...metadata,published_hash:hash,published_version:version,published_key:key,
     active_key:current,r2_bucket:'theme-store',site_id:'theme-store'};
   sql("UPDATE cms_collections SET metadata_json="+j(updated)+',updated_at=unixepoch() WHERE id='+q(collection.id)+" AND site_id='theme-store'");
   console.log(collection.slug+': '+items.length+' approved products; R2 v'+version+' sha256 '+hash.slice(0,12));
 }
}finally{await rm(drafts,{recursive:true,force:true});}
