import fs from 'node:fs';

const packageManifest = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const packageVersion = packageManifest.version;
const release = packageManifest.agentsam?.store?.release || {};
const releaseSha256 = release.status === 'published' ? String(release.sha256 || '') : '0'.repeat(64);
if (!/^[a-f0-9]{64}$/.test(releaseSha256)) throw new Error('Revise published release SHA-256 missing or invalid');
const assetBase = 'https://themes.inneranimalmedia.com/theme-packages/revise/' + packageVersion + '/preview/';
const demo = JSON.parse(fs.readFileSync(new URL('../site/fixtures/revise-demo.json', import.meta.url), 'utf8'));
const kindLabel = { physical: 'Physical object', digital: 'Digital edition', service: 'Service', experience: 'Experience' };
const kindAction = { physical: 'Explore object', digital: 'Explore edition', service: 'Explore service', experience: 'Explore experience' };
const productItems = demo.products.map(product => ({
  id: product.id, title: product.title, category: product.type, kind: product.kind,
  price: product.priceLabel || `$${Number(product.price).toFixed(2)}`,
  description: product.shortDescription || product.description,
  image: new URL(product.image, assetBase).href, href: `/products/${product.id}/`, alt: `${product.title} artwork`,
  action: `${kindAction[product.kind] || 'Explore'} ↗`
}));
const collectionItems = demo.collections.map(collection => ({
  id: collection.id, title: collection.title, category: collection.kind,
  description: collection.description, image: new URL(collection.image, assetBase).href,
  href: `/collections/${collection.id}/`, alt: `${collection.title} collection artwork`
}));
const storyItems = demo.stories.map(story => ({
  id: story.id, title: story.title, category: story.category,
  description: story.excerpt, image: new URL(story.image, assetBase).href,
  href: `/blogs/${story.id}/`, alt: `${story.title} journal artwork`
}));
const serviceItems = productItems.filter(item => item.kind === 'service');
const digitalItems = productItems.filter(item => item.kind === 'digital');
const experienceItems = productItems.filter(item => item.kind === 'experience');
const featuredItems = ['brand-direction', 'field-guide', 'field-jacket', 'studio-workshop'].map(id => productItems.find(item => item.id === id)).filter(Boolean);
const field = (key, label, type = 'text', binding = {}) => ({ key, label, group: type === 'media' ? 'Media' : 'Content', type, binding });
const sectionSettings = [
  { key: 'layout_padding', label: 'Padding', type: 'text', group: 'Spacing', binding: { field: '__section', styleProperty: 'padding' } },
  { key: 'layout_background', label: 'Background', type: 'text', group: 'Surface', binding: { field: '__section', styleProperty: 'background' } }
];
const blockDef = (key, label, fields, defaults, html) => ({
  key, label, kind: 'block', html, fields, defaults, settings: [],
  capabilities: { duplicate: true, reorder: true, reusable: true }
});
const simpleBlockFields = [
  field('title', 'Title'),
  field('category', 'Category'),
  field('description', 'Description'),
  field('image', 'Image', 'media', { attribute: 'src' }),
  field('alt', 'Image alternative text', 'text', { field: 'image', attribute: 'alt' }),
  field('href', 'Link destination', 'link', { field: 'title', attribute: 'href' })
];
const productCardBlock = blockDef(
  'product_card', 'Product card', simpleBlockFields.concat([field('kind', 'Offering type'), field('price', 'Price'), field('action', 'Action label')]),
  productItems[0],
  '<article class="rr-product-card" data-kind="physical"><a class="rr-product-card__image" href="/products/field-jacket/" data-theme-project-field="href"><img src="https://themes.inneranimalmedia.com/theme-packages/revise/0.1.4/preview/assets/stock/resolve/media-216610d365.webp" alt="Product artwork" data-theme-project-field="image"><span class="rr-product-card__kind" data-theme-project-field="kind">Physical object</span></a><div class="rr-product-card__meta"><div><span data-theme-project-field="category">Outerwear</span><h3 data-theme-project-field="title">Field Jacket</h3><p data-theme-project-field="description">A useful layer, made to move.</p></div><strong data-theme-project-field="price">$148.00</strong></div><a data-theme-project-field="action" href="/products/field-jacket/">Explore object ↗</a></article>'
);
const collectionCardBlock = blockDef(
  'collection_card', 'Collection card', simpleBlockFields,
  collectionItems[0],
  '<article class="rr-collection-card"><a href="/collections/new-arrivals/" data-theme-project-field="title"><img src="https://themes.inneranimalmedia.com/theme-packages/revise/0.1.4/preview/assets/stock/resolve/media-216610d365.webp" alt="New Arrivals" data-theme-project-field="image"></a><div><h2 data-theme-project-field="title">New Arrivals</h2><p data-theme-project-field="description">Fresh pieces. Familiar purpose.</p><a href="/collections/new-arrivals/" data-theme-project-field="title">Explore ↗</a></div></article>'
);
const storyCardBlock = blockDef(
  'story_card', 'Story card', simpleBlockFields,
  storyItems[0],
  '<article class="rr-story-card"><a href="/blogs/field-notes/" data-theme-project-field="title"><img src="https://themes.inneranimalmedia.com/theme-packages/revise/0.1.4/preview/assets/stock/resolve/media-a70660bfa9.webp" alt="A slower kind of progress" data-theme-project-field="image"><span data-theme-project-field="category">Field notes</span><h2 data-theme-project-field="title">A slower kind of progress</h2><p data-theme-project-field="description">A few thoughts on making room for the work that matters.</p></a></article>'
);

