import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/worker.ts',import.meta.url),'utf8');

test('Theme Store serves immutable published preview files as raw bytes without changing browser previews',()=>{
 assert.match(src,/url\.searchParams\.get\('raw'\) === '1'/);
 assert.match(src,/contentFile !== 'preview-files\.json'/);
 assert.match(src,/application\/octet-stream/);
 assert.match(src,/no-transform/);
 assert.match(src,/new Response\(method === 'HEAD' \? null : object\.body/);
 assert.match(src,/normalizePreviewHtml/);
});
