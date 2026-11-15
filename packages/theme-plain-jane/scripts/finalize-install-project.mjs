#!/usr/bin/env node
/** Bind the editable project to the exact immutable compiled-site ZIP digest. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const packageRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const packageInfo=JSON.parse(fs.readFileSync(path.join(packageRoot,'package.json'),'utf8'));
const root=path.resolve(packageRoot,'../..');
const zip=path.join(root,'.releases',`plain-jane-${packageInfo.version}.zip`);
if(!fs.existsSync(zip))throw Error('Reviewed immutable IAPJ release ZIP not found');
const hash=crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex');
const projectPath=path.join(packageRoot,'install-project.json');
const project=JSON.parse(fs.readFileSync(projectPath,'utf8'));
if(project.schema!=='agentsam.theme-project.v1'||project.sourceThemeId!=='plain-jane'||
   project.sourcePackageVersion!==packageInfo.version||project.pages.length!==31||
   project.sourcePreviewUrl!=='https://themes.inneranimalmedia.com/iapj/')
  throw Error('Source editor artifact does not match the reviewed authored release');
project.sourceReleaseSha256=hash;
fs.writeFileSync(projectPath,JSON.stringify(project,null,2)+'\n');
const expected='releases/plain-jane/'+packageInfo.version+'/'+hash+'.zip';
console.log(JSON.stringify({slug:'plain-jane',version:packageInfo.version,
  sourceReleaseSha256:hash,storageKey:expected,
  editablePages:project.pages.length,bytes:fs.statSync(projectPath).size}));