function section({ key, name, zone = 'BODY', sourceKind = 'theme-section', html, fields = [], values = {}, blocks = [], globalKey = null, capabilities = { reorder: true, duplicate: true, reusable: true } }) {
  const editorBlocks = blocks.map((item, index) => ({ id: item.id || `${key}-block-${index + 1}`, templateKey: item.templateKey || (item.type === 'collection' ? 'collection_card' : item.type === 'story' ? 'story_card' : 'product_card') }));
  const blockValues = {};
  blocks.forEach((item, index) => { blockValues[editorBlocks[index].id] = { ...item }; });
  const content = {
    ...values,
    ...blockValues,
    __editor: { templateKey: key, visibility: { enabled: true }, blocks: editorBlocks }
  };
  const schema = {
    key, label: name, zone, sourceKind, fields, settings: sectionSettings,
    blocks: blocks.length ? [productCardBlock, collectionCardBlock, storyCardBlock].filter(def => editorBlocks.some(item => item.templateKey === def.key)) : [],
    capabilities
  };
  return {
    key, name, ...(globalKey ? { globalKey } : {}), zone, sourceKind,
    html: `<section data-theme-section="${key}" data-theme-project-field="__section">${html}</section>`,
    version: 0, status: 'draft', content, schema, sort_order: 0
  };
}
const textFields = (pairs) => pairs.map(([key, label]) => field(key, label));
const mediaFields = (key, label, altKey = `${key}_alt`) => [
  field(key, label, 'media', { attribute: 'src' }),
  field(altKey, `${label} alternative text`, 'text', { field: key, attribute: 'alt' })
];
const headingSection = (key, name, eyebrow, heading, description, sourceKind = 'editorial-heading') => section({
  key, name, sourceKind,
  html: `<div class="rr-section-heading"><span data-theme-project-field="eyebrow">${eyebrow}</span><h1 data-theme-project-field="heading">${heading}</h1><p data-theme-project-field="description">${description}</p></div>`,
  fields: textFields([['eyebrow', 'Eyebrow'], ['heading', 'Heading'], ['description', 'Description']]),
  values: { eyebrow, heading, description }
});
function blockSection(key, name, sourceKind, blockKey, items, title, description = '') {
  const templateKey = blockKey;
  const marker = items.map(() => `<!--theme-block:${templateKey}-->`).join('');
  const def = blockKey === 'collection_card' ? collectionCardBlock : blockKey === 'story_card' ? storyCardBlock : productCardBlock;
  return section({
    key, name, sourceKind,
    html: `<header class="rr-section-heading"><h2 data-theme-project-field="heading">${title}</h2><p data-theme-project-field="description">${description}</p></header><div class="rr-template-grid">${marker}</div>`,
    fields: textFields([['heading', 'Heading'], ['description', 'Description']]),
    values: { heading: title, description },
    blocks: items.map((item, i) => ({ ...item, id: `${key}-${item.id || i + 1}`, templateKey }))
  });
}

