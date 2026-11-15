#!/usr/bin/env node
/**
 * Stage the canonical IAPJ prebuild inside the Theme Store Worker Assets bundle.
 * This is a build-only copy, NOT a second source tree or a customer CMS install.
 * The public URL is /iapj/; no R2 credentials or npm publish are required.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'packages/theme-plain-jane/site');
const dest=path.join(root,'dist/iapj');
const oldBase='/themes/plain-jane/demo/';
const newBase='/iapj/';
const editable=new Set(['.html','.js','.css','.json','.svg','.webmanifest','.md','.txt']);

if(!fs.existsSync(path.join(source,'index.html')) ||
   !fs.existsSync(path.join(source,'iapj-cms-manifest.json'))) {
  throw new Error('IAPJ canonical compiled site missing; refuse to ship the legacy Plain Jane preview');
}
const manifest=JSON.parse(fs.readFileSync(path.join(source,'iapj-cms-manifest.json'),'utf8'));
if(manifest.theme!=='plain-jane' || manifest.sourceTheme!=='iapj' ||
   manifest.preview_only!==true || manifest.pages.length<25) {
  throw new Error('IAPJ manifest does not match reviewed authored source');
}
fs.rmSync(dest,{recursive:true,force:true});
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.cpSync(source,dest,{recursive:true,errorOnExist:true,force:false,filter:file=>{
  if(fs.lstatSync(file).isSymbolicLink())throw new Error('Symlink not permitted in IAPJ compiled preview');
  return true;
}});
let count=0,rewrites=0;
const stack=[dest];
while(stack.length){
  const dir=stack.pop();
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()){stack.push(file);continue;}
    count++;
    if(!editable.has(path.extname(entry.name)))continue;
    const original=fs.readFileSync(file,'utf8');
    const updated=original.replaceAll(oldBase,newBase);
    if(original!==updated){fs.writeFileSync(file,updated);rewrites++;}
    if(updated.includes(oldBase))throw new Error('Old IAPJ base path remains in '+file);
  }
}
const html=fs.readFileSync(path.join(dest,'index.html'),'utf8');
if(!/\/iapj\/assets\//.test(html))throw new Error('Public IAPJ HTML does not resolve its compiled assets');
if(!fs.existsSync(path.join(dest,'assets')))throw new Error('IAPJ visual assets are missing');
console.log(JSON.stringify({publicRoute:'/iapj/',compiledFiles:count,rewrittenFiles:rewrites,authoredPages:manifest.pages.length}));
