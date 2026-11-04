import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('versioned prebuild HTML never emits doubled relative asset paths', async () => {
  const root = await mkdtemp(join(tmpdir(),'iam-theme-base-'));
  try {
    for (const slug of ['resolve','forge','harbor','violet']) {
      const { materializePrebuild } = await import('../packages/theme-' + slug + '/src/node.js');
      const base = '/theme-packages/' + slug + '/2.6.13/preview/';
      const output = join(root,slug);
      materializePrebuild(output,{basePath:base});
      const html = await readFile(join(output,'index.html'),'utf8');
      assert.ok(!html.includes('.' + base), slug + ' leaves a relative asset prefix');
      assert.ok(html.includes(base), slug + ' lacks its release base');
    }
  } finally { await rm(root,{recursive:true,force:true}); }
});
