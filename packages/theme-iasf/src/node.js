/**
 * IASF's reviewed storefront snapshot is owned by the Theme Store package.
 * This materializer publishes HTML/CSS and interaction layer to R2 with
 * portable links under a versioned preview base path.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, archetypes, journal, nav, brand } from './content.js';
import { createIasfStarterPackSeed } from './index.js';
import {
  shellDefaults, mergeShellConfig, renderHeader, renderFooter,
  renderRuntimeConfig, renderLoaderGate, RUNTIME_SCRIPTS,
} from './shell/index.js';

const SOURCE = fileURLToPath(new URL('../site/', import.meta.url));
const RUNTIME = fileURLToPath(new URL('./runtime/', import.meta.url));
const VENDOR = fileURLToPath(new URL('./vendor/', import.meta.url));

function normalizeBasePath(input = '/') {
  let value = String(input || '/').trim();
  if (!value.startsWith('/')) value = '/' + value;
  if (!value.endsWith('/')) value += '/';
  if (value.includes('..') || /[?#]/.test(value)) throw new TypeError('Invalid preview base path');
  return value.replace(/\/{2,}/g, '/');
}
function allFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const name = path.join(root, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Theme packages cannot include symlinks: ' + name);
    if (entry.isDirectory()) files.push(...allFiles(name));
    else if (entry.isFile()) files.push(name);
  }
  return files;
}
export function resolvePrebuildRoot() { return SOURCE; }
export function materializePrebuild(target, options = {}) {
  if (!target) throw new TypeError('target is required');
  const destination = path.resolve(target);
  const basePath = normalizeBasePath(options.basePath || '/');
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(SOURCE, destination, { recursive: true });
  // CSS is owned by src/styles, not duplicated in the materialized site snapshot.
  fs.copyFileSync(fileURLToPath(new URL('./styles/storefront.css', import.meta.url)),
    path.join(destination, 'storefront.css'));
  // Runtime (header motion, Join the Pack, toasts, footer, loader) and lazy vendor assets
  // are owned by src/, never duplicated in the checked-in site snapshot.
  fs.cpSync(RUNTIME, path.join(destination, 'runtime'), { recursive: true });
  fs.cpSync(VENDOR, path.join(destination, 'vendor'), { recursive: true });

  // One shell config renders every page. Static demos simulate the signup round trip;
  // pass { shell: { pack: { mode: 'live' } } } for a real endpoint.
  const shell = mergeShellConfig({ pack: { mode: 'preview' }, ...(options.shell || {}) });
  const year = options.year || new Date().getUTCFullYear();
  const headerHtml = renderHeader(shell.header);
  const footerHtml = renderFooter(shell.footer, { year });
  const runtimeTags = RUNTIME_SCRIPTS.map((n) => '<script defer src="/runtime/' + n + '.js"></script>').join('');
  const extras =
    renderLoaderGate(shell.loader) +
    renderRuntimeConfig(shell) +
    '<link rel="stylesheet" href="/preview-ui.css"><script defer src="/preview-ui.js"></script>' +
    runtimeTags;

  for (const filename of allFiles(destination)) {
    if (!filename.endsWith('.html')) continue;
    let html = fs.readFileSync(filename, 'utf8');
    html = html.replace('<!--iasf:header-->', () => headerHtml).replace('<!--iasf:footer-->', () => footerHtml);
    html = html.replace('</head>', () => extras + '</head>');
    html = html.replaceAll('href="/', 'href="' + basePath)
      .replaceAll('src="/', 'src="' + basePath)
      .replaceAll('action="/', 'action="' + basePath)
      .replaceAll("url('/", "url('" + basePath);
    fs.writeFileSync(filename, html);
  }
  fs.writeFileSync(path.join(destination, 'site-data.json'),
    JSON.stringify({ products, archetypes, journal, nav, brand }, null, 2) + '\n');
  fs.writeFileSync(path.join(destination, 'cms-starter.json'),
    JSON.stringify(createIasfStarterPackSeed(), null, 2) + '\n');
  return { destination, basePath, theme: 'iasf', previewOnly: true, shell: { packMode: shell.pack.mode } };
}
