import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { materializePrebuild } from '../packages/theme-revise/src/node.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const version = require('../packages/theme-revise/package.json').version;

test('Revise materializes a portable storefront preview at a versioned base path', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'revise-test-'));
  const prefix = '/theme-packages/revise/' + version + '/preview/';
  try {
    const root = join(tmp, 'site');
    const receipt = materializePrebuild(root, { basePath: prefix });
    assert.equal(receipt.basePath, prefix);
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    const script = readFileSync(join(root, 'revise-remaster.js'), 'utf8');
    const css = readFileSync(join(root, 'revise-remaster.css'), 'utf8');
    assert.ok(html.includes(prefix));
    assert.ok(script.includes(prefix));
    assert.ok(css.includes('.rr-menu[data-open="true"]'));
    assert.equal(existsSync(join(root, 'admin')), false, 'Theme release must not bundle admin CMS UI');
    assert.equal(existsSync(join(root, 'assets', 'index-Cain7XPB.css')), false, 'Legacy application bundles must not ship');
    assert.equal(existsSync(join(root, 'assets', 'stock', 'resolve', 'media-216610d365.webp')), true, 'Portable stock media must materialize locally');
    assert.equal(existsSync(join(root, 'assets', 'stock', 'resolve', 'stock-manifest.json')), true, 'Stock provenance must travel with the theme');
    assert.equal(existsSync(join(root, 'cms')), false, 'Legacy editor runtime must not ship in the storefront theme');
    assert.equal(existsSync(join(root, 'visual-01.svg')), true);
    assert.equal(existsSync(join(root, 'revise-hero.svg')), true);
    assert.equal(existsSync(join(root, 'revise-campaign-hero.webp')), true, 'Real campaign hero image is in the stock theme');
    assert.equal(existsSync(join(root, 'revise-custom-wordmark.svg')), true, 'Authored custom wordmark remains a vector asset');
    assert.equal(existsSync(join(root, 'revise-custom-s.svg')), true, 'Authored custom S remains a vector asset');
    assert.ok(html.includes('revise-custom-s.svg'), 'The custom S is also the browser identity');
    assert.equal(existsSync(join(root, 'owner-scenes')), false, 'Owner 3D environments never ship by default');
    const ownerRoot = join(tmp, 'owner');
    materializePrebuild(ownerRoot, { basePath: prefix, includeOwnerScenes: true });
    assert.equal(existsSync(join(ownerRoot, 'owner-scenes', 'scene-manifest.json')), true, 'Owner profile includes real source-backed scene assets');
    assert.equal(existsSync(join(root, 'fixtures', 'revise-demo.json')), true, 'Preview includes the four-kind demo catalog');
    assert.ok(script.includes('localStorage'), 'Preview cart should persist while reviewing');
    assert.ok(script.includes('No payment is collected'), 'Checkout must be clearly preview-only');
    const rootReceipt = materializePrebuild(join(tmp, 'root'), { basePath: '/' });
    assert.equal(rootReceipt.basePath, '/');
    const rootScript = readFileSync(join(tmp, 'root', 'revise-remaster.js'), 'utf8');
    assert.ok(rootScript.includes("const BASE = '/';"));
    assert.ok(!rootScript.includes(prefix));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('Revise CMS project has independent templates for the full storefront journey', () => {
  const project = require('../packages/theme-revise/install-project.json');
  const bySlug = Object.fromEntries(project.pages.map(page => [page.slug, page]));
  const expected = {
    home: ['/', 'home', 'index'],
    products: ['/products/', 'product_catalog', 'products'],
    'product-field-jacket': ['/products/field-jacket/', 'product', 'product'],
    collections: ['/collections/', 'collection_list', 'list-collections'],
    'collection-new-arrivals': ['/collections/new-arrivals/', 'collection', 'collection'],
    'gift-card': ['/gift-card/', 'gift_card', 'gift-card'],
    cart: ['/cart/', 'cart', 'cart'],
    checkout: ['/checkout/', 'checkout', 'checkout'],
    account: ['/account/', 'customer_account', 'customers/account'],
    'account-login': ['/account/login/', 'customer_sign_in', 'customers/login'],
    'account-register': ['/account/register/', 'customer_sign_up', 'customers/register'],
    'account-orders': ['/account/orders/', 'customer_orders', 'customers/orders'],
    'account-profile': ['/account/profile/', 'customer_profile', 'customers/profile'],
    blog: ['/blogs/', 'blog', 'blog'],
    'article-field-notes': ['/blogs/field-notes/', 'article', 'article'],
    search: ['/search/', 'search', 'search'],
    'page-about': ['/pages/about/', 'page', 'page'],
    'page-contact': ['/pages/contact/', 'page', 'page.contact'],
    'page-shipping-returns': ['/pages/shipping-returns/', 'page', 'page'],
    'page-faq': ['/pages/faq/', 'page', 'page'],
    '404': ['/404/', 'not_found', '404'],
    password: ['/password/', 'password', 'password'],
    services: ['/services/', 'product_catalog', 'services'],
    digital: ['/digital/', 'product_catalog', 'digital-editions'],
    experiences: ['/experiences/', 'product_catalog', 'experiences'],
    'product-field-guide': ['/products/field-guide/', 'product', 'product'],
    'product-brand-direction': ['/products/brand-direction/', 'product', 'product'],
    'product-studio-workshop': ['/products/studio-workshop/', 'product', 'product'],
    'collection-services': ['/collections/services/', 'collection', 'collection'],
    'collection-digital-editions': ['/collections/digital-editions/', 'collection', 'collection'],
    'collection-experiences': ['/collections/experiences/', 'collection', 'collection']
  };
  for (const [slug, [route, type, template]] of Object.entries(expected)) {
    assert.ok(bySlug[slug], 'Missing ' + slug + ' template');
    assert.equal(bySlug[slug].sourceRoute, route);
    assert.equal(bySlug[slug].page_type, type);
    assert.equal(bySlug[slug].template_key, template);
  }
  assert.equal(project.pages.length, Object.keys(expected).length);
  for (const page of project.pages) {
    assert.ok(page.sections.length >= 1, page.slug + ' must not be an empty template');
    for (const section of page.sections) {
      assert.ok(page.template.includes('<!--theme-section:' + section.key + '-->'));
      for (const block of section.content.__editor.blocks) {
        assert.ok(section.schema.blocks.some(candidate => candidate.key === block.templateKey));
        assert.ok(section.html.includes('<!--theme-block:' + block.templateKey + '-->'));
      }
    }
  }
  for (const page of project.pages.filter(page => page.page_type !== 'checkout' && page.page_type !== 'password')) {
    assert.deepEqual(page.sections.slice(0, 2).map(section => section.globalKey), ['site-announcement', 'site-header']);
    assert.equal(page.sections.at(-1).globalKey, 'site-footer');
  }
});

test('Revise public release and editable CMS project point to the same immutable artifact', () => {
  const pkg = require('../packages/theme-revise/package.json');
  const project = require('../packages/theme-revise/install-project.json');
  const release = pkg.agentsam.store.release;
  assert.equal(pkg.version, '0.1.4');
  assert.equal(release.status, 'published');
  assert.match(release.sha256, /^[a-f0-9]{64}$/);
  assert.equal(release.storageKey, 'releases/revise/' + pkg.version + '/' + release.sha256 + '.zip');
  assert.equal(project.sourcePackageVersion, pkg.version);
  assert.equal(project.sourceReleaseSha256, release.sha256);
});

test('Revise identity study and source scene assets remain verifiable', () => {
  const project = require('../packages/theme-revise/install-project.json');
  const home = project.pages.find(page => page.slug === 'home');
  const gallery = home.sections.find(section => section.key === 'home_identity');
  assert.ok(gallery, 'Homepage must retain its real editable identity lookbook');
  const identityKeys = ['identity_primary','identity_cap','identity_garment','identity_tag','identity_paper'];
  for (const key of identityKeys) {
    assert.ok(gallery.schema.fields.some(field => field.key === key), 'Missing editable media field ' + key);
    assert.ok(gallery.content[key].endsWith('.webp'), 'Media must be a real derivative');
  }
  const pack = require('../packages/theme-revise/site/owner-scenes/scene-manifest.json');
  assert.equal(pack.enabledByDefault, false);
  assert.equal(pack.scenes.length, 11);
  assert.equal(new Set(pack.scenes.map(s => s.index)).size, 11);
  for (const stop of pack.scenes) {
    assert.equal(stop.camera.position.length, 3);
    assert.equal(stop.camera.target.length, 3);
    assert.ok(stop.heading.length > 8, 'Every source camera stop must retain authored content');
  }
  const { createHash } = require('node:crypto');
  for (const asset of pack.files) {
    const bytes = readFileSync(new URL('../packages/theme-revise/site/owner-scenes/' + asset.path, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.path + ' hash drift');
    assert.equal(bytes.length, asset.bytes);
  }
  const scene = require('../packages/theme-revise/site/owner-scenes/scenes/original-4341/original-4341.iamscene.json');
  assert.equal(scene.format, 'iamscene');
  assert.equal(scene.assets.length, 4);
});


test('Revise demo image references are real portable media, not geometric placeholder cards', () => {
  const fixture = require('../packages/theme-revise/site/fixtures/revise-demo.json');
  const site = join(process.cwd(), 'packages', 'theme-revise', 'site');
  const groups = ['products', 'collections', 'stories', 'chapters'];
  let checked = 0;
  for (const group of groups) {
    for (const item of fixture[group]) {
      assert.match(item.image, /\.webp$/, group + ' image must use a real WebP derivative');
      assert.ok(!item.image.includes('visual-'), group + ' must not use abstract placeholder SVGs');
      assert.equal(existsSync(join(site, item.image)), true, 'Missing ' + group + ' media: ' + item.image);
      checked++;
    }
  }
  assert.equal(checked, 23);
  const project = require('../packages/theme-revise/install-project.json');
  const photoBlockSections = project.pages.flatMap(page => page.sections).filter(section => ['product_card', 'collection_card', 'story_card'].some(key => section.schema.blocks.some(block => block.key === key)));
  assert.ok(photoBlockSections.length > 3);
  for (const section of photoBlockSections) {
    for (const value of Object.values(section.content)) {
      if (value && typeof value === 'object' && typeof value.image === 'string') {
        assert.ok(value.image.startsWith('https://themes.inneranimalmedia.com/theme-packages/revise/0.1.4/preview/'), section.key + ' image URL must use the package asset base');
      }
    }
  }
});