const announcement = () => section({
  key: 'site_announcement', name: 'Announcement bar', zone: 'HEADER', sourceKind: 'announcement-bar', globalKey: 'site-announcement',
  html: '<div class="rr-announcement"><span data-theme-project-field="message">Consider what could be better.</span><span data-theme-project-field="secondary">Thoughtful work, useful things, new perspectives.</span></div>',
  fields: textFields([['message', 'Announcement'], ['secondary', 'Secondary message']]),
  values: { message: 'Consider what could be better.', secondary: 'Thoughtful work, useful things, new perspectives.' },
  capabilities: { reorder: false, duplicate: false, reusable: true }
});
const header = () => section({
  key: 'site_header', name: 'Header', zone: 'HEADER', sourceKind: 'site-header', globalKey: 'site-header',
  html: '<header class="rr-header"><nav class="rr-header__left"><button type="button" data-overlay-open="menu" data-theme-project-field="menu_label">Menu</button><a href="/products/" data-theme-project-field="shop_label">Shop</a><a href="/services/" data-theme-project-field="services_label">Services</a></nav><a class="rr-wordmark" href="/" data-theme-project-field="brand_href"><img src="/revise-custom-wordmark.svg" alt="Revise" data-theme-project-field="brandLogo"></a><nav class="rr-header__right"><a href="/digital/" data-theme-project-field="digital_label">Digital</a><a href="/experiences/" data-theme-project-field="experiences_label">Experiences</a><a href="/blogs/" data-theme-project-field="journal_label">Journal</a><button type="button" data-overlay-open="search" data-theme-project-field="search_label">Search</button><a href="/account/" data-theme-project-field="account_label">Account</a><a href="/cart/" data-theme-project-field="bag_label">Bag</a></nav></header>',
  fields: [...mediaFields('brandLogo','Brand logo'), ...textFields([['menu_label', 'Menu label'], ['shop_label', 'Shop label'], ['services_label', 'Services label'], ['digital_label', 'Digital label'], ['experiences_label', 'Experiences label'], ['journal_label', 'Journal label'], ['search_label', 'Search label'], ['account_label', 'Account label'], ['bag_label', 'Bag label'], ['brand', 'Brand name']]), field('brand_href', 'Brand destination', 'link', { field: 'brand', attribute: 'href' }), field('shop_href', 'Shop destination', 'link', { field: 'shop_label', attribute: 'href' }), field('services_href', 'Services destination', 'link', { field: 'services_label', attribute: 'href' }), field('digital_href', 'Digital destination', 'link', { field: 'digital_label', attribute: 'href' }), field('experiences_href', 'Experiences destination', 'link', { field: 'experiences_label', attribute: 'href' }), field('journal_href', 'Journal destination', 'link', { field: 'journal_label', attribute: 'href' }), field('account_href', 'Account destination', 'link', { field: 'account_label', attribute: 'href' }), field('bag_href', 'Bag destination', 'link', { field: 'bag_label', attribute: 'href' })],
  values: { menu_label: 'Menu', shop_label: 'Shop', shop_href: '/products/', services_label: 'Services', services_href: '/services/', digital_label: 'Digital', digital_href: '/digital/', experiences_label: 'Experiences', experiences_href: '/experiences/', journal_label: 'Journal', journal_href: '/blogs/', search_label: 'Search', account_label: 'Account', account_href: '/account/', bag_label: 'Bag', bag_href: '/cart/', brand: 'REVISE', brandLogo: '/revise-custom-wordmark.svg', brandLogo_alt: 'Revise wordmark', brand_href: '/' },
  capabilities: { reorder: false, duplicate: false, reusable: true }
});
const footer = () => section({
  key: 'site_footer', name: 'Footer', zone: 'FOOTER', sourceKind: 'site-footer', globalKey: 'site-footer',
  html: '<footer class="rr-footer"><div class="rr-footer__brand"><a href="/" data-theme-project-field="brand_href"><img src="/revise-custom-wordmark.svg" alt="Revise" data-theme-project-field="brandLogo"></a><p data-theme-project-field="tagline">Look again. Make it better.</p></div><div class="rr-footer__links"><a href="/products/" data-theme-project-field="shop_label">Shop all</a><a href="/services/" data-theme-project-field="services_label">Services</a><a href="/digital/" data-theme-project-field="digital_label">Digital editions</a><a href="/experiences/" data-theme-project-field="experiences_label">Experiences</a><a href="/collections/" data-theme-project-field="collections_label">Collections</a><a href="/gift-card/" data-theme-project-field="gift_label">Gift cards</a><a href="/blogs/" data-theme-project-field="journal_label">Journal</a></div><div class="rr-footer__info"><a href="/pages/about/" data-theme-project-field="about_label">Our approach</a><a href="/pages/contact/" data-theme-project-field="contact_label">Contact</a><a href="/pages/shipping-returns/" data-theme-project-field="returns_label">Shipping & returns</a><a href="/pages/faq/" data-theme-project-field="faq_label">FAQ</a></div><div class="rr-footer__bottom"><span data-theme-project-field="copyright">© 2026 Revise Studio</span><span data-theme-project-field="closing">Re-examine. Reconsider. Make it better.</span></div></footer>',
  fields: [...mediaFields('brandLogo','Brand logo'), ...textFields([['brand', 'Brand name'], ['tagline', 'Tagline'], ['shop_label', 'Shop link'], ['services_label', 'Services link'], ['digital_label', 'Digital link'], ['experiences_label', 'Experiences link'], ['collections_label', 'Collections link'], ['gift_label', 'Gift card link'], ['journal_label', 'Journal link'], ['about_label', 'About link'], ['contact_label', 'Contact link'], ['returns_label', 'Returns link'], ['faq_label', 'FAQ link'], ['copyright', 'Copyright'], ['closing', 'Closing note']]), field('brand_href', 'Brand destination', 'link', { field: 'brand', attribute: 'href' })],
  values: { brand: 'REVISE', brandLogo: '/revise-custom-wordmark.svg', brandLogo_alt: 'Revise wordmark', brand_href: '/', tagline: 'Look again. Make it better.', shop_label: 'Shop all', services_label: 'Services', digital_label: 'Digital editions', experiences_label: 'Experiences', collections_label: 'Collections', gift_label: 'Gift cards', journal_label: 'Journal', about_label: 'Our approach', contact_label: 'Contact', returns_label: 'Shipping & returns', faq_label: 'FAQ', copyright: '© 2026 Revise Studio', closing: 'Re-examine. Reconsider. Make it better.' },
  capabilities: { reorder: false, duplicate: false, reusable: true }
});

