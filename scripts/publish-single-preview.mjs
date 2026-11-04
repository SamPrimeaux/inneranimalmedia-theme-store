#!/usr/bin/env node
/**
 * Publish ONE versioned theme preview to THEME_PACKAGES without rebuilding
 * unrelated packages or rewriting a published release's immutable assets.
 * Usage: node scripts/publish-single-preview.mjs iasf
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm, writeFile, lstat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildCatalog } from './build-catalog.mjs';

const slug = process.argv[2];
if (!/^[a-z0-9-]+$/.test(slug || '')) throw Error('Supply one theme slug: e.g. iasf');
const catalog = await buildCatalog(join(process.cwd(), 'packages'));
const theme = catalog.find(item => item.slug === slug);
if (!theme) throw Error('Theme is absent from the canonical catalog: ' + slug);
if (theme.previewBuild === 'external') throw Error('External-source packages have their own publish path');
const wrangler = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
const bucket = wrangler.r2_buckets?.find(item => item.binding === 'THEME_PACKAGES')?.bucket_name;
if (!bucket) throw Error('THEME_PACKAGES must bind an R2 bucket');
const prefix = '/theme-packages/' + slug + '/' + theme.version + '/preview/';
const key = name => bucket + prefix + name;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const types = { html:'text/html', js:'text/javascript', css:'text/css', json:'application/json', svg:'image/svg+xml', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp', woff2:'font/woff2', ico:'image/x-icon' };
function wranglerCall(args, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['wrangler', ...args], { stdio: capture ? ['ignore','pipe','pipe'] : 'inherit' });
    let stdout = '', stderr = '';
    if (capture) {
      child.stdout.on('data', chunk => stdout += chunk.toString());
      child.stderr.on('data', chunk => stderr += chunk.toString());
    }
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stdout) : reject(Error('Wrangler failed: ' + args.join(' ') + '\n' + stderr)));
  });
}
async function walk(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes:true })) {
    const filename = join(root, entry.name);
    const info = await lstat(filename);
    if (info.isSymbolicLink()) throw Error('Symlink prohibited in release: ' + filename);
    if (info.isDirectory()) files.push(...await walk(filename));
    else if (info.isFile()) files.push(filename);
  }
  return files;
}
async function pool(tasks, concurrency, handler) {
  const queue = tasks.slice();
  await Promise.all(Array.from({length: concurrency}, async () => {
    while (queue.length) await handler(queue.shift());
  }));
}
const tmp = await mkdtemp(join(tmpdir(), 'iam-theme-single-'));
try {
  const output = join(tmp, 'preview');
  const entry = await import(pathToFileURL(join(process.cwd(), 'packages', 'theme-' + slug, 'src', 'node.js')).href);
  entry.materializePrebuild(output, {basePath:prefix});
  const files = (await walk(output)).map(file => ({ file, name:relative(output,file).split(sep).join('/') })).sort((a,b)=>a.name.localeCompare(b.name));
  if (!files.some(item => item.name === 'index.html')) throw Error('No package home page');
  const digests = await Promise.all(files.map(async item => ({ path:item.name, sha256:hash(await readFile(item.file)) })));
  const manifest = Buffer.from(JSON.stringify({ schema:'iam.theme-preview-files.v1', slug, version:theme.version, files:digests }, null, 2) + '\n');
  const remoteManifest = join(tmp, 'remote-manifest.json');
  try {
    await wranglerCall(['r2','object','get',key('preview-files.json'),'--remote','--file',remoteManifest], true);
    const prior = await readFile(remoteManifest);
    if (hash(prior) !== hash(manifest)) throw Error('Immutable version differs: increment package.json version before publishing');
    console.log('Already published and verified:', prefix);
    process.exit(0);
  } catch (error) {
    const message = String(error.message || error);
    if (!/specified key does not exist|NoSuchKey|not found|404/i.test(message)) throw error;
    // A verified missing manifest means this exact release has not been completed.
  }
  console.log('Publishing', slug, theme.version, 'to THEME_PACKAGES:', files.length, 'files');
  await pool(files, 4, async item => {
    const ext = item.name.split('.').pop()?.toLowerCase();
    await wranglerCall(['r2','object','put',key(item.name),'--remote','--file',item.file,'--content-type',types[ext] || 'application/octet-stream']);
  });
  const remoteIndex = join(tmp, 'verify-index.html');
  await wranglerCall(['r2','object','get',key('index.html'),'--remote','--file',remoteIndex], true);
  if (hash(await readFile(remoteIndex)) !== hash(await readFile(join(output,'index.html')))) throw Error('R2 index SHA mismatch');
  const localManifest = join(tmp, 'manifest.json');
  await writeFile(localManifest, manifest);
  await wranglerCall(['r2','object','put',key('preview-files.json'),'--remote','--file',localManifest,'--content-type','application/json']);
  await wranglerCall(['r2','object','get',key('preview-files.json'),'--remote','--file',remoteManifest], true);
  if (hash(await readFile(remoteManifest)) !== hash(manifest)) throw Error('R2 manifest verification failed');
  console.log('VERIFIED:', prefix, '| CMS installation not claimed');
} finally {
  await rm(tmp, {recursive:true,force:true});
}
