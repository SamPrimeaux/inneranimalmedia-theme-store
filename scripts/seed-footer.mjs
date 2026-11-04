#!/usr/bin/env node
// Seed the existing Theme Store CMS footer section/blocks, never replace edits.
// Only writes to inneranimalmedia-business when --apply is explicitly supplied.
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const defaults = JSON.parse(await readFile(new URL('../src/footer.default.json',import.meta.url),'utf8'));
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const database = args.includes('--database') ? args[args.indexOf('--database')+1] : 'inneranimalmedia-business';
if (!/^[a-zA-Z0-9_-]+$/.test(database)) throw new Error('invalid D1 database');
const esc = value => "'" + String(value).replaceAll("'","''") + "'";
const j = value => esc(JSON.stringify(value));
const idOf = key => 'cmsb_theme_store_footer_' + key.replaceAll('-','_');
const defOf = type => 'cmsd_store_footer_' + type.replaceAll('-','_');
const title = key => key.replaceAll('_',' ').replaceAll('-',' ').replace(/\b\w/g,s=>s.toUpperCase());
const sectionId = defaults.section.id;
const owner = "(SELECT account_id FROM cms_definitions WHERE id='cmsd_store_global_footer')";
const schemas = {
  'cta': ['enabled','eyebrow','heading','description','primary_label','primary_href','secondary_label','secondary_href'],
  'contact':['logo_url','logo_alt','brand_label','heading','description','email','phone','phone_href'],
  'group':['heading'],
  'link':['label','href','icon_url'],
  'social-group':['heading'],
  'social-link':['label','icon','href'],
  'utilities':[],
  'copyright':['text'],
  'attribution':['label','logo_url','logo_alt','href']
};
function prop(name) {
  const bool = ['enabled','glb_enabled','glb_rotation'].includes(name);
  const numeric = name==='glb_opacity';
  return {type:bool?'boolean':numeric?'number':'string',title:title(name),...(name==='background'||name==='foreground'||name==='muted'||name==='divider'||name==='glb_tint'?{format:'color'}:{})};
}
function schema(keys,label) {return {type:'object',title:label,properties:Object.fromEntries(keys.map(k=>[k,prop(k)]))};}
const defs = Object.entries(schemas);
let sql=[];
sql.push("UPDATE cms_definitions SET settings_schema_json="+j(schema(Object.keys(defaults.section.settings),'Global footer'))+", allowed_blocks_json="+j(defs.map(([type])=>type))+", updated_at=datetime('now') WHERE id='cmsd_store_global_footer';");
sql.push("UPDATE cms_page_sections SET section_data="+j(defaults.section.settings)+", updated_at=datetime('now') WHERE id="+esc(sectionId)+" AND json_extract(section_data,'$.glb_url') IS NULL;");
for (const [type,fields] of defs) {
  sql.push("INSERT OR IGNORE INTO cms_definitions(id,account_id,definition_key,kind,label,category,origin,version,settings_schema_json,allowed_blocks_json) VALUES ("+
    [esc(defOf(type)),owner,esc('global-footer-'+type),"'block'",esc('Footer '+title(type)),"'footer'","'built_in'","'1'",j(schema(fields,'Footer '+title(type))),"'[]'"].join(',')+");");
}
for (const block of defaults.blocks) {
  sql.push("INSERT OR IGNORE INTO cms_section_blocks (id,account_id,section_id,parent_block_id,block_key,block_type,definition_id,sort_order,content_json,settings_json) VALUES ("+
    [esc(idOf(block.key)),owner,esc(sectionId),block.parent?esc(idOf(block.parent)):'NULL',esc(block.key),esc(block.type),esc(defOf(block.type)),String(block.order),"'{}'",j(block.settings)].join(',')+");");
}
// Wrangler/D1 batches statements itself; explicit BEGIN/COMMIT is rejected.
const statement = sql.join('\n')+'\n';
if (!apply) {
  console.log('DRY RUN: no database changes. Run npm run footer:seed -- --apply to seed the CMS.');
  console.log('Existing section and user edits are preserved by conditional UPDATE / INSERT OR IGNORE.');
  console.log('Prepared '+defs.length+' block definitions and '+defaults.blocks.length+' default CMS blocks.');
  process.exit(0);
}
const dir = await mkdtemp(join(tmpdir(),'theme-footer-seed-'));
try {
  const file=join(dir,'seed-footer.sql');
  await writeFile(file,statement);
  const result=spawnSync('npx',['wrangler','d1','execute',database,'--remote','--file',file],{encoding:'utf8',maxBuffer:3e6});
  if (result.status!==0) throw new Error('footer CMS seed failed: '+(result.stderr||result.stdout));
  console.log('Seeded global footer CMS definitions and blocks in '+database+'; pre-existing block edits preserved.');
} finally {await rm(dir,{recursive:true,force:true});}