const hero = () => section({
  key: 'home_hero', name: 'Home hero', sourceKind: 'editorial-hero',
  html: '<div class="rr-home-hero"><img src="/revise-hero.svg" alt="Editorial landscape" data-theme-project-field="image"><div class="rr-home-hero__copy"><span data-theme-project-field="eyebrow">A different point of view</span><h1 data-theme-project-field="heading">Look again. Make it better.</h1><p data-theme-project-field="description">Services, objects and experiences for ideas ready to move forward.</p><a href="/products/" data-theme-project-field="cta">Explore the collection ↗</a></div></div>',
  fields: [...mediaFields('image', 'Hero image'), ...textFields([['eyebrow', 'Eyebrow'], ['heading', 'Heading'], ['description', 'Description'], ['cta', 'Button label']]), field('cta_href', 'Button destination', 'link', { field: 'cta', attribute: 'href' })],
  values: { image: '/revise-campaign-hero.webp', image_alt: 'Revise storefront and branded merchandise', eyebrow: 'Re-examine · Reconsider · Refine', heading: 'Designed to make it better.', description: 'Services, objects and experiences for ideas ready to move forward.', cta: 'Explore the collection ↗', cta_href: '/products/' }
});
const intro = (key, name, eyebrow, heading, description) => headingSection(key, name, eyebrow, heading, description, 'page-intro');
const productGrid = (key, title, items = productItems) => blockSection(key, title, 'commerce-product-grid', 'product_card', items, title, 'A selection from the current catalog.');
const collectionGrid = (key, title, items = collectionItems) => blockSection(key, title, 'commerce-collection-grid', 'collection_card', items, title, 'Browse the collection by point of view.');
const storyGrid = (key, title, items = storyItems) => blockSection(key, title, 'cms-article-grid', 'story_card', items, title, 'Notes, ideas and useful perspectives.');
const pageBody = (key, title, heading, body) => section({
  key, name: title, sourceKind: 'rich-text',
  html: `<div class="rr-standard-content"><h2 data-theme-project-field="heading">${heading}</h2><div data-theme-project-field="body">${body}</div></div>`,
  fields: textFields([['heading', 'Heading'], ['body', 'Body copy']]), values: { heading, body }
});
const storyChapter = (key, chapterNumber, heading, body, mediaKey, mediaAlt, actionLabel, actionHref, imageSide = 'right', appearance = 'light') => section({
  key, name: `Story chapter ${chapterNumber}`, sourceKind: 'story-chapter',
  html: `<div class="iam-story-chapter" data-appearance="${appearance}" data-image-side="${imageSide}"><div class="iam-story-chapter__inner"><div class="iam-story-chapter__copy"><span class="iam-story-chapter__number">${chapterNumber}</span><h2 class="iam-story-chapter__heading">${heading}</h2><p class="iam-story-chapter__paragraph">${body}</p><a class="iam-story-chapter__action" href="${actionHref}">${actionLabel} →</a></div><div class="iam-story-chapter__media"></div></div></div>`,
  fields: [...textFields([['seriesHeading', 'Series heading'], ['chapterNumber', 'Chapter number'], ['heading', 'Heading'], ['body', 'Body copy'], ['mediaKey', 'Media asset key'], ['mediaAlt', 'Media alternative text'], ['imageSide', 'Image side'], ['appearance', 'Appearance'], ['action.label', 'Action label']]), field('action.href', 'Action destination', 'link', { field: 'action.label', attribute: 'href' })],
  values: { seriesHeading: 'THE REVISE METHOD', chapterNumber, heading, body, mediaKey, mediaAlt, imageSide, appearance, action: { label: actionLabel, href: actionHref } }
});
const identityStudies = [
  { key: 'identity_primary', src: '/revise-identity-card.webp', alt: 'Revise custom letterform and wordmark', label: '01 / THE MARK' },
  { key: 'identity_cap', src: '/revise-detail-cap.webp', alt: 'Revise embroidered cap identity study', label: '02 / EMBROIDERY' },
  { key: 'identity_garment', src: '/revise-detail-garment.webp', alt: 'Revise woven label identity study', label: '03 / GARMENT LABEL' },
  { key: 'identity_tag', src: '/revise-detail-tag.webp', alt: 'Revise branded tag identity study', label: '04 / HANG TAG' },
  { key: 'identity_paper', src: '/revise-detail-paper.webp', alt: 'Revise embossed paper identity study', label: '05 / PAPER' }
];
const identityGallery = () => section({
  key: 'home_identity', name: 'Identity in application', sourceKind: 'editorial-media-gallery',
  html: '<div class="rr-identity-gallery"><div class="rr-identity-gallery__intro"><span data-theme-project-field="eyebrow">AN IDENTITY IN USE / REVISE</span><h2 data-theme-project-field="heading">A mark that earns its place.</h2><p data-theme-project-field="description">One clear point of view, carried through the details: scale, material, movement and everyday use.</p></div><div class="rr-identity-gallery__images">' + identityStudies.map(item => '<figure><img src="' + item.src + '" alt="' + item.alt + '" data-theme-project-field="' + item.key + '"><figcaption>' + item.label + '</figcaption></figure>').join('') + '</div></div>',
  fields: [...textFields([['eyebrow','Eyebrow'],['heading','Heading'],['description','Description']]),...identityStudies.flatMap(item=>mediaFields(item.key,item.label))],
  values: { eyebrow:'AN IDENTITY IN USE / REVISE', heading:'A mark that earns its place.', description:'One clear point of view, carried through the details: scale, material, movement and everyday use.',
    ...Object.fromEntries(identityStudies.flatMap(item=>[[item.key,item.src],[item.key+'_alt',item.alt]])) }
});
const productMain = () => section({
  key: 'product_main', name: 'Product information', sourceKind: 'commerce-product',
  html: '<div class="rr-product-detail" data-commerce-binding="product.kind"><div class="rr-product-gallery"><img src="https://themes.inneranimalmedia.com/theme-packages/revise/0.1.4/preview/assets/stock/resolve/media-216610d365.webp" alt="Product media" data-commerce-binding="product.media.primary"></div><div class="rr-product-info"><span data-commerce-binding="product.kind_label">PHYSICAL OBJECT</span><h1 data-commerce-binding="product.title">Product title</h1><strong data-commerce-binding="product.price">Price</strong><p data-commerce-binding="product.description">Product description</p><div class="rr-product-context" data-commerce-binding="product.purchase_context"></div><label data-commerce-binding="product.option_label">CHOOSE AN OPTION</label><select data-commerce-binding="product.options"><option>Choose an option</option></select><button type="button" data-commerce-action="add-to-cart" data-commerce-binding="product.primary_action">Add to bag</button><p data-commerce-binding="product.fulfillment">Fulfillment details</p></div></div>',
  fields: [...mediaFields('image', 'Fallback product media'), ...textFields([['vendor', 'Vendor label'], ['add_label', 'Primary action label']]), field('option_label', 'Option label')],
  values: { image: 'https://themes.inneranimalmedia.com/theme-packages/revise/0.1.4/preview/assets/stock/resolve/media-216610d365.webp', image_alt: 'Product media', vendor: 'REVISE', add_label: 'Add to bag', option_label: 'Choose an option' }
});
const checkoutSection = (key, name, heading, body) => section({
  key, name, sourceKind: 'checkout-step',
  html: `<div class="rr-checkout-section"><h2 data-theme-project-field="heading">${heading}</h2><div data-theme-project-field="body">${body}</div></div>`,
  fields: textFields([['heading', 'Heading'], ['body', 'Supporting content']]), values: { heading, body }
});
const accountSection = (key, name, heading, body, sourceKind = 'customer-account') => section({
  key, name, sourceKind,
  html: `<div class="rr-account-panel"><h2 data-theme-project-field="heading">${heading}</h2><p data-theme-project-field="body">${body}</p><a href="/account/login/" data-theme-project-field="cta">Sign in to continue ↗</a></div>`,
  fields: [...textFields([['heading', 'Heading'], ['body', 'Description'], ['cta', 'Action label']]), field('cta_href', 'Action destination', 'link', { field: 'cta', attribute: 'href' })],
  values: { heading, body, cta: 'Sign in to continue ↗', cta_href: '/account/login/' }
});
const blogIntro = () => intro('blog_intro', 'Journal introduction', '03 / THE JOURNAL', 'Notes from the everyday.', 'A collection of ideas, observations and useful perspectives.');
const articleHeader = () => section({
  key: 'article_header', name: 'Article header', sourceKind: 'cms-article-header',
  html: '<header class="rr-article-header"><span data-theme-project-field="category">Field notes</span><h1 data-theme-project-field="title">A slower kind of progress</h1><p data-theme-project-field="excerpt">A few thoughts on making room for the work that matters.</p><img src="https://themes.inneranimalmedia.com/theme-packages/revise/0.1.4/preview/assets/stock/resolve/media-a70660bfa9.webp" alt="Article cover" data-theme-project-field="cover"></header>',
  fields: [...textFields([['category', 'Category'], ['title', 'Article title'], ['excerpt', 'Excerpt']]), ...mediaFields('cover', 'Cover image')],
  values: { category: 'Field notes', title: 'A slower kind of progress', excerpt: 'A few thoughts on making room for the work that matters.', cover: 'https://themes.inneranimalmedia.com/theme-packages/revise/0.1.4/preview/assets/stock/resolve/media-a70660bfa9.webp', cover_alt: 'Article cover artwork' }
});

