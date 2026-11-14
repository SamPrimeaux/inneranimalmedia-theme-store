/**
 * @inneranimalmedia/theme-iasf — stock Inner Animal Storefront theme.
 *
 * Canonical id: `iasf`. Donor provenance: studio-cms-editor theme_layout_donor.
 * Normalized into an installable CMS starter + public storefront shell.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, archetypes, journal, nav, brand, media } from './content.js';
import { IASF_CSS_VARS, themeToCssVars } from './tokens.js';
import { shellDefaults } from './shell/config.js';

// Editable header/footer fields come straight from the shell config, so the CMS section
// editor and the rendered storefront can never drift apart. Fresh copy per section.
const headerFields = () => structuredClone(shellDefaults.header);
const footerFields = () => structuredClone(shellDefaults.footer);

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE_VERSION = JSON.parse(readFileSync(join(HERE, '..', 'package.json'), 'utf8')).version;
const harvest = JSON.parse(readFileSync(join(HERE, 'harvest.json'), 'utf8'));

const THEME = Object.freeze({
  id: 'theme.iasf',
  slug: 'iasf',
  lineage: 'iasf',
  family: 'editorial-commerce',
  displayName: 'Evolution',
  version: PACKAGE_VERSION,
  kind: 'stock-theme',
  icon: 'theme',
  package: '@inneranimalmedia/theme-iasf',
  category: 'Commerce',
  industries: ['Retail', 'Lifestyle', 'Apparel'],
  tags: ['storefront', 'shop', 'journal', 'archetypes', 'stock'],
  description:
    'Stock Inner Animal Storefront — multipage commerce/editorial shell normalized from the studio-cms-editor harvest.',
  features: ['Commerce', 'CMS', 'Journal', 'Collections'],
  pages: ['Home', 'Shop', 'Collections', 'Product', 'Journal', 'Story'],
  preview: {
    kind: 'pack',
    card: null,
    desktop: null,
    mobile: null,
  },
  installable: true,
  stock: true,
  galleryPath: null,
  capabilityHints: ['theme.storefront.shell', 'cms.pages', 'commerce.catalog'],
  cssEntry: './styles/storefront.css',
  donor: harvest.source_repository,
  harvest,
});

export function createTheme() {
  return structuredClone(THEME);
}

export default createTheme;

export { products, archetypes, journal, nav, brand, IASF_CSS_VARS, themeToCssVars, harvest };
export { media } from './content.js';
export {
  SHELL_VERSION, shellDefaults, mergeShellConfig, shellSchema, runtimeConfig,
  renderHeader, renderFooter, renderSignature,
} from './shell/index.js';

/** Absolute path helper for consumers that mount the CSS file. */
export function resolveStorefrontCssPath() {
  return join(HERE, 'styles', 'storefront.css');
}

export function readStorefrontCss() {
  return readFileSync(resolveStorefrontCssPath(), 'utf8');
}

/**
 * agentsam_products UPSERT payload (caller resolves repository_id).
 * Matches live D1 columns on inneranimalmedia-business.agentsam_products
 * (no account_id column — put provenance in metadata).
 */
export function createProductRow({ repositoryId = null, status = 'wired' } = {}) {
  const theme = createTheme();
  return {
    slug: theme.slug,
    name: theme.displayName,
    kind: 'theme',
    status,
    description: theme.description,
    repository_id: repositoryId,
    canonical_path: 'packages/theme-iasf',
    package_name: theme.package,
    version: theme.version,
    tags: theme.tags || [],
    metadata: {
      origin: 'stock_theme',
      normalization_state: 'promoted_stock',
      lineage: theme.lineage,
      family: theme.family,
      package: theme.package,
      preview_kind: theme.preview?.kind || 'pack',
      capabilities: theme.capabilityHints || [],
      donor_name: 'Inner Animals storefront',
      stock: true,
      installable: true,
      aliases: ['inneranimals-site', 'theme-inneranimals-site'],
      cms_starter: 'iasf',
    },
  };
}

