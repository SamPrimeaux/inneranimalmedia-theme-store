import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizePreviewHtml, normalizePreviewManifest} from '../src/preview-html.mjs';
import {createHash} from 'node:crypto';

test('preview manifest hashes the exact HTML bytes served by the Worker', async () => {
  const manifest = {
    schema:'iam.theme-preview-files.v1',
    slug:'resolve',
    version:'2.6.13',
    files:[
      {path:'index.html',sha256:'0'.repeat(64)},
      {path:'assets/site.css',sha256:'1'.repeat(64)},
    ],
  };
  const source = '<html><head></head><body><img src="./theme-packages/resolve/2.6.13/preview/a.svg"></body></html>';
  const output = await normalizePreviewManifest(manifest, source, 'resolve', '2.6.13');
  const served = normalizePreviewHtml(source, 'resolve', '2.6.13');
  const expected = createHash('sha256').update(served).digest('hex');
  assert.equal(output.files.find(file => file.path === 'index.html').sha256, expected);
  assert.equal(output.files.find(file => file.path === 'assets/site.css').sha256, '1'.repeat(64));
  assert.equal(manifest.files[0].sha256, '0'.repeat(64));
});

test('preview manifest rejects mismatched identity and missing index', async () => {
  const wrong = {schema:'iam.theme-preview-files.v1',slug:'other',version:'2.6.13',files:[]};
  await assert.rejects(normalizePreviewManifest(wrong,'<html/>','resolve','2.6.13'), /identity/);
  const noIndex = {schema:'iam.theme-preview-files.v1',slug:'resolve',version:'2.6.13',files:[]};
  await assert.rejects(normalizePreviewManifest(noIndex,'<html/>','resolve','2.6.13'), /index/);
});