const pageDefinitions = [
  { slug: 'home', title: 'Home', route: '/', page_type: 'home', template_key: 'index', sections: [hero(), pageBody('home_statement', 'Editorial statement', 'A point of view', 'Good design is not about adding more. It is about making the everyday feel considered.'), productGrid('home_featured_products', 'Recently considered'), collectionGrid('home_featured_collections', 'Explore by collection')] },
  { slug: 'products', title: 'Products', route: '/products/', page_type: 'product_catalog', template_key: 'products', sections: [intro('products_intro', 'Products introduction', '01 / THE SHOP', 'The considered collection.', 'Useful objects, everyday layers and the pieces that earn their place.'), productGrid('products_grid', 'All products'), pageBody('products_statement', 'Editorial statement', 'Buy less. Choose well.', 'Make it last.')] },
  { slug: 'product-field-jacket', title: 'Product detail', route: '/products/field-jacket/', page_type: 'product', template_key: 'product', sections: [productMain(), pageBody('product_details', 'Product details', 'Details', 'Product-specific information, materials, care and delivery details.'), productGrid('product_recommendations', 'You may also like')] },
  { slug: 'collections', title: 'Collections list', route: '/collections/', page_type: 'collection_list', template_key: 'list-collections', sections: [intro('collections_intro', 'Collections introduction', '02 / THE INDEX', 'Collections, considered.', 'A few different ways into the same point of view.'), collectionGrid('collections_grid', 'All collections')] },
  { slug: 'collection-new-arrivals', title: 'Collection detail', route: '/collections/new-arrivals/', page_type: 'collection', template_key: 'collection', sections: [intro('collection_intro', 'Collection introduction', 'COLLECTION / NEW ARRIVALS', 'New Arrivals', 'Fresh pieces. Familiar purpose.'), productGrid('collection_products', 'Products in this collection')] },
  { slug: 'gift-card', title: 'Gift card', route: '/gift-card/', page_type: 'gift_card', template_key: 'gift-card', sections: [section({ key: 'gift_card_main', name: 'Gift card', sourceKind: 'commerce-gift-card', html: '<div class="rr-gift-layout"><div><h1 data-theme-project-field="heading">A little room to choose.</h1><p data-theme-project-field="description">For the people who know what they like.</p><img src="https://themes.inneranimalmedia.com/theme-packages/revise/0.1.4/preview/revise-detail-paper.webp" alt="Gift card artwork" data-theme-project-field="image"></div><div><h2 data-theme-project-field="options_heading">Choose an amount</h2><div data-theme-project-field="amounts">Gift card denominations</div><button type="button" data-commerce-action="add-gift-card" data-theme-project-field="button_label">Add gift card to bag</button></div></div>', fields: [...mediaFields('image', 'Gift card artwork'), ...textFields([['heading', 'Heading'], ['description', 'Description'], ['options_heading', 'Options heading'], ['amounts', 'Gift card values'], ['button_label', 'Button label']])], values: { image: 'https://themes.inneranimalmedia.com/theme-packages/revise/0.1.4/preview/revise-detail-paper.webp', image_alt: 'Gift card artwork', heading: 'A little room to choose.', description: 'For the people who know what they like.', options_heading: 'Choose an amount', amounts: '$50 · $100 · $150 · $200', button_label: 'Add gift card to bag' } })] },
  { slug: 'cart', title: 'Cart', route: '/cart/', page_type: 'cart', template_key: 'cart', sections: [section({ key: 'cart_main', name: 'Cart', sourceKind: 'commerce-cart', html: '<div class="rr-cart-page"><h1 data-theme-project-field="heading">Your bag.</h1><div data-commerce-region="cart-items"></div><aside data-commerce-region="cart-summary"><span data-theme-project-field="summary_label">Order summary</span><strong data-commerce-binding="cart.total"></strong><a href="/checkout/" data-theme-project-field="checkout_label">Continue to checkout ↗</a></aside></div>', fields: textFields([['heading', 'Heading'], ['summary_label', 'Summary label'], ['checkout_label', 'Checkout button label']]), values: { heading: 'Your bag.', summary_label: 'Order summary', checkout_label: 'Continue to checkout ↗' } })] },
  { slug: 'checkout', title: 'Checkout', route: '/checkout/', page_type: 'checkout', template_key: 'checkout', sections: [checkoutSection('checkout_contact', 'Contact details', 'Contact', 'Customer email and sign-in options.'), checkoutSection('checkout_delivery', 'Delivery details', 'Delivery', 'Address, delivery method and contact details.'), checkoutSection('checkout_payment', 'Payment', 'Payment', 'Secure payment options supplied by the connected provider.'), checkoutSection('checkout_summary', 'Order summary', 'Order summary', 'Line items, discounts, shipping, tax and total.')] },
  { slug: 'account', title: 'Customer account', route: '/account/', page_type: 'customer_account', template_key: 'customers/account', sections: [accountSection('account_overview', 'Account overview', 'Your account', 'Order history, saved details and preferences are available after sign in.')] },
  { slug: 'account-login', title: 'Customer sign in', route: '/account/login/', page_type: 'customer_sign_in', template_key: 'customers/login', sections: [accountSection('account_login', 'Sign in', 'Welcome back.', 'Sign in to see your orders and account details.', 'customer-auth')] },
  { slug: 'account-register', title: 'Customer registration', route: '/account/register/', page_type: 'customer_sign_up', template_key: 'customers/register', sections: [accountSection('account_register', 'Create account', 'Create your account.', 'Keep your details and orders together.', 'customer-auth')] },
  { slug: 'account-orders', title: 'Customer orders', route: '/account/orders/', page_type: 'customer_orders', template_key: 'customers/orders', sections: [accountSection('account_orders', 'Order history', 'Your orders', 'Order history appears after customer authentication and commerce data are connected.')] },
  { slug: 'account-profile', title: 'Customer profile', route: '/account/profile/', page_type: 'customer_profile', template_key: 'customers/profile', sections: [accountSection('account_profile', 'Profile & preferences', 'Profile & preferences', 'Manage customer details and saved delivery information after sign in.')] },
  { slug: 'blog', title: 'Blog index', route: '/blogs/', page_type: 'blog', template_key: 'blog', sections: [blogIntro(), storyGrid('blog_articles', 'Latest stories')] },
  { slug: 'article-field-notes', title: 'Article', route: '/blogs/field-notes/', page_type: 'article', template_key: 'article', sections: [articleHeader(), pageBody('article_body', 'Article body', 'Make space for what matters.', 'The everyday is where most of life happens. The objects we reach for, the routes we take and the time we make for ourselves all shape how a day feels.')] },
  { slug: 'search', title: 'Search', route: '/search/', page_type: 'search', template_key: 'search', sections: [intro('search_intro', 'Search introduction', 'SEARCH / REVISE', 'Find your way.', 'Search products, collections and stories.'), pageBody('search_results', 'Search results', 'Search results', 'Results are supplied by the connected storefront search provider.')] },
  { slug: 'page-about', title: 'About page', route: '/pages/about/', page_type: 'page', template_key: 'page', sections: [intro('about_intro', 'About introduction', 'REVISE / INFORMATION', 'A little more considered.', 'Revise is a point of view on everyday objects: useful, uncomplicated and made to be lived with.'), pageBody('about_body', 'About content', 'Made to be lived with.', 'A clear space for the merchant story, values and approach.')] },
  { slug: 'page-contact', title: 'Contact page', route: '/pages/contact/', page_type: 'page', template_key: 'page.contact', sections: [intro('contact_intro', 'Contact introduction', 'REVISE / CONTACT', 'Start a conversation.', 'Questions about an order, a product or something else?'), pageBody('contact_body', 'Contact content', 'We would be glad to hear from you.', 'Add contact details or connect a working contact form.')] },
  { slug: 'page-shipping-returns', title: 'Shipping & returns', route: '/pages/shipping-returns/', page_type: 'page', template_key: 'page', sections: [intro('shipping_intro', 'Shipping introduction', 'REVISE / INFORMATION', 'Delivery & returns.', 'The practical details, made clear.'), pageBody('shipping_body', 'Shipping policy', 'Delivery information', 'Configure delivery options, shipping rates and return terms for the merchant.')] },
  { slug: 'page-faq', title: 'FAQ page', route: '/pages/faq/', page_type: 'page', template_key: 'page', sections: [intro('faq_intro', 'FAQ introduction', 'REVISE / HELP', 'A few useful answers.', 'The details that help make a decision a little easier.'), pageBody('faq_body', 'FAQ content', 'Frequently asked questions', 'Add answers to the questions customers ask most often.')] },
  { slug: '404', title: '404 page', route: '/404/', page_type: 'not_found', template_key: '404', sections: [section({ key: 'not_found_main', name: 'Not found', sourceKind: 'not-found', html: '<div class="rr-not-found"><span data-theme-project-field="eyebrow">404 / PAGE NOT FOUND</span><h1 data-theme-project-field="heading">Not all paths lead somewhere.</h1><p data-theme-project-field="description">The page you are looking for may have moved.</p><a href="/" data-theme-project-field="cta">Return to the home page ↗</a></div>', fields: textFields([['eyebrow', 'Eyebrow'], ['heading', 'Heading'], ['description', 'Description'], ['cta', 'Action label']]), values: { eyebrow: '404 / PAGE NOT FOUND', heading: 'Not all paths lead somewhere.', description: 'The page you are looking for may have moved.', cta: 'Return to the home page ↗' } })] },
  { slug: 'password', title: 'Password page', route: '/password/', page_type: 'password', template_key: 'password', sections: [section({ key: 'password_main', name: 'Password gate', sourceKind: 'password-gate', html: '<div class="rr-account-auth"><span data-theme-project-field="eyebrow">REVISE / PRIVATE PREVIEW</span><h1 data-theme-project-field="heading">Opening soon.</h1><p data-theme-project-field="description">This storefront is being prepared. Enter the store password to continue.</p><form data-commerce-action="password"><input type="password" placeholder="Store password"><button type="submit" data-theme-project-field="button_label">Enter store</button></form></div>', fields: textFields([['eyebrow', 'Eyebrow'], ['heading', 'Heading'], ['description', 'Description'], ['button_label', 'Button label']]), values: { eyebrow: 'REVISE / PRIVATE PREVIEW', heading: 'Opening soon.', description: 'This storefront is being prepared. Enter the store password to continue.', button_label: 'Enter store' } })] }
];

