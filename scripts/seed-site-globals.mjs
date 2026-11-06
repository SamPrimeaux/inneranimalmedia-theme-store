#!/usr/bin/env node
// Scope: Theme Store site globals only. Does not create installable products.
import { readFile,writeFile,mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const args=process.argv.slice(2);
const apply=args.includes('--apply');
const db=args.includes('--database')?args[args.indexOf('--database')+1]:'inneranimalmedia-business';
if(!/^[A-Za-z0-9_-]+$/.test(db))throw new Error('invalid D1 database name');
const header=JSON.parse(await readFile(new URL('../src/header.default.json',import.meta.url),'utf8'));
const footer=JSON.parse(await readFile(new URL('../src/footer.default.json',import.meta.url),'utf8'));
const q=x=>"'"+String(x).replaceAll("'","''")+"'";
const json=x=>q(JSON.stringify(x));
const account="(SELECT account_id FROM cms_sites WHERE id='theme-store')";
const headSection=header.section.id;
const footSection=footer.section.id;
const sectionKeys={header:headSection,footer:footSection};
const defs={brand:['monogram','label','logo_url','aria_label','href'],navigation:['menu_name','browse_key'],utilities:['origin_note','show_globe']};
const title=s=>s.replace(/_/g,' ').replace(/-/g,' ').replace(/\b\w/g,x=>x.toUpperCase());
function schema(fields){
 return {type:'object',properties:Object.fromEntries(fields.map(k=>[k,{
    type:k==='show_globe'?'boolean':'string',title:title(k),
    ...(k.includes('url')?{format:'uri'}:{})
 }]))};
}
let sql=[];
sql.push("UPDATE cms_definitions SET settings_schema_json="+json({type:'object',title:'Global header',properties:{
 background:{type:'string',title:'Background',format:'color'},foreground:{type:'string',title:'Foreground',format:'color'},
 height:{type:'integer',title:'Height',minimum:50,maximum:115},sticky:{type:'boolean',title:'Sticky header'}
}})+",allowed_blocks_json="+json(Object.keys(defs))+",updated_at=datetime('now') WHERE id='cmsd_store_global_header';");
sql.push("UPDATE cms_page_sections SET section_data="+json(header.section.settings)+",updated_at=datetime('now') WHERE id="+q(headSection)+" AND json_extract(section_data,'$.background') IS NULL;");
for(const [type,fields] of Object.entries(defs)){
 const id='cmsd_store_header_'+type;
 sql.push("INSERT OR IGNORE INTO cms_definitions(id,account_id,definition_key,kind,label,category,origin,version,settings_schema_json,allowed_blocks_json) VALUES ("+
 [q(id),account,q('global-header-'+type),"'block'",q('Header '+title(type)),"'header'","'built_in'","'1'",json(schema(fields)),"'[]'"].join(',')+");");
}
for(const block of header.blocks){
 const id='cmsb_theme_store_header_'+block.key.replaceAll('-','_');
 sql.push("INSERT OR IGNORE INTO cms_section_blocks(id,account_id,section_id,parent_block_id,block_key,block_type,definition_id,sort_order,content_json,settings_json) VALUES ("+
 [q(id),account,q(headSection),'NULL',q(block.key),q(block.type),q('cmsd_store_header_'+block.type),String(block.order),"'{}'",json(block.settings)].join(',')+");");
}
// Retain the current footer navigation items while allowing blocks to drive rendering.
for(const [key,label,href,order] of [
 ['resources-app-embeds','App embeds','/app-embeds/',30],
 ['resources-how-it-works','How it works','/#how-it-works',40]
]){
 const id='cmsb_theme_store_footer_'+key.replaceAll('-','_');
 sql.push("INSERT OR IGNORE INTO cms_section_blocks(id,account_id,section_id,parent_block_id,block_key,block_type,definition_id,sort_order,content_json,settings_json) VALUES ("+
 [q(id),account,q(footSection),q('cmsb_theme_store_footer_resources'),q(key),"'link'","'cmsd_store_footer_link'",String(order),"'{}'",json({label,href})].join(',')+");");
}
for(const [key,type,defId,renderer,source] of [
 ['header','header','cmsd_store_global_header','theme-store:global-header','inneranimalmedia-theme-store:src/main.tsx'],
 ['footer','footer','cmsd_store_global_footer','theme-store:global-footer','inneranimalmedia-theme-store:src/UniversalFooter.tsx']
]){
 const section=sectionKeys[key];
 const metadata={schema:'iam.cms.site-global.v1',site_id:'theme-store',section_id:section,definition_id:defId,scope:'site',installable:false,editor_source:'cms_page_sections+cms_section_blocks',navigation_menu:key==='header'?'main':'footer',r2_bucket:'theme-store'};
 sql.push("INSERT OR IGNORE INTO cms_globals(id,account_id,site_id,global_key,global_type,status,inline_content_json,content_version,metadata_json) VALUES ("+
 [q('cmsg_theme_store_'+key),account,"'theme-store'",q(key),q(type),"'draft'",json({schema:'iam.cms.site-global-reference.v1',section_id:section,definition_id:defId}),"0",json(metadata)].join(',')+");");
 sql.push("INSERT OR IGNORE INTO cms_components(id,definition_id,renderer_key,delivery_mode,source_ref,capabilities_json,compatibility_json,verification_json,implementation_status) VALUES ("+
 [q('cmp_theme_store_'+key),q(defId),q(renderer),"'bundled'",q(source),json({cms_global:true,editable_blocks:true,r2_content:true,installable:false}),json({site_id:'theme-store',global_key:key}),json({status:'pending_r2_publication'}),"'unverified'"].join(',')+");");
}
if(!apply){
 console.log('DRY RUN: prepared existing Theme Store header/footer globals, 3 header blocks, 2 additional existing footer-menu links, and component registry entries.');
 console.log('Use npm run globals:seed -- --apply to seed without overwriting existing edits. No installable products.');
 process.exit(0);
}
const dir=await mkdtemp(join(tmpdir(),'theme-store-globals-'));
try {
 const file=join(dir,'globals.sql');await writeFile(file,sql.join('\n')+'\n');
 const r=spawnSync('npx',['wrangler','d1','execute',db,'--remote','--file',file],{encoding:'utf8',maxBuffer:6e6});
 if(r.status!==0)throw new Error('D1 global seed failed: '+(r.stderr||r.stdout));
 console.log('Seeded Theme Store CMS globals (header/footer), header blocks, footer-menu additions, renderer registry. Existing edits preserved.');
}finally{await rm(dir,{recursive:true,force:true});}
