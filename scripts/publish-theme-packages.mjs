#!/usr/bin/env node
/**
 * Publish reviewed, versioned theme-package live previews to private R2.
 * Designed for the Cloudflare Worker Builds deployment command, or a
 * separately authenticated operator laptop. No editable CMS state lives here.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, lstat, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const product = {
  slug: 'plain-jane',
  version: '0.1.0',
  repo: 'https://github.com/SamPrimeaux/inneranimalmedia-blog-template.git',
  commit: 'c0bb3267265d0c30ea502d451cb46610d4651c7c',
};
const prefix = '/theme-packages/' + product.slug + '/' + product.version + '/preview/';
const bucket = 'theme-store';
const deploy = process.argv.includes('--deploy');

function run(bin, args, cwd = process.cwd(), capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd,
      env: process.env,
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    });
    let output = '';
    if (capture) child.stdout.setEncoding('utf8').on('data', chunk => output += chunk);
    child.on('error', reject);
    child.on('close', code =>
      code === 0 ? resolve(output.trim()) : reject(new Error(bin + ' exited ' + code))
    );
  });
}
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    const path = join(dir, entry.name);
    const st = await lstat(path);
    if (st.isSymbolicLink()) throw new Error('Refusing symlink in compiled preview: ' + path);
    if (st.isDirectory()) files.push(...await walk(path));
    else if (st.isFile()) files.push(path);
  }
  return files;
}
const mediaType = (name) => {
  const ext = name.split('.').at(-1)?.toLowerCase();
  return ({
    html:'text/html', js:'text/javascript', css:'text/css',
    json:'application/json', svg:'image/svg+xml',
    webp:'image/webp', png:'image/png', jpg:'image/jpeg',
    jpeg:'image/jpeg', avif:'image/avif', woff:'font/woff',
    woff2:'font/woff2', ico:'image/x-icon',
  })[ext] ?? 'application/octet-stream';
};

const root = await mkdtemp(join(tmpdir(), 'iam-theme-publish-'));
const source = join(root, product.slug);
try {
  console.log('Fetching reviewed theme-package source:', product.slug, product.commit);
  await run('git', ['init', '-q', source]);
  await run('git', ['remote', 'add', 'origin', product.repo], source);
  await run('git', ['fetch', '--depth', '1', 'origin', product.commit], source);
  await run('git', ['checkout', '--detach', '-q', 'FETCH_HEAD'], source);
  const actualCommit = await run('git', ['rev-parse', 'HEAD'], source, true);
  if (actualCommit !== product.commit) throw new Error('Unexpected source commit, aborting');
  await run('npm', ['ci', '--no-audit', '--no-fund'], source);
  await run('npm', ['run', 'lint'], source);
  await run('npm', ['run', 'build', '--', '--base', prefix], source);
  const compiled = join(source, 'dist');
  const indexFile = join(compiled, 'index.html');
  const html = await readFile(indexFile, 'utf8');
  if (!html.includes(prefix)) throw new Error('Compiled preview has wrong base URL');
  await readFile(join(compiled, 'icons', 'app-logo.svg'));
  await readFile(join(compiled, 'images', 'cover-slow-travel.svg'));

  console.log('Verifying standalone Theme Store build');
  await run('npm', ['run', 'build']);

  const files = await walk(compiled);
  if (files.length < 5) throw new Error('Built site is suspiciously incomplete');
  console.log('Uploading ' + files.length + ' versioned preview files to R2');
  for (const file of files) {
    const path = relative(compiled, file).split(sep).join('/');
    if (path.startsWith('../') || path.startsWith('/')) throw new Error('Invalid object path');
    const key = bucket + prefix + path;
    await run('npx', ['wrangler', 'r2', 'object', 'put', key, '--remote', '--file', file, '--content-type', mediaType(file)]);
  }

  const downloadedIndex = join(root, 'uploaded-index.html');
  await run('npx', ['wrangler', 'r2', 'object', 'get', bucket + prefix + 'index.html', '--remote', '--file', downloadedIndex]);
  const uploaded = await readFile(downloadedIndex);
  if (createHash('sha256').update(uploaded).digest('hex') !== createHash('sha256').update(html).digest('hex')) {
    throw new Error('R2 HTML round-trip SHA-256 mismatch');
  }
  console.log('Verified R2 preview index and path:', prefix);

  if (deploy) {
    await run('npx', ['wrangler', 'deploy']);
    console.log('Worker deployment submitted; verify public routes independently.');
  } else {
    console.log('Preview uploaded; Worker deployment deliberately not requested.');
  }
} catch (err) {
  console.error('Theme-package publish failed:', err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
} finally {
  await rm(root, {recursive:true, force:true});
}