const homeDefinition = pageDefinitions.find(page => page.slug === 'home');
homeDefinition.sections = [
  hero(),
  pageBody('home_statement', 'What Revise means', 'Revision is progress.', 'To revise is to look again with intention — question what is familiar, improve what is useful and make room for what comes next.'),
  storyChapter('home_chapter_01', '01', 'Look closer.', 'Every meaningful improvement starts by noticing what others have learned to overlook.', 'revise.chapter.01', 'An abstract visual study for re-examining the familiar.', 'Explore the services', '/services/', 'right', 'light'),
  storyChapter('home_chapter_02', '02', 'See another way.', 'Bring strategy, design, technology and the people using them into the same conversation.', 'revise.chapter.02', 'An abstract visual study for reconsidering what is possible.', 'Discover digital editions', '/digital/', 'left', 'light'),
  storyChapter('home_chapter_03', '03', 'Make the next version real.', 'From physical objects to digital tools, focused services and shared experiences, the work should make life better in a tangible way.', 'revise.chapter.03', 'An abstract visual study for making the next version real.', 'Explore experiences', '/experiences/', 'right', 'dark'),
  productGrid('home_services', 'Work, together', serviceItems),
  productGrid('home_digital_editions', 'Tools for the work ahead', digitalItems),
  productGrid('home_experiences', 'Experiences worth making time for', experienceItems),
  identityGallery(),
  productGrid('home_featured_products', 'A few ways to begin', featuredItems),
  collectionGrid('home_featured_collections', 'Explore by intention'),
  storyGrid('home_journal', 'Ideas in motion')
];
pageDefinitions.push(
  { slug: 'services', title: 'Services', route: '/services/', page_type: 'product_catalog', template_key: 'services', sections: [intro('services_intro', 'Services introduction', '02 / WORK TOGETHER', 'Good work starts with a conversation.', 'Focused services for the questions, challenges and opportunities worth getting right.'), productGrid('services_grid', 'Services', serviceItems), pageBody('services_approach', 'How services work', 'Clarity before complexity.', 'A clear scope, a thoughtful process and a useful result. Start with the engagement that fits your next move.')] },
  { slug: 'digital', title: 'Digital editions', route: '/digital/', page_type: 'product_catalog', template_key: 'digital-editions', sections: [intro('digital_intro', 'Digital editions introduction', '03 / DIGITAL EDITIONS', 'Useful tools. Ready when you are.', 'Guides, systems and working files designed to make the next step easier to take.'), productGrid('digital_grid', 'Digital editions', digitalItems), pageBody('digital_approach', 'Digital delivery', 'Made to be used.', 'Digital products should do more than look finished. They should help you make progress.')] },
  { slug: 'experiences', title: 'Experiences', route: '/experiences/', page_type: 'product_catalog', template_key: 'experiences', sections: [intro('experiences_intro', 'Experiences introduction', '04 / SHARED EXPERIENCES', 'Change the view. Change the outcome.', 'Workshops and guided sessions for people who want to learn, rethink and make something together.'), productGrid('experiences_grid', 'Experiences', experienceItems), pageBody('experiences_approach', 'Experience details', 'Make time for it.', 'A good experience gives you more than a moment. It gives you a new way to see what comes next.')] },
  { slug: 'product-field-guide', title: 'Digital product detail', route: '/products/field-guide/', page_type: 'product', template_key: 'product', sections: [productMain(), pageBody('field_guide_details', 'Digital edition details', 'Open it. Put it to work.', 'License, format, access and delivery details are supplied by the digital product record.'), productGrid('field_guide_recommendations', 'More useful tools', digitalItems)] },
  { slug: 'product-brand-direction', title: 'Service detail', route: '/products/brand-direction/', page_type: 'product', template_key: 'product', sections: [productMain(), pageBody('brand_direction_details', 'Service details', 'Clarity before complexity.', 'Scope, timeline, deliverables and scheduling are supplied by the service product record.'), productGrid('service_recommendations', 'Work together', serviceItems)] },
  { slug: 'product-studio-workshop', title: 'Experience detail', route: '/products/studio-workshop/', page_type: 'product', template_key: 'product', sections: [productMain(), pageBody('studio_workshop_details', 'Experience details', 'Better together.', 'Session availability, location, capacity and included details are supplied by the experience product record.'), productGrid('experience_recommendations', 'Other experiences', experienceItems)] },
  { slug: 'collection-services', title: 'Services collection', route: '/collections/services/', page_type: 'collection', template_key: 'collection', sections: [intro('services_collection_intro', 'Services collection introduction', 'COLLECTION / SERVICES', 'Work, together.', 'Focused engagements that turn questions into useful outcomes.'), productGrid('services_collection_products', 'Services', serviceItems)] },
  { slug: 'collection-digital-editions', title: 'Digital editions collection', route: '/collections/digital-editions/', page_type: 'collection', template_key: 'collection', sections: [intro('digital_collection_intro', 'Digital editions collection introduction', 'COLLECTION / DIGITAL EDITIONS', 'Tools for the work ahead.', 'Guides, systems and digital editions made to be used.'), productGrid('digital_collection_products', 'Digital editions', digitalItems)] },
  { slug: 'collection-experiences', title: 'Experiences collection', route: '/collections/experiences/', page_type: 'collection', template_key: 'collection', sections: [intro('experiences_collection_intro', 'Experiences collection introduction', 'COLLECTION / EXPERIENCES', 'Experiences worth making time for.', 'Shared sessions designed to shift perspective.'), productGrid('experiences_collection_products', 'Experiences', experienceItems)] }
);

