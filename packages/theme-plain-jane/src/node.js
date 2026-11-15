import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Immutable IAPJ prebuild source. Installation never mutates the package. */
const SOURCE=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../site');
const BUILD_BASE='/themes/plain-jane/demo/';
const TEXT_EXTENSIONS=new Set(['.js','.css','.html','.json','.svg','.txt','.webmanifest']);
export function resolvePrebuildRoot(){return SOURCE;}

export function materializePrebuild(target,options={}){
  if(!target)throw new TypeError('target is required');
  const destination=path.resolve(target);
  const segments=String(options.basePath||'/').split('/').filter(Boolean);
  const basePath=segments.length?'/'+segments.join('/')+'/':'/';
  if(!/^\/(?:[a-zA-Z0-9._~-]+\/)*$/.test(basePath))throw new Error('Invalid base path');
  if(destination===SOURCE)throw new Error('Source cannot be overwritten');
  if(fs.existsSync(destination)&&options.overwrite!==true)
    throw new Error('Destination already exists. Installation must not overwrite a site without explicit authorization.');
  const manifestPath=path.join(SOURCE,'iapj-cms-manifest.json');
  if(!fs.existsSync(path.join(SOURCE,'index.html'))||!fs.existsSync(manifestPath))
    throw new Error('IAPJ prebuild incomplete: site and CMS source manifest are required');
  const staging=destination+'.staging-'+process.pid;
  fs.rmSync(staging,{recursive:true,force:true});
  try{
    fs.mkdirSync(path.dirname(staging),{recursive:true});
    fs.cpSync(SOURCE,staging,{recursive:true});
    const stack=[staging];
    while(stack.length){
      const dir=stack.pop();
      for(const item of fs.readdirSync(dir,{withFileTypes:true})){
        if(item.isSymbolicLink())throw new Error('Symlink not permitted in compiled IAPJ package');
        const file=path.join(dir,item.name);
        if(item.isDirectory()){stack.push(file);continue;}
        if(!TEXT_EXTENSIONS.has(path.extname(item.name)))continue;
        const original=fs.readFileSync(file,'utf8');
        const transformed=original.replaceAll(BUILD_BASE,basePath);
        if(transformed!==original)fs.writeFileSync(file,transformed);
      }
    }
    const manifest=JSON.parse(fs.readFileSync(path.join(staging,'iapj-cms-manifest.json'),'utf8'));
    if(manifest.schema!=='agentsam.cms-source-manifest.v1'||manifest.theme!=='plain-jane'||manifest.editorProject!=='install-project.json')
      throw new Error('IAPJ editable theme source contract invalid');
    if(!Array.isArray(manifest.pages)||!manifest.pages.length)throw new Error('IAPJ page manifest missing');
    const index=fs.readFileSync(path.join(staging,'index.html'));
    const paths=new Set();
    for(const page of manifest.pages){
      if(typeof page.path!=='string'||(!/^[a-z0-9/-]*$/.test(page.path))||page.path.includes('//')||page.path.includes('..'))
        throw new Error('Invalid IAPJ route in manifest');
      if(!page.path)continue;
      if(paths.has(page.path))throw new Error('Duplicate IAPJ route: '+page.path);
      paths.add(page.path);
      const routeDir=path.join(staging,page.path);
      fs.mkdirSync(routeDir,{recursive:true});
      fs.writeFileSync(path.join(routeDir,'index.html'),index);
    }
    fs.rmSync(destination,{recursive:true,force:true});
    fs.renameSync(staging,destination);
    return {theme:'plain-jane',source:'iapj',destination,basePath,pages:manifest.pages.length};
  }catch(error){fs.rmSync(staging,{recursive:true,force:true});throw error;}
}
