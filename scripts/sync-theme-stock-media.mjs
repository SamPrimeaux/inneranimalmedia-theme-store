import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const theme = option('--theme', '');
const collection = option('--collection', '');
const check = args.includes('--check');
if (!/^[a-z][a-z0-9-]*$/.test(theme) || !/^[a-z][a-z0-9-]*$/.test(collection)) {
  console.error('Usage: node scripts/sync-theme-stock-media.mjs --theme <slug> --collection <slug> [--check]');
  process.exit(2);
}
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'stock-media/catalog.json'), 'utf8'));
const selected = catalog.assets.filter(item => item.collection === collection);
if (!selected.length) throw new Error('Unknown stock-media collection: ' + collection);
const target = path.join(root, 'packages', 'theme-' + theme, 'site', 'assets', 'stock', collection);
if (!fs.existsSync(path.join(root, 'packages', 'theme-' + theme, 'package.json'))) {
  throw new Error('Unknown destination theme: ' + theme);
}
const receipt = { schema: 'iam.theme-stock-usage.v1', theme, collection, usage: catalog.usage, assets: [] };
let checked = 0;
for (const item of selected) {
  if (!/^packages\/theme-[a-z0-9-]+\/site\/assets\/generated\/[a-z0-9.-]+\.webp$/.test(item.source) ||
      !/^[a-z0-9-]+\.webp$/.test(item.filename)) throw new Error('Unsafe stock path for ' + item.id);
  const source = path.join(root, item.source);
  const output = path.join(target, item.filename);
  const digest = data => crypto.createHash('sha256').update(data).digest('hex');
  if (digest(fs.readFileSync(source)) !== item.sha256) throw new Error('Canonical stock source changed: ' + item.id);
  if (!check) {
    fs.mkdirSync(target, { recursive: true });
    fs.copyFileSync(source, output);
  }
  if (!fs.existsSync(output) || digest(fs.readFileSync(output)) !== item.sha256) throw new Error('Missing or mismatched vendored stock: ' + output);
  receipt.assets.push({ id: item.id, source: item.source, path: 'assets/stock/' + collection + '/' + item.filename, sha256: item.sha256, width: item.width, height: item.height });
  checked += 1;
}
const receiptPath = path.join(target, 'stock-manifest.json');
if (check) {
  if (!fs.existsSync(receiptPath) || JSON.stringify(JSON.parse(fs.readFileSync(receiptPath,'utf8'))) !== JSON.stringify(receipt)) throw new Error('Stock usage manifest is stale: '+receiptPath);
} else {
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
}
console.log(JSON.stringify({ theme, collection, checked, mode: check ? 'verified' : 'synced', target }, null, 2));
