#!/usr/bin/env node
/**
 * Publish reviewed, versioned theme-package live previews to private R2.
 * Designed for the Cloudflare Worker Builds deployment command, or a
 * separately authenticated operator laptop. No editable CMS state lives here.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, lstat, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { npmChildEnvironment } from './npm-child-environment.mjs';
import { buildCatalog } from './build-catalog.mjs';

const product = {
  slug: 'plain-jane',
  version: '0.1.0',
  repo: 'https://github.com/SamPrimeaux/inneranimalmedia-blog-template.git',
  commit: 'c0bb3267265d0c30ea502d451cb46610d4651c7c',
};
const prefix = '/theme-packages/' + product.slug + '/' + product.version + '/preview/';
const wranglerConfig = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
const bucket = wranglerConfig.r2_buckets?.find(entry => entry.binding === 'THEME_PACKAGES')?.bucket_name;
if (!bucket) throw new Error('wrangler.jsonc has no THEME_PACKAGES R2 binding');
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
async function pool(items, size, task) {
  const queue = [...items];
  await Promise.all(Array.from({length: size}, async () => { while (queue.length) await task(queue.shift()); }));
}
const deploy = process.argv.includes('--deploy');

function run(bin, args, cwd = process.cwd(), capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd,
      env: bin === 'npm' ? npmChildEnvironment(process.env) : process.env,
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

  // Every other theme publishes its own preview from its own package: each package
  // ships materializePrebuild(target, {basePath}). Versioned keys are immutable, so a
  // preview whose index.html already matches in R2 is skipped. Any failure aborts the
  // run before deploy, leaving the live store untouched.
  const catalog = await buildCatalog(join(process.cwd(), 'packages'));
  for (const theme of catalog) {
    if (theme.previewBuild === 'external') continue; // built from its own source repo above
    const themePrefix = '/theme-packages/' + theme.slug + '/' + theme.version + '/preview/';
    const entry = await import(pathToFileURL(join(process.cwd(), 'packages', 'theme-' + theme.slug, 'src', 'node.js')).href);
    const out = join(root, 'pkg-' + theme.slug);
    entry.materializePrebuild(out, { basePath: themePrefix });
    const index = await readFile(join(out, 'index.html'));
    const themeFiles = await walk(out);
    // The index HTML alone is not a complete preview. Bind the release to every
    // file so newly added images cannot be skipped when index.html is unchanged.
    const fileDigests = await Promise.all(themeFiles.map(async file => ({
      path: relative(out, file).split(sep).join('/'),
      sha256: sha256(await readFile(file)),
    })));
    fileDigests.sort((a,b)=>a.path.localeCompare(b.path));
    const manifest = Buffer.from(JSON.stringify({
      schema: 'iam.theme-preview-files.v1',
      slug: theme.slug, version: theme.version, files: fileDigests,
    }, null, 2) + '\n');
    const manifestKey = bucket + themePrefix + 'preview-files.json';
    const remoteManifest = join(root, 'manifest-' + theme.slug + '.json');
    let previousManifest = null;
    try {
      await run('npx', ['wrangler', 'r2', 'object', 'get', manifestKey,
        '--remote', '--file', remoteManifest], process.cwd(), true);
      previousManifest = await readFile(remoteManifest);
    } catch { /* first publish or legacy preview without a complete-file manifest */ }
    if (previousManifest) {
      if (sha256(previousManifest) !== sha256(manifest)) {
        throw new Error('Immutable preview differs for ' + theme.slug + '@' + theme.version
          + '; bump the package version before publishing changed files');
      }
      console.log('Verified unchanged manifest, skipping:', themePrefix);
      continue;
    }
    console.log('Publishing ' + themeFiles.length + ' files for ' + theme.slug + '@' + theme.version);
    await pool(themeFiles, 6, async (file) => {
      const path = relative(out, file).split(sep).join('/');
      if (path.startsWith('../') || path.startsWith('/')) throw new Error('Invalid object path');
      await run('npx', ['wrangler', 'r2', 'object', 'put', bucket + themePrefix + path,
        '--remote', '--file', file, '--content-type', mediaType(file)]);
    });
    const remoteIndex = join(root, 'remote-' + theme.slug + '.html');
    await run('npx', ['wrangler', 'r2', 'object', 'get',
      bucket + themePrefix + 'index.html', '--remote', '--file', remoteIndex], process.cwd(), true);
    if (sha256(await readFile(remoteIndex)) !== sha256(index)) {
      throw new Error('R2 index round-trip mismatch for ' + theme.slug);
    }
    // Manifest is the last write: its existence indicates a completed release.
    const localManifest = join(root, 'local-manifest-' + theme.slug + '.json');
    await writeFile(localManifest, manifest);
    await run('npx', ['wrangler', 'r2', 'object', 'put', manifestKey,
      '--remote', '--file', localManifest, '--content-type', 'application/json']);
    await run('npx', ['wrangler', 'r2', 'object', 'get', manifestKey,
      '--remote', '--file', remoteManifest], process.cwd(), true);
    if (sha256(await readFile(remoteManifest)) !== sha256(manifest)) {
      throw new Error('R2 manifest round-trip mismatch for ' + theme.slug);
    }
    console.log('Verified complete immutable R2 preview:', themePrefix);
  }

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