function attachGlobals(page) {
  if (page.page_type === 'checkout') return [header(), ...page.sections];
  if (page.page_type === 'password') return page.sections;
  return [announcement(), header(), ...page.sections, footer()];
}
function pageTemplate(page, sections) {
  const markers = sections.map(item => `<!--theme-section:${item.key}-->`).join('');
  return `<!doctype html><html lang="en"><head><base href="${assetBase}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${page.title} — Revise</title><link rel="stylesheet" href="${assetBase}revise-remaster.css"></head><body><div id="app">${markers}</div></body></html>`;
}
const pages = pageDefinitions.map((definition, index) => {
  const sections = attachGlobals(definition).map((item, sectionIndex) => ({ ...item, sort_order: sectionIndex + 1 }));
  return {
    slug: definition.slug,
    title: definition.title,
    page_type: definition.page_type,
    template_key: definition.template_key,
    sourceRoute: definition.route,
    assetBase,
    status: 'draft',
    template: pageTemplate(definition, sections),
    sections
  };
});
const project = {
  schema: 'agentsam.theme-project.v1',
  id: 'theme_revise',
  name: 'Revise',
  version: '0.1.0',
  revision: 0,
  sourceThemeId: 'revise',
  sourcePackage: '@inneranimalmedia/theme-revise',
  sourcePackageVersion: packageVersion,
  sourcePreviewUrl: assetBase,
  sourceReleaseSha256: releaseSha256,
  sourceCmsManifestSchema: 'iam.theme-package.v1',
  sourceManifestPageCount: pages.length,
  sourceRoutesNotRendered: [],
  sourcePagesDetected: pages.length,
  sourceAssetErrors: [],
  tokens: {},
  pages
};
const output = new URL('../install-project.json', import.meta.url);
fs.writeFileSync(output, JSON.stringify(project, null, 2) + '\n');
console.log(JSON.stringify({
  output: output.pathname,
  pages: pages.length,
  sections: pages.reduce((sum, page) => sum + page.sections.length, 0),
  fields: pages.reduce((sum, page) => sum + page.sections.reduce((count, section) => count + section.schema.fields.length, 0), 0),
  blocks: pages.reduce((sum, page) => sum + page.sections.reduce((count, section) => count + section.content.__editor.blocks.length, 0), 0),
  routes: pages.map(page => `${page.page_type}: ${page.sourceRoute}`)
}, null, 2));
