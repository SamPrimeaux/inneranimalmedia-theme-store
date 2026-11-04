import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

test('every packaged theme bundles images referenced by its demo', async () => {
  for (const slug of ['cypress','ember','forge','grove','harbor','resolve','summit','violet']) {
    const root = fileURLToPath(new URL('../packages/theme-' + slug + '/site/', import.meta.url));
    const missing = [];
    async function walk(dir) {
      for (const entry of await readdir(dir,{withFileTypes:true})) {
        if (entry.name === 'generated' && entry.isDirectory()) continue;
        const path = join(dir,entry.name);
        if (entry.isDirectory()) { await walk(path); continue; }
        if (!/\.(html|css|js|json)$/.test(entry.name)) continue;
        const source = await readFile(path,'utf8');
        for (const match of source.matchAll(/assets\/generated\/([\w.-]+\.(?:webp|svg|png|jpg|jpeg|avif))/g)) {
          const asset = join(root,'assets','generated',match[1]);
          try { if (!(await stat(asset)).isFile()) missing.push(match[1]); }
          catch { missing.push(match[1]); }
        }
      }
    }
    await walk(root);
    assert.deepEqual([...new Set(missing)],[],slug + ' has unresolved generated media');
  }
});
