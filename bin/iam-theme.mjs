#!/usr/bin/env node
// Download and inspect immutable theme distributions. No write to CMS in this CLI.
import { createHash } from 'node:crypto';
import { writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
const base = (process.env.IAM_THEME_STORE_URL || 'https://themes.inneranimalmedia.com').replace(/\/$/,'');
const [command,slug,...rest] = process.argv.slice(2);
async function get(path){
 const res=await fetch(base+path,{headers:{accept:'application/json'}});
 const data=await res.json().catch(()=>null);
 if(!res.ok)throw Error((data?.error||'http_error')+': '+res.status);
 return data;
}
try {
 if(command==='catalog') {
  const {products}=await get('/api/catalog');
  for(const p of products) console.log([p.slug,p.version,p.category,p.release.status,p.downloadReady?'downloadable':'preview-only'].join('\t'));
 } else if(command==='inspect'&&slug) {
  console.log(JSON.stringify((await get('/api/themes/'+encodeURIComponent(slug))).product,null,2));
 } else if(command==='download'&&slug) {
  const {product}=await get('/api/themes/'+encodeURIComponent(slug));
  if(!product.downloadReady)throw Error('Not published for download: '+slug);
  const manifest=await get('/api/themes/'+encodeURIComponent(slug)+'/'+encodeURIComponent(product.version)+'/manifest.json');
  if(!/^[a-f0-9]{64}$/.test(manifest.sha256))throw Error('Invalid SHA-256 release digest');
  const index=rest.indexOf('--out');
  const output=resolve(index>=0?rest[index+1]||'':manifest.filename);
  const response=await fetch(base+manifest.downloadUrl);
  if(!response.ok)throw Error('Download failed: HTTP '+response.status);
  const bytes=Buffer.from(await response.arrayBuffer());
  const actual=createHash('sha256').update(bytes).digest('hex');
  if(actual!==manifest.sha256)throw Error('Checksum mismatch. File NOT saved.');
  try { await writeFile(output,bytes,{flag:'wx'}); }
  catch(err) { if(err?.code==='EEXIST')throw Error('Output exists; choose another --out path'); throw err; }
  console.log('Verified SHA-256 '+actual+'\nSaved '+output);
 } else {
  console.log('Usage: iam-theme catalog | iam-theme inspect <slug> | iam-theme download <slug> [--out file.zip]');
  process.exitCode=command?2:0;
 }
} catch(err) { console.error(err instanceof Error?err.message:String(err)); process.exitCode=1; }
