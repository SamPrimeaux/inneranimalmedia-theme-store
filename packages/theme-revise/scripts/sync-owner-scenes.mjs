/**
 * Import real scene sources from the PrimeTech creative showcase into the
 * Revise owner's optional experience pack. Does not rewrite the source repo.
 * Usage: node sync-owner-scenes.mjs <absolute-source-showcase-directory>
 *
 * The portable stock theme deliberately excludes owner-scenes unless
 * materializePrebuild({ includeOwnerScenes: true }) is used.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(process.argv[2] || '');
const out = path.resolve(here, '../site/owner-scenes');
const esbuild = path.join(source, 'node_modules/.bin/esbuild');
if (!process.argv[2] || !fs.existsSync(esbuild)) {
  throw new Error('Pass the locally installed PrimeTech showcase directory (with esbuild and Three.js).');
}
const read = rel => fs.readFileSync(path.join(source, rel), 'utf8');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
fs.mkdirSync(out, { recursive: true });
const copied = [];
function importAsset(relativeSource, relativeOutput) {
  const file = path.join(source, relativeSource);
  if (!fs.existsSync(file)) throw new Error('Missing original scene asset: ' + file);
  const bytes = fs.readFileSync(file);
  const target = path.join(out, relativeOutput);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes);
  copied.push({ path: relativeOutput, sha256: sha(bytes), bytes: bytes.length });
}
const sourceFiles = [
  ['public/glb/inneranimalmediafooterglb.glb', 'glb/inneranimalmediafooterglb.glb'],
  ['public/scenes/original-4341/original-4341.iamscene.json', 'scenes/original-4341/original-4341.iamscene.json'],
  ...['battery-shell', 'lightning', 'circuit-traces', 'battery-core'].map(id => [
    'public/scenes/original-4341/assets/' + id + '.gltf',
    'scenes/original-4341/assets/' + id + '.gltf'
  ]),
  ...['geaux', 'meaux'].map(id => [
    'public/companions/' + id + '/avatars/' + id + '-portrait-256.png',
    'companions/' + id + '/avatars/' + id + '-portrait-256.png'
  ]),
  ['public/work/agentsam-studio.png', 'editorial/agentsam-studio.png'],
  ['public/work/native-bim.jpg', 'editorial/native-bim.jpg'],
  ['public/work/resolve.png', 'editorial/resolve.png'],
  ['public/work/moviemode.jpg', 'editorial/moviemode.jpg']
];
for (const [src, dst] of sourceFiles) importAsset(src, dst);
const html = read('index.html');
const sections = [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"[^>]*\bdata-scene="(\d+)"[\s\S]*?<\/section>/g)];
const plain = str => str.replace(/<[^>]+>/g, ' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const worldSrc = read('src/main.js');
const positions = [...worldSrc.matchAll(/\{p:\[([^\]]+)\],t:\[([^\]]+)\]\}/g)].map(m => ({
  position: m[1].split(',').map(Number),
  target: m[2].split(',').map(Number)
}));
const chapters = sections.map((m,i) => {
  const fragment = m[0];
  const heading = fragment.match(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/);
  const description = fragment.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  return {
    index: Number(m[2]), id: m[1],
    heading: plain(heading?.[1] ?? ''),
    description: plain(description?.[1] ?? ''),
    camera: positions[Number(m[2])] ?? null
  };
});
if (positions.length !== 11 || chapters.length !== 11) {
  throw new Error('Source showcase no longer contains the 11 recognized camera stops and content chapters');
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'revise-scene-build-'));
function bundle(label, input) {
  // Source imports resolve through explicit node-path, retaining Three.js
  // as the real renderer instead of copying a fake canvas animation.
  const entry = path.join(tmp, label + '.mjs');
  const target = path.join(out, label + '.mjs');
  fs.writeFileSync(entry, input);
  execFileSync(esbuild, [
    entry, '--bundle', '--format=esm', '--target=es2022',
    '--platform=browser', '--minify', '--log-level=warning',
    '--outfile=' + target
  ], { stdio: 'inherit', env: { ...process.env, NODE_PATH: path.join(source, 'node_modules') } });
  const bytes = fs.readFileSync(target);
  copied.push({ path: label + '.mjs', sha256: sha(bytes), bytes: bytes.length });
}
try {
  const importThree = "import * as THREE from 'three';";
  const start = worldSrc.indexOf('const $ = (s) => document.querySelector(s);');
  const end = worldSrc.indexOf('const revealObserver=');
  if (start < 0 || end < 0) throw new Error('PrimeTech scene entry has changed; review adapter rather than silently drifting');
  let world = worldSrc.slice(start, end);
  world = world.replace('const $ = (s) => document.querySelector(s);',
    "export function mountReviseWorld(root, { sceneBase } = {}) {\nconst $ = (s) => root.querySelector(s);\nsceneBase = sceneBase || new URL('./', import.meta.url).href;");
  world = world.replace("document.querySelector('.environment')", "root.querySelector('.rr-world-environment')");
  world = world.replace("document.querySelectorAll('.panel')", "root.querySelectorAll('.rr-world-chapter')");
  world = world.replaceAll('import.meta.env.BASE_URL', 'sceneBase');
  world += "\nconst onResize = () => resize();\n" +
    "const onVisibility = () => { if (!document.hidden && !animating) { animating=true; animate(); } else if(document.hidden) animating=false; };\n" +
    "window.addEventListener('resize', onResize, {passive:true});\n" +
    "document.addEventListener('visibilitychange', onVisibility);\n" +
    "init();\nreturn () => { animating=false; window.removeEventListener('resize',onResize); document.removeEventListener('visibilitychange',onVisibility); renderer?.dispose(); };\n}\n";
  bundle('revise-world-runtime', importThree + '\n' + world);

  let circuit = read('src/original-circuit.js');
  circuit = circuit.replace(/from '\.\/vendor\/iamscene\/dist\/src\/index\.js'/,
    "from '" + path.join(source, 'src/vendor/iamscene/dist/src/index.js') + "'");
  circuit = circuit.replace("const stage = document.getElementById('original-circuit-stage');",
    "export function mountReviseCircuit(stage, sceneBase) {");
  circuit = circuit.replaceAll('import.meta.env.BASE_URL', 'sceneBase');
  circuit = circuit.replace('window.__primeTechCircuitScene', 'window.__reviseCircuitScene');
  if (!circuit.includes('  mountScene();\n}')) throw new Error('Native circuit lifecycle changed; cannot adapt safely');
  circuit = circuit.replace('  mountScene();\n}', '  mountScene();\n  return () => dispose();\n}\n}\n');
  bundle('revise-circuit-runtime', circuit);
  bundle('revise-footer-runtime', fs.readFileSync(path.join(here,'owner-footer.entry.mjs'),'utf8'));

  const manifest = {
    schema: 'revise.owner-scene-pack.v1',
    sourceRepository: 'SamPrimeaux/agentsam-3d-studio-primetech',
    sourceExperience: 'experiences/primetech-showcase-v1',
    ownerProfile: 'primetech-inneranimalmedia',
    enabledByDefault: false,
    environment: { renderer: 'Three.js', source: 'src/main.js', runtime: 'revise-world-runtime.mjs', cameraStops: 11 },
    scenes: chapters,
    nativeCircuit: { format: 'iamscene', schemaUri: 'https://schemas.inneranimalmedia.com/iamscene/v1/iamscene.schema.json', source: 'src/original-circuit.js', runtime: 'revise-circuit-runtime.mjs', document: 'scenes/original-4341/original-4341.iamscene.json' },
    footerModel: { format: 'glb', path: 'glb/inneranimalmediafooterglb.glb' },
    files: copied
  };
  fs.writeFileSync(path.join(out, 'scene-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ chapters: chapters.length, realAssets: copied.length, bundledBytes: copied.filter(a => a.path.endsWith('.mjs')).map(a => a.bytes), destination:out },null,2));
} finally {
  fs.rmSync(tmp, { recursive:true, force:true });
}
