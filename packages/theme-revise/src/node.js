/* The Theme Store owns the prebuilt Revise theme snapshot and R2 distribution. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const SOURCE = fileURLToPath(new URL('../site/', import.meta.url));
const PACKAGED_BASE = '/theme-packages/revise/0.1.0/preview/';
const TEXT_EXT = new Set(['.html','.js','.css','.json','.svg']);
function normalizeBasePath(input = '/') {
  let base = String(input || '/');
  if (!base.startsWith('/')) base = '/' + base;
  if (!base.endsWith('/')) base += '/';
  if (base.includes('..') || /[?#]/.test(base)) throw new TypeError('Invalid theme preview path');
  return base.replace(/\/{2,}/g,'/');
}
function walk(root) {
  const files = [];
  for (const item of fs.readdirSync(root,{withFileTypes:true})) {
    const file=path.join(root,item.name);
    if(item.isSymbolicLink()) throw new Error('Symlinks are not allowed in published theme previews');
    if(item.isDirectory()) files.push(...walk(file));
    else if(item.isFile()) files.push(file);
  }
  return files;
}
export function resolvePrebuildRoot(){return SOURCE;}
export function materializePrebuild(target,options={}){
  if(!target) throw new TypeError('target is required');
  const destination=path.resolve(target);
  const basePath=normalizeBasePath(options.basePath||'/');
  fs.rmSync(destination,{recursive:true,force:true});
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.cpSync(SOURCE,destination,{recursive:true});
  for(const file of walk(destination)){
    if(!TEXT_EXT.has(path.extname(file)))continue;
    let source=fs.readFileSync(file,'utf8');
    if(basePath!==PACKAGED_BASE)source=source.replaceAll(PACKAGED_BASE,basePath);
    fs.writeFileSync(file,source);
  }
  return {destination,basePath,theme:'revise',previewOnly:true};
}
