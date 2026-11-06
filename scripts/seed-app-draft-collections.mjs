#!/usr/bin/env node
// Internal, non-public staging collections for real existing app/product IDs.
// Do not grant installability, publish identities, or fabricate media.
import { writeFile,mkdtemp,rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
const apply=process.argv.includes('--apply');
const q=x=>"'"+String(x).replaceAll("'","''")+"'";
const j=x=>q(JSON.stringify(x));
const sets=[
 {id:'cmscol_store_apps',slug:'apps',name:'Applications',description:'Full applications and connected workspaces.',items:[
  {id:'prod_f7deb9f03c9429e4',title:'AgentSam Local Studio',summary:'Chat, development, projects and application workspace.'},
  {id:'prod_665c3051791f4a18',title:'CAD Creator',summary:'Independent design and CAD application.'}
 ]},
 {id:'cmscol_store_integrations',slug:'integrations',name:'Integrations',description:'Commerce and messaging capabilities backed by existing provider implementations.',items:[
  {id:'prod_7025556372af6364',title:'Completeful Commerce',summary:'Provider catalog, product design and fulfillment integration.'},
  {id:'prod_597a3214cca7af25',title:'Commerce Email',summary:'Commerce mailbox and email administration surface.'}
 ]}
];
const sql=[];
for(const col of sets){
 sql.push('INSERT OR IGNORE INTO cms_collections(id,name,description,created_at,updated_at,slug,kind,allowed_item_types_json,site_id,account_id,status,visibility,is_public,metadata_json) VALUES ('+
 [q(col.id),q(col.name),q(col.description),'unixepoch()','unixepoch()',q(col.slug),"'manual'",q('["product"]'),"'theme-store'","(SELECT account_id FROM cms_sites WHERE id='theme-store')","'draft'","'private'",'0',j({schema:'iam.cms.marketplace-collection.v1',origin:'existing-products',pending_review:true})].join(',')+');');
 for(let i=0;i<col.items.length;i++){
   const item=col.items[i];
   const presentation={schema:'iam.cms.product-presentation.v1',title:item.title,summary:item.summary,icon_asset_id:null,cover_asset_id:null,gallery_asset_ids:[],readiness:'internal-draft'};
   sql.push('INSERT OR IGNORE INTO cms_collection_items(id,account_id,site_id,collection_id,item_type,item_ref,sort_order,status,presentation_json) SELECT '+
    [q('cmscoli_store_'+col.slug+'_'+i),"(SELECT account_id FROM cms_sites WHERE id='theme-store')","'theme-store'",q(col.id),"'product'",'id',String(i),"'hidden'",j(presentation)].join(',')+
    ' FROM agentsam_products WHERE id='+q(item.id)+';');
 }
}
if(!apply){console.log('DRY RUN: two private collections; four hidden, existing product references. No public app listings or fake media.');process.exit(0);}
const dir=await mkdtemp(join(tmpdir(),'theme-store-app-drafts-'));
try{
 const file=join(dir,'drafts.sql');await writeFile(file,sql.join('\n')+'\n');
 const r=spawnSync('npx',['wrangler','d1','execute','inneranimalmedia-business','--remote','--file',file],{encoding:'utf8'});
 if(r.status!==0)throw new Error(r.stderr||r.stdout);
 console.log('Seeded app/integration draft collections with existing product IDs only. All items hidden.');
}finally{await rm(dir,{recursive:true,force:true});}
