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

const SOURCE = fileURLToPath(new URL('../site/', import.meta.url));

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
  for (const filename of allFiles(destination)) {
    if (!filename.endsWith('.html')) continue;
    let html = fs.readFileSync(filename, 'utf8');
    html = html.replaceAll('href="/', 'href="' + basePath)
      .replaceAll('src="/', 'src="' + basePath)
      .replaceAll('action="/', 'action="' + basePath);
    const extras = '<link rel="stylesheet" href="' + basePath +
      'preview-ui.css"><script defer src="' + basePath + 'preview-ui.js"></script>';
    html = html.replace('</head>', extras + '</head>');
    fs.writeFileSync(filename, html);
  }
  fs.writeFileSync(path.join(destination, 'site-data.json'),
    JSON.stringify({ products, archetypes, journal, nav, brand }, null, 2) + '\n');
  fs.writeFileSync(path.join(destination, 'cms-starter.json'),
    JSON.stringify(createIasfStarterPackSeed(), null, 2) + '\n');
  return { destination, basePath, theme: 'iasf', previewOnly: true };
}
