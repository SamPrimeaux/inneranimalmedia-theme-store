#!/usr/bin/env node
// Publish non-installable Theme Store CMS globals, preserving immutable R2 revisions.
// Authored state: cms_page_sections + cms_section_blocks + cms_navigation_menus.
// Lifecycle state: cms_globals. Delivery: theme-store/sites/theme-store/globals/.
import { readFile,writeFile,mkdtemp,rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { footerFromCmsRows } from '../src/footer.mjs';
import { headerFromCmsRows } from '../src/header.mjs';

const args=process.argv.slice(2);
const db=args.includes('--database')?args[args.indexOf('--database')+1]:'inneranimalmedia-business';
const local=args.includes('--local');
const only=args.includes('--only')?args[args.indexOf('--only')+1]:null;
if(!/^[\w-]+$/.test(db)|| (only&&!['header','footer'].includes(only)))throw new Error('invalid arguments');
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
const j=x=>q(JSON.stringify(x));
function cli(command,argv){
  const result=spawnSync(command,argv,{encoding:'utf8',maxBuffer:10e6});
  if(result.status!==0)throw new Error(command+' '+argv.join(' ')+' failed: '+(result.stderr||result.stdout));
  return result.stdout;
}
function query(sql){
  const raw=cli('npx',['wrangler','d1','execute',db,local?'--local':'--remote','--json','--command',sql]);
  const result=JSON.parse(raw);
  if(!result[0]?.success)throw new Error('D1 query failed');
  return result[0]?.results??[];
}
function modify(sql){
  const raw=cli('npx',['wrangler','d1','execute',db,local?'--local':'--remote','--json','--command',sql]);
  const result=JSON.parse(raw);
  if(!result[0]?.success)throw new Error('D1 update failed');
  return result[0]?.meta?.changes;
}
const config=JSON.parse((await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8')).replace(/^\s*\/\/.*$/gm,''));
const bucket=config.r2_buckets?.find(b=>b.binding==='THEME_PACKAGES')?.bucket_name;
if(!bucket)throw new Error('THEME_PACKAGES R2 bucket not configured');
const root='sites/theme-store/globals';
const sectionOf=(key)=>'cmss_cmsp_theme_store_site_shell_'+key;
const group=(key)=>{
 const s=query('SELECT id,section_type,section_data FROM cms_page_sections WHERE id='+q(sectionOf(key))+' AND is_visible=1 LIMIT 1')[0];
 if(!s||s.section_type!=='global-'+key)throw new Error('global '+key+' section missing');
 const blocks=query('SELECT b.block_key,b.block_type,b.sort_order,b.settings_json,b.content_json,p.block_key AS parent_block_key FROM cms_section_blocks b LEFT JOIN cms_section_blocks p ON p.id=b.parent_block_id WHERE b.section_id='+q(s.id)+" AND b.status='active' ORDER BY b.sort_order,b.block_key");
 const g=query('SELECT * FROM cms_globals WHERE site_id=\'theme-store\' AND global_key='+q(key)+' LIMIT 1')[0];
 if(!g)throw new Error('cms_globals '+key+' row not seeded');
 return {s,blocks,g};
};
const temp=await mkdtemp(join(tmpdir(),'theme-store-global-pub-'));
async function upload(path,body){
 const file=join(temp,'upload.json');
 const verify=join(temp,'verify.json');
 await writeFile(file,body);
 cli('npx',['wrangler','r2','object','put',bucket+'/'+path,local?'--local':'--remote','--file',file,'--content-type','application/json']);
 cli('npx',['wrangler','r2','object','get',bucket+'/'+path,local?'--local':'--remote','--file',verify]);
 if(await readFile(verify,'utf8')!==body)throw new Error('R2 readback mismatch: '+path);
}
try {
 for(const key of (only?[only]:['header','footer'])){
  const {s,blocks,g}=group(key);
  let content;
  if(key==='header'){
   const menu=query("SELECT menu_name,is_active,menu_items FROM cms_navigation_menus WHERE site_id='theme-store' AND menu_name='main' LIMIT 1")[0];
   if(!menu)throw new Error('main menu missing');
   content=headerFromCmsRows(s,blocks,menu);
  }else{
   if(blocks.length<12)throw new Error('footer incomplete: '+blocks.length);
   content=footerFromCmsRows(s,blocks);
   if(content.blocks.length!==blocks.length)throw new Error('footer projection dropped blocks');
  }
  const bytes=JSON.stringify(content,null,2)+'\n';
  const hash=createHash('sha256').update(bytes).digest('hex');
  const same=g.content_hash===hash&&g.status==='published';
  const version=same?g.content_version:g.content_version+1;
  const versionKey=root+'/'+key+'/versions/v'+String(version).padStart(6,'0')+'-'+hash+'.json';
  const currentKey=root+'/'+key+'/current.json';
  await upload(versionKey,bytes);
  if(!same){
   // Compare-and-swap protects publication from a concurrent CMS writer.
   const sql="UPDATE cms_globals SET status='published',content_version="+version+
     ',content_hash='+q(hash)+',content_object_key='+q(versionKey)+
     ',inline_content_json='+q(bytes)+
     ",metadata_json=json_set(metadata_json,'$.r2_bucket',"+q(bucket)+",'$.active_key',"+q(currentKey)+",'$.installable',json('false'))"+
     ",updated_at=datetime('now') WHERE id="+q(g.id)+' AND content_version='+g.content_version+
     (g.content_hash===null?' AND content_hash IS NULL':' AND content_hash='+q(g.content_hash));
   if(modify(sql)!==1)throw new Error('CMS global version conflict: '+key);
  }
  await upload(currentKey,bytes);
  // Readable editor/publication references; no installable product or release record.
  modify('UPDATE cms_page_sections SET published_r2_key='+q(versionKey)+',r2_bucket='+q(bucket)+
     ',published_hash='+q(hash)+',updated_at=datetime(\'now\') WHERE id='+q(s.id));
  modify('UPDATE cms_components SET preview_r2_bucket='+q(bucket)+',preview_r2_key='+q(currentKey)+
     ',verification_json='+j({status:'verified',r2_sha256:hash,version,site_id:'theme-store'})+
     ",implementation_status='verified',updated_at=datetime('now') WHERE definition_id="+q(key==='header'?'cmsd_store_global_header':'cmsd_store_global_footer'));
  const menuName=key==='header'?'main':'footer';
  if(key==='footer'){
    // Footer link blocks are authoritative. The menu table is a navigation projection.
    const groups=content.blocks.filter(b=>b.parent===null&&b.type==='group').sort((a,b)=>a.order-b.order).map(group=>({
      key:group.key,label:group.settings.heading,items:content.blocks.filter(b=>b.parent===group.key&&b.type==='link').sort((a,b)=>a.order-b.order).map(b=>({key:b.key,label:b.settings.label,href:b.settings.href,sort_order:b.order}))
    }));
    modify("UPDATE cms_navigation_menus SET menu_type='site_footer',menu_items="+j({schema:'iam.cms.footer-menu.v1',groups})+
      ',r2_bucket='+q(bucket)+',r2_key='+q(versionKey)+",updated_at=datetime('now') WHERE site_id='theme-store' AND menu_name='footer'");
  }else{
    modify('UPDATE cms_navigation_menus SET r2_bucket='+q(bucket)+',r2_key='+q(versionKey)+
      ",updated_at=datetime('now') WHERE site_id='theme-store' AND menu_name='main'");
  }
  const row=query("SELECT status,content_version,content_object_key,content_hash FROM cms_globals WHERE site_id='theme-store' AND global_key="+q(key))[0];
  if(row?.content_hash!==hash||row?.content_object_key!==versionKey||row.status!=='published')throw new Error('CMS global publication mismatch: '+key);
  console.log(key+' published '+(same?'(unchanged) ':'')+'v'+version+' '+hash.slice(0,12)+' → '+bucket+'/'+currentKey+'; '+blocks.length+' editable blocks');
 }
}finally{await rm(temp,{recursive:true,force:true});}
