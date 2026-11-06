#!/usr/bin/env node
// Owner-operated bridge until the authenticated CMS media picker supports these
// site-owned product associations. Never exposes a public upload API.
import { readFile,writeFile,mkdtemp,rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { extname,join,basename } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
const argv=process.argv.slice(2);
const param=x=>argv.includes('--'+x)?argv[argv.indexOf('--'+x)+1]:undefined;
const collection=param('collection'),slug=param('product'),path=param('file'),role=param('role');
const alt=param('alt')||'';
const apply=argv.includes('--apply');
const simple=/^[a-z0-9-]+$/;
if(!simple.test(collection||'')||!simple.test(slug||'')||!['icon','cover','gallery'].includes(role)||!path){
 throw new Error('Usage: node scripts/add-product-media.mjs --collection apps --product cad-creator --file /path/icon.png --role icon|cover|gallery [--alt Description] [--apply]');
}
const ext=extname(path).toLowerCase();
const types={'.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
if(!types[ext])throw new Error('unsupported image format');
const bytes=await readFile(path);
if(bytes.length===0||bytes.length>8*1024*1024)throw new Error('image size must be 1 B–8 MB');
const ascii=bytes.toString('utf8');
if(ext==='.svg'&&(!/<svg\b/i.test(ascii)||/<script|\bon\w+\s*=|javascript:|foreignObject|<iframe/i.test(ascii)))throw new Error('unsafe SVG');
if(ext==='.png'&&!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('invalid PNG');
if(['.jpg','.jpeg'].includes(ext)&&!(bytes[0]===0xff&&bytes[1]===0xd8))throw new Error('invalid JPEG');
if(ext==='.webp'&&!(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'))throw new Error('invalid WebP');
const sha=createHash('sha256').update(bytes).digest('hex');
const assetId='cmsa_store_'+slug.replaceAll('-','_')+'_'+sha.slice(0,16);
const key='sites/theme-store/media/products/'+slug+'/'+sha.slice(0,16)+ext;
const url='https://themes.inneranimalmedia.com/site-media/products/'+slug+'/'+sha.slice(0,16)+ext;
const q=x=>"'"+String(x).replaceAll("'","''")+"'";
const j=x=>q(JSON.stringify(x));
function cli(cmd,args){
 const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:8e6});
 if(r.status!==0)throw new Error(cmd+' failed: '+(r.stderr||r.stdout));
 return r.stdout;
}
function query(sql){
 const r=JSON.parse(cli('npx',['wrangler','d1','execute','inneranimalmedia-business','--remote','--json','--command',sql]))[0];
 if(!r?.success)throw new Error('database query failed');
 return r;
}
const rows=query("SELECT ci.id,ci.presentation_json,p.id AS product_id,p.name AS product_name FROM cms_collection_items ci JOIN cms_collections c ON c.id=ci.collection_id JOIN agentsam_products p ON p.id=ci.item_ref WHERE c.site_id='theme-store' AND c.slug="+q(collection)+" AND ci.site_id='theme-store' AND ci.item_type='product' AND p.slug="+q(slug)+" LIMIT 1").results;
if(rows.length!==1)throw new Error('No existing product item matches '+collection+'/'+slug);
const row=rows[0];
const presentation=JSON.parse(row.presentation_json||'{}');
presentation.schema='iam.cms.product-presentation.v1';
if(role==='icon')presentation.icon_asset_id=assetId;
if(role==='cover')presentation.cover_asset_id=assetId;
if(role==='cover'||role==='gallery'){
 const gallery=Array.isArray(presentation.gallery_asset_ids)?presentation.gallery_asset_ids:[];
 if(!gallery.includes(assetId))gallery.push(assetId);
 presentation.gallery_asset_ids=gallery;
}
if(!apply){
 console.log('DRY RUN: '+role+' for '+collection+'/'+slug+' → '+assetId+'; '+key);
 console.log('No upload or CMS mutation. Add --apply, then npm run publish:collections for public collections.');
 process.exit(0);
}
const dir=await mkdtemp(join(tmpdir(),'theme-product-media-'));
try{
 const verify=join(dir,'readback'+ext);
 cli('npx',['wrangler','r2','object','put','theme-store/'+key,'--remote','--file',path,'--content-type',types[ext]]);
 cli('npx',['wrangler','r2','object','get','theme-store/'+key,'--remote','--file',verify]);
 if(!createHash('sha256').update(await readFile(verify)).digest('hex').startsWith(sha))throw new Error('R2 readback checksum mismatch');
 const insert="INSERT OR IGNORE INTO cms_assets(id,filename,original_filename,path,size,mime_type,category,tags,r2_key,public_url,thumbnail_url,metadata,alt_text,usage_context,asset_key,label,site_id,r2_bucket,is_live) VALUES ("+
 [q(assetId),q(basename(path)),q(basename(path)),q(key),String(bytes.length),q(types[ext]),q('marketplace-'+role),q('[]'),q(key),q(url),q(url),
 j({source:'operator-approved-upload',sha256:sha,product_slug:slug}),q(alt||row.product_name+' '+role),q('marketplace-'+role),q(key),q(row.product_name+' '+role),"'theme-store'","'theme-store'",'1'].join(',')+");";
 const update="UPDATE cms_collection_items SET presentation_json="+j(presentation)+",updated_at=datetime('now') WHERE id="+q(row.id)+" AND presentation_json="+q(row.presentation_json)+";";
 const relation="INSERT OR IGNORE INTO cms_collection_assets(collection_id,asset_id,order_index,added_at) SELECT collection_id,"+q(assetId)+",100,unixepoch() FROM cms_collection_items WHERE id="+q(row.id)+";";
 const file=join(dir,'media.sql');await writeFile(file,[insert,update,relation].join('\n')+'\n');
 cli('npx',['wrangler','d1','execute','inneranimalmedia-business','--remote','--file',file]);
 const check=query('SELECT presentation_json FROM cms_collection_items WHERE id='+q(row.id)).results?.[0];
 if(JSON.stringify(JSON.parse(check.presentation_json))!==JSON.stringify(presentation))throw new Error('presentation update was not applied; another editor may have changed it');
 console.log('Saved real '+role+' asset '+assetId+' to '+collection+'/'+slug+'; R2 checksum verified. Publish collection when ready.');
}finally{await rm(dir,{recursive:true,force:true});}
