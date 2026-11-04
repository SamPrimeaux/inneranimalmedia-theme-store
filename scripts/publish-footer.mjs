#!/usr/bin/env node
// Publish a verified projection of the existing CMS footer section to the
// Theme Store's R2 site snapshot. The public Worker has no D1 write binding.
import { readFile,writeFile,mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { footerFromCmsRows } from '../src/footer.mjs';
const args=process.argv.slice(2);
const database=args.includes('--database')?args[args.indexOf('--database')+1]:'inneranimalmedia-business';
const local=args.includes('--local');
if (!/^[a-zA-Z0-9_-]+$/.test(database)) throw new Error('invalid D1 database');
const run=(command,argv)=>{
  const r=spawnSync(command,argv,{encoding:'utf8',maxBuffer:8e6});
  if(r.status!==0)throw new Error(command+' '+argv.join(' ')+' failed: '+(r.stderr||r.stdout));
  return r.stdout;
};
const query=sql=>{
  const raw=run('npx',['wrangler','d1','execute',database,local?'--local':'--remote','--json','--command',sql]);
  const data=JSON.parse(raw);
  return data[0]?.results??[];
};
const section=query("SELECT id,section_type,section_data FROM cms_page_sections WHERE id='cmss_cmsp_theme_store_site_shell_footer' AND is_visible=1 LIMIT 1")[0];
if(!section)throw new Error('published global footer section missing; no R2 data written');
const rows=query("SELECT b.block_key,b.block_type,b.sort_order,b.settings_json,p.block_key AS parent_block_key FROM cms_section_blocks b LEFT JOIN cms_section_blocks p ON p.id=b.parent_block_id WHERE b.section_id='cmss_cmsp_theme_store_site_shell_footer' AND b.status='active' ORDER BY b.sort_order,b.block_key");
if(rows.length<10)throw new Error('footer CMS blocks missing/incomplete ('+rows.length+'); seed and verify first');
const footer=footerFromCmsRows(section,rows);
if(footer.blocks.length!==rows.length)throw new Error('footer schema rejected one or more blocks; publication cancelled');
const wrangler=JSON.parse((await readFile('wrangler.jsonc','utf8')).replace(/^\s*\/\/.*$/gm,''));
const bucket=wrangler.r2_buckets?.find(x=>x.binding==='THEME_PACKAGES')?.bucket_name;
if(!bucket)throw new Error('THEME_PACKAGES R2 bucket missing from wrangler.jsonc');
const key=bucket+'/site/theme-store-footer.json';
const dir=await mkdtemp(join(tmpdir(),'theme-footer-publish-'));
try {
 const file=join(dir,'footer.json'),back=join(dir,'roundtrip.json');
 const data=JSON.stringify(footer,null,2)+'\n';
 await writeFile(file,data);
 run('npx',['wrangler','r2','object','put',key,local?'--local':'--remote','--file',file,'--content-type','application/json']);
 run('npx',['wrangler','r2','object','get',key,local?'--local':'--remote','--file',back]);
 if(await readFile(back,'utf8')!==data)throw new Error('R2 round-trip mismatch');
 console.log('Published validated CMS footer: '+footer.blocks.length+' editable blocks → '+key);
}finally{await rm(dir,{recursive:true,force:true});}
