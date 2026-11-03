#!/usr/bin/env node
/**
 * Publish the Theme Store's editable copy + tokens (no redeploy needed).
 *
 * Source of truth: the store's cms_sites row, `settings_json.store`.
 * The document is validated against src/site.default.json (invalid or unknown
 * values are dropped), then written to R2 at site/store-site.json, which the
 * Worker serves at /api/site.
 *
 *   node scripts/publish-site.mjs --database <d1-name> [--slug theme-store]
 *   node scripts/publish-site.mjs --file my-site.json [--local]   # testing
 */
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { resolveSite } from '../src/site.mjs';

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf('--' + name); return i === -1 ? undefined : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const slug = flag('slug') || 'theme-store';
const database = flag('database');
const file = flag('file');
const local = flag('local') === true;
if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('--slug must match [a-z0-9-]+');
if (!database && !file) throw new Error('pass --database <d1 name> (reads cms_sites) or --file <json>');

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', d => out += d); child.stderr.on('data', d => err += d);
    child.on('close', code => code === 0 ? resolve(out) : reject(new Error(cmd + ' ' + cmdArgs.join(' ') + ' failed (' + code + '): ' + err.trim())));
  });
}

const wranglerConfig = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
const bucket = wranglerConfig.r2_buckets?.find(entry => entry.binding === 'THEME_PACKAGES')?.bucket_name;
if (!bucket) throw new Error('wrangler.jsonc has no THEME_PACKAGES R2 binding');
const defaults = JSON.parse(await readFile(new URL('../src/site.default.json', import.meta.url), 'utf8'));

let override;
if (file) {
  override = JSON.parse(await readFile(file, 'utf8'));
} else {
  const raw = await run('npx', ['wrangler', 'd1', 'execute', database, '--remote', '--json', '--command',
    "SELECT settings_json FROM cms_sites WHERE slug = '" + slug + "' LIMIT 1"]);
  const row = JSON.parse(raw)?.[0]?.results?.[0];
  if (!row) throw new Error('no cms_sites row with slug ' + slug + ' in ' + database);
  override = JSON.parse(row.settings_json || '{}').store;
  if (!override) throw new Error('cms_sites.settings_json has no "store" key for ' + slug);
}

const site = resolveSite(defaults, override);
const dir = await mkdtemp(join(tmpdir(), 'store-site-'));
try {
  const out = join(dir, 'store-site.json');
  await writeFile(out, JSON.stringify(site, null, 2) + '\n');
  const key = bucket + '/site/store-site.json';
  await run('npx', ['wrangler', 'r2', 'object', 'put', key, local ? '--local' : '--remote', '--file', out, '--content-type', 'application/json']);
  const back = join(dir, 'back.json');
  await run('npx', ['wrangler', 'r2', 'object', 'get', key, local ? '--local' : '--remote', '--file', back]);
  if ((await readFile(back, 'utf8')) !== (await readFile(out, 'utf8'))) throw new Error('round-trip verification failed');
  console.log('site: published ' + key + ' (verified). Live within ~60s at /api/site');
} finally { await rm(dir, { recursive: true, force: true }); }