/**
 * Portable CmsStarterPack-shaped seed (no React / Next deps).
 * Consumed through the canonical Ecommerce + CMS theme installation contract.
 */
export function createIasfStarterPackSeed() {
  const cssVars = themeToCssVars();
  return {
    id: 'iasf',
    name: 'Evolution',
    version: 1,
    description:
      'Stock Inner Animal Storefront — home, shop, archetypes, journal, and story routes.',
    provenance: {
      kind: 'builtin_starter',
      packId: 'iasf',
      packVersion: 1,
      donor: harvest.source_repository,
      harvestBatch: harvest.harvest_batch,
    },
    site: {
      name: brand.name,
      domain: '',
      initials: 'IA',
      color: cssVars['--brand-accent'],
    },
    theme: { cssVars },
    schemas: {
      protocol_version: 1,
      sections: [
        { key: 'header', type: 'header', version: 1, label: 'Store header' },
        { key: 'hero', type: 'hero', version: 1, label: 'Atlas hero (glass + milestone cards)' },
        { key: 'category-cards', type: 'feature-grid', version: 1, label: 'Category cards' },
        { key: 'editorial-tiles', type: 'feature-grid', version: 1, label: 'Editorial tiles' },
        { key: 'story-rings', type: 'feature-grid', version: 1, label: 'Story rings' },
        { key: 'product-shelf', type: 'product-grid', version: 1, label: 'Tabbed product shelf' },
        { key: 'brand-world', type: 'hero', version: 1, label: 'Brand world (parallax)' },
        { key: 'feature', type: 'feature-grid', version: 1, label: 'Feature split' },
        { key: 'quote', type: 'cta', version: 1, label: 'Quote' },
        { key: 'product-grid', type: 'product-grid', version: 1, label: 'Product grid' },
        { key: 'manifesto', type: 'cta', version: 1, label: 'Manifesto' },
        { key: 'archetypes', type: 'feature-grid', version: 1, label: 'Archetypes' },
        { key: 'journal-grid', type: 'project-gallery', version: 1, label: 'Field journal' },
        { key: 'footer', type: 'footer', version: 1, label: 'Store footer' },
      ],
      blocks: [
        { key: 'text', type: 'text', version: 1, label: 'Text' },
        { key: 'product-card', type: 'product-card', version: 1, label: 'Product card' },
        { key: 'journal-card', type: 'journal-card', version: 1, label: 'Journal card' },
      ],
    },
    templates: [
      { id: 'tpl_iasf_home', name: 'IASF Home', type: 'page', category: 'Commerce' },
      { id: 'tpl_iasf_shop', name: 'IASF Shop', type: 'page', category: 'Commerce' },
      { id: 'tpl_iasf_story', name: 'IASF Story', type: 'page', category: 'Editorial' },
    ],
    catalog: { products, archetypes, journal, nav, brand },
    pages: [
      {
        title: 'Home',
        slug: '/',
        type: 'Home',
        metaTitle: 'Inner Animals — Field Issue 001',
        metaDescription: brand.tagline,
        sections: [
          {
            name: 'Store header',
            type: 'header',
            zone: 'HEADER',
            fields: headerFields(),
          },
          {
            name: 'Atlas hero',
            type: 'hero',
            zone: 'BODY',
            fields: {
              eyebrow: 'Field Issue 001 — built for people becoming harder to domesticate',
              headline: 'The wild is still in there.',
              subline:
                'Training goods and field uniforms, cut heavy and made in small runs for people who understand that discipline and instinct are not opposites.',
              primary_cta: 'Shop the drop',
              primary_cta_url: '/shop',
              secondary_cta: 'Enter the story',
              secondary_cta_url: '/story',
              glass_card: {
                image: media.hero,
                tabs: [
                  { label: 'Instinct', title: 'Our guiding force', body: 'Every piece starts with a single question: what does the body actually need at the hour nobody is watching?' },
                  { label: 'Craft', title: 'Made to be worn hard', body: 'Heavyweight cotton, flat-felled seams and finishes that soften instead of fail.' },
                  { label: 'Pack', title: 'Closer than a following', body: 'Members get private drops, field notes and first access before anything goes public.' },
                ],
              },
              milestones: {
                title: 'Milestones in our journey',
                items: [
                  { caption: '2023 — First sample run, cut and sewn by hand in Lafayette.' },
                  { caption: '2025 — The four archetypes take shape: Wolf, Bear, Panther, Bull.' },
                  { caption: '2026 — Field Issue 001 opens to the pack.' },
                ],
              },
            },
          },
          {
            name: 'Category cards',
            type: 'feature-grid',
            zone: 'BODY',
            fields: {
              title: 'The field store',
              subtitle: 'Four natures · one uniform',
              items: ['Train', 'Recover', 'Roam', 'Everyday', 'Archetypes'].map((t) => ({ title: t, href: '/shop' })),
            },
          },
          {
            name: 'Editorial tiles',
            type: 'feature-grid',
            zone: 'BODY',
            fields: {
              section_label: 'Curated editorial tiles',
              items: [
                { kicker: 'Iconic cuts', title: 'The Heavyweight Edit', cta: 'Shop tees', href: '/collections/wolf' },
                { kicker: 'Train', title: 'Quiet movement, sudden power', cta: 'Shop shorts', href: '/collections/panther' },
                { kicker: 'Special invitation', title: 'First access, before anyone else.', cta: 'Join the pack', action: 'pack' },
                { kicker: 'Field journal', title: 'Training after the noise', cta: 'Read more', href: '/journal' },
              ],
            },
          },
          {
            name: 'Story rings',
            type: 'feature-grid',
            zone: 'BODY',
            fields: {
              title: 'The pack',
              items: [...archetypes.map((a) => ({ title: a.name, href: `/collections/${a.slug}` })), { title: 'Journal', href: '/journal' }],
            },
          },
          {
            name: 'Product shelf',
            type: 'product-grid',
            zone: 'BODY',
            fields: {
              tabs: ['New arrivals', 'Best sellers', 'Archive'],
              section_label: 'CURRENT DROP / ISSUE 001',
              title: 'UNIFORMS FOR THE INNER LIFE.',
              quick_add: true,
              columns: 4,
            },
            blocks: products.map((p) => ({
              type: 'product-card',
              data: {
                title: p.name,
                price: `$${p.price}`,
                slug: p.slug,
                category: p.category,
                image: p.image,
                meta: `${p.fit} / ${p.weight} / ${p.color}`,
              },
            })),
          },
          {
            name: 'Brand world',
            type: 'hero',
            zone: 'BODY',
            fields: {
              eyebrow: 'The inner life',
              headline: 'Civilized enough to function. Wild enough to matter.',
              body: 'We make fewer things, with more weight. Each uniform is built to disappear into the work and outlast the season.',
              button_label: 'Read our code',
              button_url: '/story',
              image: '/assets/iasf/jungle-river-mist-bg.webp',
            },
          },
          {
            name: 'Material feature',
            type: 'feature-grid',
            zone: 'BODY',
            fields: {
              eyebrow: 'Material first',
              title: 'Heavy cotton, cut to move.',
              body: 'Dense knit, honest weight and finishes that soften with use.',
              image: '/assets/iasf/elephant-skin-texture-card.webp',
              items: [
                { label: 'Weight', value: '280–480 GSM' },
                { label: 'Construction', value: 'Flat-felled seams' },
                { label: 'Run size', value: 'Small, numbered' },
              ],
            },
          },
          {
            name: 'Quote',
            type: 'cta',
            zone: 'BODY',
            fields: {
              quote: 'Built for the hours nobody sees — it only gets better the harder you wear it.',
              attribution: 'Field notes, member 0042',
            },
          },
          {
            name: 'Field journal',
            type: 'project-gallery',
            zone: 'BODY',
            fields: {
              section_label: 'THE FIELD JOURNAL',
              title: 'NOT CONTENT. EVIDENCE.',
              layout: 'Editorial',
            },
            blocks: journal.map((j) => ({
              type: 'journal-card',
              data: {
                title: j.title,
                kind: j.kind,
                copy: j.copy,
                slug: j.slug,
                image: j.image,
              },
            })),
          },
          {
            name: 'Store footer',
            type: 'footer',
            zone: 'FOOTER',
            fields: footerFields(),
          },
        ],
      },
      {
        title: 'Shop',
        slug: '/shop',
        type: 'Interior',
        metaTitle: 'Shop · Inner Animals',
        metaDescription: 'Field store / Issue 001',
        sections: [
          {
            name: 'Store header',
            type: 'header',
            zone: 'HEADER',
            fields: headerFields(),
          },
          {
            name: 'Shop hero',
            type: 'hero',
            zone: 'BODY',
            fields: {
              eyebrow: 'FIELD STORE / ISSUE 001',
              headline: 'GEAR FOR THE WORK.',
              subline: 'Concept collection. Four archetypes, considered materials, no filler.',
            },
          },
          {
            name: 'Shop grid',
            type: 'product-grid',
            zone: 'BODY',
            fields: {
              title: 'All pieces',
              filters: ['All', 'Train', 'Recover', 'Roam', 'Everyday'],
              columns: 4,
            },
            blocks: products.map((p) => ({
              type: 'product-card',
              data: {
                title: p.name,
                price: `$${p.price}`,
                slug: p.slug,
                category: p.category,
                image: p.image,
              },
            })),
          },
          {
            name: 'Store footer',
            type: 'footer',
            zone: 'FOOTER',
            fields: footerFields(),
          },
        ],
      },
      {
        title: 'Journal',
        slug: '/journal',
        type: 'Interior',
        metaTitle: 'Field Journal · Inner Animals',
        metaDescription: 'Transmissions from the field.',
        sections: [
          {
            name: 'Store header',
            type: 'header',
            zone: 'HEADER',
            fields: headerFields(),
          },
          {
            name: 'Journal hero',
            type: 'hero',
            zone: 'BODY',
            fields: {
              eyebrow: 'TRANSMISSIONS FROM THE FIELD',
              headline: 'THE FIELD JOURNAL.',
              subline: 'Training, materials, profiles, films, place and the inner life behind the work.',
            },
          },
          {
            name: 'Journal grid',
            type: 'project-gallery',
            zone: 'BODY',
            fields: { layout: 'Editorial' },
            blocks: journal.map((j) => ({
              type: 'journal-card',
              data: { title: j.title, kind: j.kind, copy: j.copy, slug: j.slug, image: j.image },
            })),
          },
          {
            name: 'Store footer',
            type: 'footer',
            zone: 'FOOTER',
            fields: footerFields(),
          },
        ],
      },
      {
        title: 'Our Code',
        slug: '/story',
        type: 'Interior',
        metaTitle: 'Our Code · Inner Animals',
        metaDescription: brand.tagline,
        sections: [
          {
            name: 'Store header',
            type: 'header',
            zone: 'HEADER',
            fields: headerFields(),
          },
          {
            name: 'Story hero',
            type: 'hero',
            zone: 'BODY',
            fields: {
              eyebrow: 'THE INNER ANIMALS CODE / 2026',
              headline: 'INSTINCT WITHOUT DISCIPLINE IS JUST NOISE.',
            },
          },
          {
            name: 'Code principles',
            type: 'feature-grid',
            zone: 'BODY',
            fields: {
              items: [
                { title: 'Use over display', body: 'The finest objects get better through work, wear and memory.' },
                { title: 'Fewer, heavier things', body: 'No endless catalog. Each issue earns the right to exist.' },
                { title: 'The pack is practice', body: 'Community is showing up for one another.' },
                { title: 'Leave proof', body: 'Train, make, travel, recover. Bring back something true.' },
              ],
            },
          },
          {
            name: 'Store footer',
            type: 'footer',
            zone: 'FOOTER',
            fields: footerFields(),
          },
        ],
      },
    ],
  };
}
