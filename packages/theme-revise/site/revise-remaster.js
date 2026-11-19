(async () => {
  const BASE = '/theme-packages/revise/0.1.4/preview/';
  const BASE_PATH = BASE === '/' ? '' : BASE.replace(/\/$/, '');
  const STORE_KEY = 'revise-remaster-cart-v1';
  const demoResponse = await fetch(new URL('fixtures/revise-demo.json', document.baseURI), { cache: 'no-store' });
  if (!demoResponse.ok) throw new Error(`Revise demo catalog could not be loaded (${demoResponse.status}).`);
  const demo = await demoResponse.json();
  const { products, collections, stories, chapters } = demo;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const asset = file => `${BASE}${String(file).replace(/^\/+/, '')}`;
  const href = path => `${BASE}${String(path || '/').replace(/^\/+/, '')}`;
  const routePath = () => {
    let path = location.pathname;
    if (BASE_PATH && path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length) || '/';
    if (!path.startsWith('/')) path = `/${path}`;
    return path === '/' ? '/' : `/${path.split('/').filter(Boolean).join('/')}/`;
  };
  const findProduct = id => products.find(product => product.id === id);
  const getCart = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
  };
  let cart = getCart();
  const saveCart = () => localStorage.setItem(STORE_KEY, JSON.stringify(cart));
  const cartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lineKey = (id, variant) => `${id}::${variant}`;
  const link = (label, path, cls = '') => `<a class="${cls}" href="${href(path)}" data-link>${label}</a>`;
  const button = (label, attrs = '') => `<button type="button" ${attrs}>${label}</button>`;
  const image = (file, alt, cls = '') => `<img class="${cls}" src="${asset(file)}" alt="${esc(alt)}" loading="lazy">`;
  const announce = message => {
    const toast = $('[data-toast]');
    if (toast) {
      toast.textContent = message;
      toast.classList.add('is-visible');
      clearTimeout(announce.timer);
      announce.timer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
    }
  };
  const addToCart = (product, variant, quantity = 1, extra = {}) => {
    const key = lineKey(product.id, variant);
    const existing = cart.find(item => item.key === key);
    if (existing) existing.quantity += quantity;
    else cart.push({ key, id: product.id, title: product.title, kind: product.kind || 'physical', type: product.type || 'Product', variant, optionLabel: product.optionLabel || 'Option', price: Number(extra.price ?? product.price ?? 0), image: product.image || 'assets/stock/resolve/media-216610d365.webp', quantity, meta: extra.meta || null });
    saveCart();
    render();
    announce(`${product.title} added to your bag`);
  };
  const updateQuantity = (key, amount) => {
    const line = cart.find(item => item.key === key);
    if (!line) return;
    line.quantity += amount;
    if (line.quantity < 1) cart = cart.filter(item => item.key !== key);
    saveCart();
    render();
  };
  const removeLine = key => { cart = cart.filter(item => item.key !== key); saveCart(); render(); };
  const header = () => `
    <div class="rr-announcement"><span>Consider what could be better.</span><span>Thoughtful work, useful things, new perspectives.</span></div>
    <header class="rr-header">
      <div class="rr-header__left">
        ${button('<span class="rr-menu-icon"><i></i><i></i></span><span>Menu</span>', 'data-menu-toggle aria-label="Open navigation" aria-haspopup="dialog"')}
        ${link('Shop', '/products/', 'rr-header__link')}
        ${link('Services', '/services/', 'rr-header__link rr-header__link--secondary')}
      </div>
      <a class="rr-wordmark" href="${href('/')}" data-link aria-label="Revise home"><img src="${asset('revise-custom-wordmark.svg')}" alt="Revise" loading="eager" decoding="async"></a>
      <div class="rr-header__right">
        ${link('Experiences', '/experiences/', 'rr-header__link rr-header__link--secondary')}
        ${link('Journal', '/blogs/', 'rr-header__link')}
        ${button('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 5 5"/></svg><span>Search</span>', 'data-search-toggle aria-label="Search"')}
        ${link('Account', '/account/', 'rr-header__link')}
        ${link(`Bag <span class="rr-bag-count">${cartCount()}</span>`, '/cart/', 'rr-bag-link')}
      </div>
    </header>`;
  const footer = () => `
    <footer class="rr-footer">
      <div class="rr-footer__top">
        <div class="rr-footer__brand"><a href="${href('/')}" data-link aria-label="Revise home"><img src="${asset('revise-custom-wordmark.svg')}" alt="Revise"></a><p>Look again. Make it better.</p><small>Services, objects and experiences for ideas ready to move forward.</small></div>
        <div class="rr-footer__col"><span>Explore</span>${link('Shop all', '/products/')}${link('Services', '/services/')}${link('Digital editions', '/digital/')}${link('Experiences', '/experiences/')}${link('Collections', '/collections/')}${link('Gift cards', '/gift-card/')}</div>
        <div class="rr-footer__col"><span>Information</span>${link('Our approach', '/pages/about/')}${link('Contact', '/pages/contact/')}${link('Shipping & returns', '/pages/shipping-returns/')}${link('FAQ', '/pages/faq/')}${link('Customer account', '/account/')}</div>
        <form class="rr-newsletter" data-newsletter><label for="rr-email">The occasional good thing.</label><p>Notes on new releases, useful ideas and what is next.</p><div><input id="rr-email" type="email" placeholder="Email address" required><button type="submit" aria-label="Subscribe">↗</button></div><small data-form-message>Occasional notes. No noise.</small></form>
      </div>
      <div class="rr-footer__bottom"><span>© 2026 REVISE STUDIO</span><span>Re-examine. Reconsider. Make it better.</span><span>Thoughtfully made. Open to interpretation.</span></div>
    </footer>`;
  const menu = () => `
    <div class="rr-menu" data-menu data-open="false" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Main navigation">
      <div class="rr-menu__top"><span><img class="rr-menu__mark" src="${asset('revise-custom-s.svg')}" alt=""> REVISE / INDEX</span>${button('Close <b>×</b>', 'data-menu-close aria-label="Close navigation"')}</div>
      <div class="rr-menu__body">
        <nav class="rr-menu__nav" aria-label="Full navigation">
          <span class="rr-kicker">Find your way</span>
          ${link('Shop all', '/products/', 'rr-menu__link')}
          ${link('Services', '/services/', 'rr-menu__link')}
          ${link('Digital editions', '/digital/', 'rr-menu__link')}
          ${link('Experiences', '/experiences/', 'rr-menu__link')}
          ${link('Collections', '/collections/', 'rr-menu__link')}
          ${link('Journal', '/blogs/', 'rr-menu__link')}
          <div class="rr-menu__secondary">${link('Our approach', '/pages/about/')}${link('Gift cards', '/gift-card/')}${link('Customer account', '/account/')}${link('Contact', '/pages/contact/')}</div>
        </nav>
        <div class="rr-menu__feature">${image('assets/stock/resolve/media-216610d365.webp', 'Revise editorial collection photography')}<div><span>THE REVISE APPROACH</span><p>Better questions. Better work.</p>${link('See how we work ↗', '/pages/about/')}</div></div>
      </div>
      <div class="rr-menu__bottom"><span>RE-EXAMINE / RECONSIDER / REFINE</span><span>Make the next version matter.</span><span>01 — 06</span></div>
    </div>`;
  const searchOverlay = () => `
    <div class="rr-search" data-search data-open="false" aria-hidden="true">
      <div class="rr-search__top"><span>SEARCH / REVISE</span>${button('Close ×', 'data-search-close')}</div>
      <form data-search-form><label for="rr-search-input">What are you looking for?</label><div><input id="rr-search-input" name="q" type="search" placeholder="Products, services, digital editions, experiences…" autocomplete="off"><button type="submit" aria-label="Submit search">↗</button></div></form>
      <p>EXPLORE: ${link('Services', '/services/')} · ${link('Digital editions', '/digital/')} · ${link('Experiences', '/experiences/')}</p>
    </div>`;
  const pageIntro = (eyebrow, title, description, extra = '') => `
    <section class="rr-page-intro"><div class="rr-page-intro__meta"><span>${eyebrow}</span><span>REVISE / 2026</span></div><div class="rr-page-intro__main"><h1>${title}</h1><div><p>${description}</p>${extra}</div></div></section>`;
  const kindLabels = { physical: 'Physical object', digital: 'Digital edition', service: 'Service', experience: 'Experience' };
  const kindActions = { physical: 'Explore object', digital: 'Explore edition', service: 'Explore service', experience: 'Explore experience' };
  const productCard = product => {
    const kind = product.kind || 'physical';
    return `<article class="rr-product-card" data-kind="${esc(kind)}">
      <a class="rr-product-card__image" href="${href(`/products/${product.id}/`)}" data-link>
        ${image(product.image, product.title)}<span class="rr-product-card__kind">${esc(kindLabels[kind])}</span>
        ${product.badge ? `<span class="rr-product-card__badge">${esc(product.badge)}</span>` : ''}
        <span class="rr-product-card__index">${String(products.indexOf(product) + 1).padStart(2, '0')}</span>
      </a>
      <div class="rr-product-card__meta"><div><span>${esc(product.type)}</span><h3>${link(esc(product.title), `/products/${product.id}/`)}</h3><p>${esc(product.shortDescription || product.description)}</p></div><strong>${esc(product.priceLabel || money(product.price))}</strong></div>
      <div class="rr-product-card__actions">${link(`${kindActions[kind]} ↗`, `/products/${product.id}/`)}${kind === 'physical' ? button('Quick add +', `data-quick-add="${esc(product.id)}"`) : `<span>${kind === 'digital' ? 'Instant access' : kind === 'service' ? 'Made together' : 'Limited sessions'}</span>`}</div>
    </article>`;
  };
  const collectionCard = collection => `
    <article class="rr-collection-card" data-collection-kind="${esc(collection.kind || 'mixed')}">
      <a href="${href(`/collections/${collection.id}/`)}" data-link class="rr-collection-card__image">${image(collection.image, collection.title)}<span>${String(collection.products.length).padStart(2, '0')} WAYS IN</span></a>
      <div class="rr-collection-card__meta"><div><span>${esc((collection.kind || 'mixed').toUpperCase())} / COLLECTION</span><h2>${link(esc(collection.title), `/collections/${collection.id}/`)}</h2><p>${esc(collection.description)}</p></div>${link('Explore ↗', `/collections/${collection.id}/`)}</div>
    </article>`;
  const productGrid = (items = products) => `<div class="rr-product-grid">${items.map(productCard).join('')}</div>`;
  const collectionGrid = (items = collections) => `<div class="rr-collection-grid rr-collection-grid--three">${items.map(collectionCard).join('')}</div>`;
  const homePage = () => {
    const featured = ['brand-direction', 'field-guide', 'field-jacket', 'studio-workshop'].map(findProduct).filter(Boolean);
    return `<main id="main-content">
      <section class="rr-home-hero rr-home-hero--campaign">
        <div class="rr-home-hero__photo"><img class="rr-home-hero__image" src="${asset('revise-campaign-hero.webp')}" alt="Revise branded storefront and considered merchandise" loading="eager" decoding="async" fetchpriority="high"></div>
        <div class="rr-home-hero__shade"></div>
        <div class="rr-home-hero__top"><span>REVISE / BRAND EXPRESSION</span><span>RE-EXAMINE. RECONSIDER. REFINE.</span></div>
        <div class="rr-home-hero__copy"><span class="rr-kicker">RE-EXAMINE / RECONSIDER / REFINE</span><h1>Designed to<br><em>make it better.</em></h1><p>Services, objects and experiences for ideas ready to move forward.</p><div>${link('Explore the collection ↗', '/products/', 'rr-button rr-button--light')}${link('Our approach', '/pages/about/', 'rr-text-link rr-text-link--light')}</div></div>
        <div class="rr-home-hero__bottom"><span>01 / 11</span><span>SCROLL TO EXPLORE ↓</span><span>EST. 2026</span></div>
      </section>
      <section class="rr-home-statement"><div class="rr-section-label"><span>01 — THE MEANING</span><span>REVISION IS PROGRESS</span></div><p>To revise is to <em>look again with intention</em> — question what is familiar, improve what is useful and make room for what comes next.</p></section>
      <section class="rr-scroll-story" data-scroll-story data-active-chapter="0">
        <div class="rr-scroll-story__stage">
          ${chapters.map((chapter, index) => `<figure class="rr-scroll-story__scene" data-scene-image="${index}">${image(chapter.image, chapter.title)}<figcaption><span>${chapter.number} / 03</span><span>${esc(chapter.eyebrow)}</span></figcaption></figure>`).join('')}
          <div class="rr-scroll-story__stage-copy"><span data-scene-number>01 / 03</span><h3 data-scene-title>${esc(chapters[0].title)}</h3><span>THE REVISE METHOD</span></div>
        </div>
        <div class="rr-scroll-story__chapters">
          <div class="rr-scroll-story__intro"><span class="rr-kicker">A practice of improvement</span><h2>Good work is<br>never just a first draft.</h2><p>Each chapter is a different way to move an idea forward.</p></div>
          ${chapters.map((chapter, index) => `<article class="rr-scroll-chapter${index === 0 ? ' is-active' : ''}" data-chapter-index="${index}"><span>${chapter.number} / ${esc(chapter.eyebrow)}</span><h3>${esc(chapter.title)}</h3><p>${esc(chapter.body)}</p>${link(`${esc(chapter.cta)} ↗`, chapter.href, 'rr-text-link')}</article>`).join('')}
        </div>
      </section>
      <section class="rr-offerings"><div class="rr-section-heading"><div><span class="rr-kicker">MORE THAN A CATALOG</span><h2>Different ways to<br>make something better.</h2></div><p>Choose the kind of progress that fits the moment.</p></div>
        <div class="rr-offering-grid">
          <a class="rr-offering-card rr-offering-card--service" href="${href('/services/')}" data-link>${image('revise-campaign-hero.webp', 'Revise editorial storefront study')}<span>01 / SERVICES</span><h3>Work, together.</h3><p>Focused expertise, thoughtful collaboration and outcomes you can use.</p><b>Explore services ↗</b></a>
          <a class="rr-offering-card rr-offering-card--digital" href="${href('/digital/')}" data-link>${image('revise-detail-paper.webp', 'Revise printed edition closeup')}<span>02 / DIGITAL</span><h3>Tools for the work ahead.</h3><p>Guides, systems and digital editions made to move ideas forward.</p><b>Explore digital ↗</b></a>
          <a class="rr-offering-card rr-offering-card--experience" href="${href('/experiences/')}" data-link>${image('revise-detail-stitch.webp', 'Revise material detail')}<span>03 / EXPERIENCES</span><h3>Step into another perspective.</h3><p>Workshops and shared experiences that create room to see differently.</p><b>Explore experiences ↗</b></a>
        </div>
      </section>
      <section class="rr-identity-gallery" aria-labelledby="rr-identity-title">
        <div class="rr-identity-gallery__intro"><span class="rr-kicker">AN IDENTITY IN USE / REVISE</span><h2 id="rr-identity-title">A mark that<br><em>earns its place.</em></h2><p>One clear point of view, carried through the details: scale, material, movement and everyday use.</p></div>
        <div class="rr-identity-gallery__images">
          <figure>${image('revise-identity-card.webp','Revise custom S construction and wordmark')}<figcaption>01 / THE MARK</figcaption></figure>
          <figure>${image('revise-detail-cap.webp','Revise embroidered cap identity study')}<figcaption>02 / EMBROIDERY</figcaption></figure>
          <figure>${image('revise-detail-garment.webp','Revise woven neck label identity study')}<figcaption>03 / GARMENT LABEL</figcaption></figure>
          <figure>${image('revise-detail-tag.webp','Revise branded hang tag identity study')}<figcaption>04 / HANG TAG</figcaption></figure>
          <figure>${image('revise-detail-paper.webp','Revise embossed paper identity study')}<figcaption>05 / PAPER</figcaption></figure>
        </div>
      </section>
      <section class="rr-section rr-section--products"><div class="rr-section-heading"><div><span class="rr-kicker">A FEW WAYS TO BEGIN</span><h2>Choose your next move.</h2></div>${link('View everything ↗', '/products/', 'rr-text-link')}</div>${productGrid(featured)}</section>
      <section class="rr-home-collections"><div class="rr-section-heading"><div><span class="rr-kicker">FIND YOUR WAY IN</span><h2>Explore by intention.</h2></div>${link('All collections ↗', '/collections/', 'rr-text-link')}</div>${collectionGrid(collections.slice(0, 3))}</section>
      <section class="rr-home-journal"><div><span class="rr-kicker">THE JOURNAL / IDEAS IN MOTION</span><h2>Keep asking<br>better questions.</h2>${link('Read the journal ↗', '/blogs/', 'rr-button rr-button--dark')}</div><div class="rr-home-journal__stories">${stories.slice(0, 2).map(story => `<a href="${href(`/blogs/${story.id}/`)}" data-link><span>${esc(story.category)} / ${esc(story.date)}</span><strong>${esc(story.title)}</strong><small>Read the story ↗</small></a>`).join('')}</div></section>
    </main>`;
  };
  let activeProductFilter = 'all';
  let activeSort = 'featured';
  const getVisibleProducts = () => {
    let items = activeProductFilter === 'all' ? products.slice() : products.filter(product => product.kind === activeProductFilter);
    if (activeSort === 'price-asc') items.sort((a, b) => a.price - b.price);
    if (activeSort === 'price-desc') items.sort((a, b) => b.price - a.price);
    if (activeSort === 'title') items.sort((a, b) => a.title.localeCompare(b.title));
    return items;
  };
  const filterMarkup = () => {
    const filters = [['all', 'Everything'], ['physical', 'Objects'], ['digital', 'Digital'], ['service', 'Services'], ['experience', 'Experiences']];
    return `<div class="rr-filter-tabs" role="group" aria-label="Filter offerings">${filters.map(([key, label]) => `<button type="button" data-filter="${key}" aria-pressed="${activeProductFilter === key}">${label}</button>`).join('')}</div>`;
  };
  const sortMarkup = () => `<label for="rr-sort">SORT BY</label><select id="rr-sort" data-sort><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="title">Name</option></select>`;
  const productsPage = () => `<main id="main-content">${pageIntro('01 / THE CATALOGUE', 'A collection of<br>ways to move forward.', 'Physical goods, digital tools, services and experiences — each with its own way to be discovered.')}
    <section class="rr-catalog"><div class="rr-catalog__toolbar"><div>${filterMarkup()}</div><div class="rr-catalog__sort">${sortMarkup()}</div></div><div class="rr-catalog__count" data-product-count>${products.length} WAYS TO BEGIN</div><div data-product-results>${productGrid(getVisibleProducts())}</div></section>
    <section class="rr-editorial-strip"><span>REVISE / PRINCIPLE 01</span><p>Choose what helps. Keep what works. Leave room to improve.</p>${link('Our approach ↗', '/pages/about/', 'rr-text-link')}</section></main>`;
  const curatedCatalogPage = (kind, eyebrow, title, description, note) => {
    const items = products.filter(product => product.kind === kind);
    return `<main id="main-content">${pageIntro(eyebrow, title, description)}<section class="rr-catalog rr-catalog--curated"><div class="rr-catalog__toolbar"><span>${items.length} ${kindLabels[kind].toUpperCase()}S</span><span>REVISE / 2026</span></div>${productGrid(items)}</section><section class="rr-curated-note"><span>${kindLabels[kind].toUpperCase()} / THE REVISE APPROACH</span><p>${note}</p></section></main>`;
  };
  const servicesPage = () => curatedCatalogPage('service', '02 / WORK TOGETHER', 'Good work<br>starts with a conversation.', 'Focused services for the questions, challenges and opportunities worth getting right.', 'A clear scope, a thoughtful process and a useful result. Start with the engagement that fits your next move.');
  const digitalPage = () => curatedCatalogPage('digital', '03 / DIGITAL EDITIONS', 'Useful tools.<br>Ready when you are.', 'Guides, systems and working files designed to make the next step easier to take.', 'Digital products should do more than look finished. They should help you make progress.');
  const experiencesPage = () => curatedCatalogPage('experience', '04 / SHARED EXPERIENCES', 'Change the view.<br>Change the outcome.', 'Workshops and guided sessions for people who want to learn, rethink and make something together.', 'A good experience gives you more than a moment. It gives you a new way to see what comes next.');
  const productExperience = product => {
    if (product.kind === 'service') return `<section class="rr-product-story rr-product-story--service"><div><span class="rr-kicker">HOW WE WORK</span><h2>Clarity before<br>complexity.</h2><p>Every engagement begins with the right questions. Together, we define what matters, agree on the work and leave with a direction that can be put into practice.</p>${link('Ask a question ↗', '/pages/contact/', 'rr-text-link')}</div><ol><li><span>01</span><div><strong>Understand</strong><p>Get clear on the challenge and the opportunity.</p></div></li><li><span>02</span><div><strong>Shape</strong><p>Agree on a focused direction and useful scope.</p></div></li><li><span>03</span><div><strong>Move forward</strong><p>Leave with decisions, deliverables and next steps.</p></div></li></ol></section>`;
    if (product.kind === 'digital') return `<section class="rr-product-story rr-product-story--digital"><div><span class="rr-kicker">MADE TO BE USED</span><h2>Open it.<br>Put it to work.</h2><p>Digital editions are designed for real projects, not a folder you forget about. Choose the license that fits the way you work.</p></div><div class="rr-digital-spec"><span>DELIVERY</span><strong>${esc(product.fulfillment || 'Digital delivery')}</strong><span>FORMAT</span><strong>${esc(product.format || 'Digital files')}</strong><span>ACCESS</span><strong>Available after checkout</strong></div></section>`;
    if (product.kind === 'experience') return `<section class="rr-product-story rr-product-story--experience"><div><span class="rr-kicker">MAKE TIME FOR IT</span><h2>Better together.</h2><p>Small groups create room for questions, honest conversation and new perspectives. Choose a session above and reserve the number of places you need.</p></div><div class="rr-experience-spec"><span>WHERE</span><strong>${esc(product.venue || 'Location shared after booking')}</strong><span>GROUP</span><strong>${esc(product.capacity || 'Limited places')}</strong><span>WHAT TO EXPECT</span><strong>${esc((product.details || []).join(' · '))}</strong></div></section>`;
    return `<section class="rr-product-story rr-product-story--physical"><div><span class="rr-kicker">CONSIDERED IN EVERY DETAIL</span><h2>Made for use.<br>Made to last.</h2><p>Useful things earn their place through the details: the way they feel, the way they work and the way they fit into everyday life.</p></div><div class="rr-physical-spec"><span>COLOUR</span><strong>${esc(product.color || 'As shown')}</strong><span>FULFILMENT</span><strong>${esc(product.fulfillment || 'Delivery options at checkout')}</strong><span>CARE</span><strong>Product care details supplied with your order</strong></div></section>`;
  };
  const productPage = product => {
    if (!product) return notFoundPage();
    const kind = product.kind || 'physical';
    const options = (product.variants || ['One size']).map((variant, index) => `<option value="${esc(variant)}" ${index === 0 ? 'selected' : ''}>${esc(variant)}</option>`).join('');
    const details = (product.details || []).map(detail => `<li>${esc(detail)}</li>`).join('');
    const price = product.priceLabel || money(product.price);
    const action = kind === 'service' ? 'Add engagement to bag' : kind === 'experience' ? 'Reserve a place' : kind === 'digital' ? 'Add digital edition' : 'Add to bag';
    return `<main id="main-content"><div class="rr-breadcrumb">${link('Home', '/')} / ${link('Shop', '/products/')} / <span>${esc(product.title)}</span></div>
      <section class="rr-product-detail rr-product-detail--${esc(kind)}" data-product-kind="${esc(kind)}">
        <div class="rr-product-gallery"><div class="rr-product-gallery__main">${image(product.image, product.title)}<span>${esc(kindLabels[kind].toUpperCase())} / REVISE</span></div><div class="rr-product-gallery__caption"><span>01 / ${String(products.indexOf(product) + 1).padStart(2, '0')}</span><span>${esc(product.type)}</span></div></div>
        <div class="rr-product-info"><span class="rr-kicker">${esc(product.type)} / ${esc(kindLabels[kind])}</span><h1>${esc(product.title)}</h1><div class="rr-product-price"><strong>${esc(price)}</strong>${product.compareAt ? `<del>${money(product.compareAt)}</del>` : ''}</div><p class="rr-product-description">${esc(product.description)}</p>
          <div class="rr-product-context">
            ${kind === 'service' ? `<div><span>FORMAT</span><strong>Collaborative engagement</strong></div><div><span>TIMELINE</span><strong>${esc(product.timeline || 'Agreed together')}</strong></div>` : ''}
            ${kind === 'digital' ? `<div><span>FORMAT</span><strong>${esc(product.format || 'Digital edition')}</strong></div><div><span>DELIVERY</span><strong>${esc(product.fulfillment || 'Digital delivery')}</strong></div>` : ''}
            ${kind === 'experience' ? `<div><span>LOCATION</span><strong>${esc(product.venue || 'Shared after booking')}</strong></div><div><span>AVAILABILITY</span><strong>${esc(product.capacity || 'Limited places')}</strong></div>` : ''}
            ${kind === 'physical' ? `<div><span>COLOUR</span><strong>${esc(product.color || 'As shown')}</strong></div><div><span>FULFILMENT</span><strong>${esc(product.fulfillment || 'Delivery at checkout')}</strong></div>` : ''}
          </div>
          <label class="rr-field-label" for="rr-variant">${esc(product.optionLabel || 'Choose an option').toUpperCase()}</label><select id="rr-variant" data-variant>${options}</select>
          <label class="rr-field-label" for="rr-quantity">${kind === 'experience' ? 'PLACES' : 'QUANTITY'}</label><div class="rr-quantity"><button type="button" data-qty="-1" aria-label="Decrease quantity">−</button><input id="rr-quantity" data-quantity type="number" min="1" value="1" inputmode="numeric"><button type="button" data-qty="1" aria-label="Increase quantity">+</button></div>
          <button class="rr-button rr-button--dark rr-add-button" type="button" data-add-to-cart="${esc(product.id)}">${action} — ${esc(price)} ↗</button>
          <p class="rr-product-note">${kind === 'service' ? 'Your selected engagement is added to the bag. Project details are confirmed together.' : kind === 'experience' ? 'Your selected session is saved with your bag. Final confirmation follows checkout.' : kind === 'digital' ? 'Digital access is delivered after checkout.' : 'Delivery options and return details are shown before checkout.'}</p>
          <div class="rr-accordions"><details open><summary>What is included</summary><ul class="rr-detail-list">${details}</ul></details><details><summary>Details & delivery</summary><p>${esc(product.description)} ${esc(product.fulfillment || 'Further details are supplied with your order.')}</p></details><details><summary>Questions?</summary><p>Need help choosing? ${link('Talk with the studio ↗', '/pages/contact/', 'rr-inline-link')}</p></details></div>
        </div>
      </section>${productExperience(product)}
      <section class="rr-section"><div class="rr-section-heading"><div><span class="rr-kicker">KEEP EXPLORING</span><h2>Another way forward.</h2></div>${link('View everything ↗', '/products/', 'rr-text-link')}</div>${productGrid(products.filter(item => item.id !== product.id).slice(0, 3))}</section>
    </main>`;
  };
  const collectionsPage = () => `<main id="main-content">${pageIntro('05 / THE INDEX', 'Collections,<br>with intention.', 'A few different ways into the same point of view. Start with what you need, or follow your curiosity.')}<section class="rr-collection-index">${collectionGrid()}</section></main>`;
  const collectionPage = collection => {
    if (!collection) return notFoundPage();
    const items = collection.products.map(findProduct).filter(Boolean);
    return `<main id="main-content">${pageIntro(`COLLECTION / ${collection.id.toUpperCase()}`, esc(collection.title), esc(collection.description), link('View all collections ↗', '/collections/', 'rr-text-link'))}<section class="rr-collection-banner">${image(collection.image, collection.title)}<div><span>${esc((collection.kind || 'mixed').toUpperCase())} / THE REVISE EDIT</span><p>${esc(collection.description)}</p></div></section><section class="rr-catalog"><div class="rr-catalog__toolbar"><span>${items.length} WAYS IN</span><span>${esc(collection.title.toUpperCase())}</span></div>${productGrid(items)}</section></main>`;
  };
  const giftCardPage = () => `
    <main id="main-content"><section class="rr-gift-layout">
      <div class="rr-gift-copy"><span class="rr-kicker">A THOUGHTFUL GESTURE</span><h1>A little room<br>to <em>choose.</em></h1><p>For the people who know what they like. A gift card leaves the choice where it belongs.</p><div class="rr-gift-card-art"><span>REVISE</span><b>MAKE ROOM<br>FOR WHAT MATTERS.</b><small>GIFT CARD / 2026</small></div></div>
      <form class="rr-gift-form" data-gift-form><span class="rr-kicker">GIFT CARD DETAILS</span><h2>Choose an amount</h2><div class="rr-gift-values">${[50, 100, 150, 200].map((value, index) => `<label><input type="radio" name="gift-value" value="${value}" ${index === 1 ? 'checked' : ''}><span>${money(value)}</span></label>`).join('')}</div>
        <label class="rr-field-label" for="rr-gift-recipient">RECIPIENT NAME</label><input id="rr-gift-recipient" name="recipient" placeholder="Name (optional)">
        <label class="rr-field-label" for="rr-gift-email">RECIPIENT EMAIL</label><input id="rr-gift-email" name="recipient-email" type="email" placeholder="Email address">
        <label class="rr-field-label" for="rr-gift-date">DELIVERY DATE</label><input id="rr-gift-date" name="delivery-date" type="date">
        <label class="rr-field-label" for="rr-gift-message">A SHORT NOTE</label><textarea id="rr-gift-message" name="message" rows="3" placeholder="Add a note (optional)"></textarea>
        <button class="rr-button rr-button--dark" type="submit">Add gift card to bag ↗</button><small>Digital gift cards are delivered by email. Delivery details are confirmed at checkout.</small>
      </form>
    </section></main>`;
  const cartPage = () => {
    const rows = cart.map(item => `<article class="rr-cart-line" data-kind="${esc(item.kind || 'physical')}"><a class="rr-cart-line__image" href="${href(`/products/${item.id}/`)}" data-link>${image(item.image, item.title)}</a><div class="rr-cart-line__details"><span>${esc(item.title)}</span><small>${esc(kindLabels[item.kind] || item.type)} · ${esc(item.optionLabel || 'Option')}: ${esc(item.variant)}</small>${item.meta?.recipient ? `<small>For ${esc(item.meta.recipient)}</small>` : ''}<button type="button" data-remove="${esc(item.key)}">Remove</button></div><div class="rr-cart-line__qty"><button type="button" data-cart-qty="${esc(item.key)}" data-amount="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-cart-qty="${esc(item.key)}" data-amount="1" aria-label="Increase quantity">+</button></div><strong>${money(item.price * item.quantity)}</strong></article>`).join('');
    return `<main id="main-content"><section class="rr-cart-page"><div class="rr-page-intro__meta"><span>YOUR BAG / ${String(cartCount()).padStart(2, '0')} ITEMS</span><span>REVISE / 2026</span></div><div class="rr-cart-heading"><h1>Your bag.</h1>${link('Continue exploring ↗', '/products/', 'rr-text-link')}</div>${cart.length ? `<div class="rr-cart-layout"><div class="rr-cart-lines">${rows}</div><aside class="rr-cart-summary"><span>ORDER SUMMARY</span><div><span>Subtotal</span><strong>${money(cartTotal())}</strong></div><p>Shipping, applicable taxes and service details are confirmed at checkout.</p><button class="rr-button rr-button--dark" type="button" data-go-checkout>Continue to checkout ↗</button></aside></div>` : `<div class="rr-cart-empty"><span>YOUR BAG IS WAITING</span><h2>Nothing here, just yet.</h2><p>Find something useful, or choose an experience worth making time for.</p>${link('Explore the collection ↗', '/products/', 'rr-button rr-button--dark')}</div>`}</section></main>`;
  };
  const checkoutPage = () => `
    <main id="main-content"><section class="rr-checkout"><div class="rr-checkout__brand">${link('REVISE', '/')}<span>CHECKOUT PREVIEW</span></div><div class="rr-preview-notice"><strong>Preview checkout</strong><span>This layout is ready for a commerce connection. No payment is collected and no order will be placed here.</span></div><div class="rr-checkout__grid"><form class="rr-checkout-form" data-checkout-form><div class="rr-checkout-section"><div class="rr-checkout-section__head"><h1>Contact</h1>${link('Sign in', '/account/login/')}</div><input type="email" placeholder="Email address" required><label class="rr-check"><input type="checkbox"> Email me with news and offers</label></div><div class="rr-checkout-section"><h2>Delivery</h2><div class="rr-form-grid"><input placeholder="First name" required><input placeholder="Last name" required><input class="rr-span-2" placeholder="Address" required><input class="rr-span-2" placeholder="Apartment, suite, etc. (optional)"><input placeholder="City" required><input placeholder="Postal code" required><select class="rr-span-2"><option>United States</option><option>Canada</option><option>United Kingdom</option></select></div></div><div class="rr-checkout-section"><h2>Shipping method</h2><div class="rr-shipping-option"><span>Standard delivery</span><strong>Calculated by store</strong></div></div><div class="rr-checkout-section"><h2>Payment</h2><p>Payment options appear when a secure provider is connected.</p><div class="rr-payment-placeholder">Secure payment provider required</div></div><button class="rr-button rr-button--dark" type="submit">Review checkout details</button><p class="rr-form-message" data-checkout-message></p></form><aside class="rr-checkout-summary"><h2>Order summary</h2>${cart.map(item => `<div class="rr-checkout-line">${image(item.image, item.title)}<span>${esc(item.title)}<small>${esc(item.variant)} · Qty ${item.quantity}</small></span><strong>${money(item.price * item.quantity)}</strong></div>`).join('') || '<p>Your bag is empty.</p>'}<div class="rr-checkout-total"><span>Subtotal</span><strong>${money(cartTotal())}</strong></div></aside></div></section></main>`;
  const accountPage = mode => {
    if (mode === 'login' || mode === 'register') return `<main id="main-content"><section class="rr-account-auth"><span class="rr-kicker">REVISE / CUSTOMER ACCOUNT</span><h1>${mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1><p>${mode === 'login' ? 'Sign in to see your orders and account details.' : 'Keep your details and orders together.'}</p><form data-account-form><input type="email" placeholder="Email address" required>${mode === 'register' ? '<input type="text" placeholder="First name" required><input type="text" placeholder="Last name" required>' : ''}<input type="password" placeholder="Password" required><button class="rr-button rr-button--dark" type="submit">${mode === 'login' ? 'Sign in' : 'Create account'} ↗</button><p class="rr-form-message" data-account-message>Preview only — connect customer accounts to enable sign in.</p></form><div>${mode === 'login' ? link('Create an account', '/account/register/') : link('Already have an account? Sign in', '/account/login/')}</div></section></main>`;
    return `<main id="main-content"><section class="rr-account-page">${pageIntro('YOUR ACCOUNT', 'Good to see<br>you again.', 'A place for your orders, saved details and account preferences.')}<div class="rr-account-layout"><nav>${link('Overview', '/account/')}${link('Orders', '/account/orders/')}${link('Profile', '/account/profile/')}${link('Sign in', '/account/login/')}</nav><div class="rr-account-panel"><span>ACCOUNT PREVIEW</span><h2>${mode === 'orders' ? 'Your orders' : mode === 'profile' ? 'Profile & preferences' : 'Your account'}</h2><p>${mode === 'orders' ? 'Order history will appear here after customer accounts are connected.' : mode === 'profile' ? 'Your saved contact and delivery details will be available here after sign in is connected.' : 'Connect customer accounts to make order history, saved details and preferences available.'}</p>${link('Sign in to continue ↗', '/account/login/', 'rr-button rr-button--dark')}</div></div></section></main>`;
  };
  const blogPage = () => `<main id="main-content">${pageIntro('03 / THE JOURNAL', 'Notes from<br>the everyday.', 'A collection of ideas, observations and useful perspectives.')}<section class="rr-journal-grid">${stories.map((story, i) => `<article class="rr-story-card"><a href="${href(`/blogs/${story.id}/`)}" data-link>${image(story.image, story.title)}<span>0${i + 1} / ${esc(story.category)}</span><h2>${esc(story.title)}</h2><p>${esc(story.excerpt)}</p><small>${esc(story.date)} · 4 MIN READ</small></a></article>`).join('')}</section></main>`;
  const articlePage = story => story ? `<main id="main-content"><div class="rr-breadcrumb">${link('Journal', '/blogs/')} / <span>${esc(story.title)}</span></div><article class="rr-article"><header><span class="rr-kicker">${esc(story.category)} / ${esc(story.date)}</span><h1>${esc(story.title)}</h1><p>${esc(story.excerpt)}</p></header>${image(story.image, story.title, 'rr-article__cover')}<div class="rr-article__body"><p class="rr-dropcap">The everyday is where most of life happens. The objects we reach for, the routes we take and the time we make for ourselves all shape how a day feels.</p><p>Good design earns its place by being useful, considered and quietly dependable. It does not ask for attention. It gives a little back.</p><h2>Make space for what matters.</h2><p>Choose with intention. Keep what works. Leave room for the unexpected. The best things are often the ones that become part of the rhythm without getting in the way.</p>${link('Back to the journal ↗', '/blogs/', 'rr-text-link')}</div></article></main>` : notFoundPage();
  const searchPage = () => {
    const query = new URLSearchParams(location.search).get('q') || '';
    const q = query.trim().toLowerCase();
    const results = [
      ...products.filter(product => `${product.title} ${product.type} ${product.kind} ${product.description}`.toLowerCase().includes(q)).map(product => ({ title: product.title, kind: kindLabels[product.kind] || 'Product', path: `/products/${product.id}/` })),
      ...collections.filter(collection => `${collection.title} ${collection.description}`.toLowerCase().includes(q)).map(collection => ({ title: collection.title, kind: 'Collection', path: `/collections/${collection.id}/` })),
      ...stories.filter(story => `${story.title} ${story.category} ${story.excerpt}`.toLowerCase().includes(q)).map(story => ({ title: story.title, kind: 'Journal', path: `/blogs/${story.id}/` }))
    ];
    return `<main id="main-content">${pageIntro('SEARCH / REVISE', q ? `Results for<br>“${esc(query)}”.` : 'Find your way.', 'Search products, services, digital editions, experiences and ideas.')}<form class="rr-search-page-form" data-search-form><input name="q" value="${esc(query)}" placeholder="Search the collection…" aria-label="Search the collection"><button type="submit">Search ↗</button></form>${q ? `<section class="rr-search-results"><span>${results.length} RESULTS</span>${results.map(item => `<a href="${href(item.path)}" data-link><span>${esc(item.kind)}</span><strong>${esc(item.title)}</strong><span>View ↗</span></a>`).join('') || '<p>No matching results. Try another search.</p>'}</section>` : ''}</main>`;
  };
  const standardPage = path => {
    if (path === '/pages/about/') return `<main id="main-content">${pageIntro('THE REVISE APPROACH', 'Look again.<br>There is more to see.', 'Revision is the work of re-examining what exists and making the next version more useful.')}<section class="rr-about-story"><div>${image('revise-identity-card.webp', 'Revise identity design study')}</div><div><span class="rr-kicker">A PRACTICE OF IMPROVEMENT</span><h2>Keep what works.<br>Question what does not.</h2><p>Revise brings services, objects, digital tools and shared experiences together around one belief: good work gets better when we take the time to look again.</p>${link('Explore what we do ↗', '/services/', 'rr-text-link')}</div></section><section class="rr-about-principles"><article><span>01</span><h3>Re-examine</h3><p>Start with curiosity. Understand the real need before reaching for an answer.</p></article><article><span>02</span><h3>Reconsider</h3><p>Make room for a better direction, a clearer experience and a more useful result.</p></article><article><span>03</span><h3>Refine</h3><p>Bring the details together so the final work feels considered and complete.</p></article></section></main>`;
    if (path === '/pages/contact/') return `<main id="main-content">${pageIntro('GET IN TOUCH', 'Start with a<br>better question.', 'Tell us what you are thinking about. We will help you find the right way to move it forward.')}<section class="rr-contact-layout"><div><span class="rr-kicker">A GOOD PLACE TO BEGIN</span><h2>What would you like to make better?</h2><p>Share a little about the project, the question or the experience you have in mind.</p>${link('Explore services ↗', '/services/', 'rr-text-link')}</div><form class="rr-contact-form" data-contact-form><label>Name<input name="name" required placeholder="Your name"></label><label>Email<input name="email" type="email" required placeholder="you@example.com"></label><label>What are you interested in?<select name="interest"><option>Services</option><option>Digital editions</option><option>Physical goods</option><option>Experiences</option><option>Something else</option></select></label><label>Tell us a little more<textarea name="message" rows="5" placeholder="A few details to get us started"></textarea></label><button class="rr-button rr-button--dark" type="submit">Send an inquiry ↗</button><p class="rr-form-message" data-contact-message></p></form></section></main>`;
    if (path === '/pages/shipping-returns/') return `<main id="main-content">${pageIntro('THE PRACTICAL DETAILS', 'Delivery &<br>returns.', 'The useful information that helps you make a decision with confidence.')}<section class="rr-policy-layout"><div><span class="rr-kicker">BEFORE YOU ORDER</span><h2>Clear details.<br>No surprises.</h2></div><div class="rr-policy-list"><article><span>01 / DELIVERY</span><h3>Where and when</h3><p>Available delivery methods, processing times and shipping regions are shown during checkout before an order is placed.</p></article><article><span>02 / TRACKING</span><h3>Stay in the loop</h3><p>When tracking is available, the store shares the details needed to follow your delivery.</p></article><article><span>03 / RETURNS</span><h3>If something is not right</h3><p>Return eligibility and the steps to request a return are provided with the store's current policy. Contact the team with your order details for help.</p></article><article><span>04 / DIGITAL & SERVICES</span><h3>Different kinds of delivery</h3><p>Digital access, service scheduling and experience details are confirmed through the instructions attached to each purchase.</p></article></div></section></main>`;
    if (path === '/pages/faq/') return `<main id="main-content">${pageIntro('HELP / THE DETAILS', 'A few useful<br>answers.', 'The things people often want to know before choosing a product, service or experience.')}<section class="rr-faq-layout"><div><span class="rr-kicker">GOOD TO KNOW</span><h2>Still wondering?</h2><p>We are happy to help you find the right next step.</p>${link('Contact the studio ↗', '/pages/contact/', 'rr-text-link')}</div><div class="rr-faq-list"><details open><summary>What can I purchase here?</summary><p>Revise brings together physical goods, digital editions, services and shared experiences in one considered storefront.</p></details><details><summary>How are digital editions delivered?</summary><p>Digital products are delivered through the access method described on their product page after checkout.</p></details><details><summary>How do services work?</summary><p>Each service outlines its format, typical timeline and included work. Choose an engagement to begin the conversation.</p></details><details><summary>How do I reserve an experience?</summary><p>Choose an available session and add the number of places you need. Final confirmation is provided through checkout.</p></details><details><summary>Can I change or return an order?</summary><p>Eligibility depends on the product and the store's current policy. See Delivery & returns for the relevant details.</p></details><details><summary>Can I send a gift card?</summary><p>Yes. Choose an amount, add a recipient and a note, then complete delivery details at checkout.</p></details></div></section></main>`;
    return notFoundPage();
  };
  const passwordPage = () => '<main id="main-content"><section class="rr-password-page"><span class="rr-kicker">A NEW CHAPTER IS TAKING SHAPE</span><h1>Opening soon.</h1><p>Leave your email and be the first to hear when the doors open.</p><form data-newsletter><input type="email" placeholder="Email address" required><button class="rr-button rr-button--dark" type="submit">Notify me ↗</button><small data-form-message></small></form></section></main>';
  const notFoundPage = () => '<main id="main-content"><section class="rr-not-found"><span>404 / PAGE NOT FOUND</span><h1>Not all paths<br>lead somewhere.</h1><p>The page you are looking for may have moved.</p>' + link('Return to the home page ↗', '/', 'rr-button rr-button--dark') + '</section></main>';
  const renderContent = path => {
    if (path === '/') return homePage();
    if (path === '/products/') return productsPage();
    if (path.startsWith('/products/')) return productPage(findProduct(path.split('/')[2]));
    if (path === '/services/') return servicesPage();
    if (path === '/digital/') return digitalPage();
    if (path === '/experiences/') return experiencesPage();
    if (path === '/collections/') return collectionsPage();
    if (path.startsWith('/collections/')) return collectionPage(collections.find(c => c.id === path.split('/')[2]));
    if (path === '/gift-card/') return giftCardPage();
    if (path === '/cart/') return cartPage();
    if (path === '/checkout/') return checkoutPage();
    if (path === '/account/') return accountPage('overview');
    if (path === '/account/login/') return accountPage('login');
    if (path === '/account/register/') return accountPage('register');
    if (path === '/account/orders/') return accountPage('orders');
    if (path === '/account/profile/') return accountPage('profile');
    if (path === '/blogs/') return blogPage();
    if (path.startsWith('/blogs/')) return articlePage(stories.find(s => s.id === path.split('/')[2]));
    if (path === '/search/') return searchPage();
    if (path === '/password/') return passwordPage();
    if (path === '/pages/world/' && new URLSearchParams(location.search).get('owner') === '1') return '<main id="main-content" class="rr-world-shell" data-owner-world><div class="rr-world-loading">Loading the source-owned scene collection…</div></main>';
    if (path.startsWith('/pages/')) return standardPage(path);
    return notFoundPage();
  };
  let ownerWorldDispose = null;
  let ownerWorldRequest = 0;
  const render = () => {
    ownerWorldRequest++;
    if (ownerWorldDispose) { ownerWorldDispose(); ownerWorldDispose = null; }
    const path = routePath();
    const titles = { '/': 'Home', '/products/': 'Shop', '/services/': 'Services', '/digital/': 'Digital editions', '/experiences/': 'Experiences', '/collections/': 'Collections', '/gift-card/': 'Gift card', '/cart/': 'Your bag', '/checkout/': 'Checkout', '/blogs/': 'Journal', '/account/': 'Account', '/search/': 'Search', '/pages/about/': 'Our approach', '/pages/contact/': 'Contact', '/pages/faq/': 'FAQ', '/pages/shipping-returns/': 'Delivery & returns', '/password/': 'Opening soon', '/pages/world/': 'Creative World' };
    const currentProduct = path.startsWith('/products/') ? findProduct(path.split('/')[2]) : null;
    const currentCollection = path.startsWith('/collections/') ? collections.find(c => c.id === path.split('/')[2]) : null;
    document.title = `${currentProduct?.title || currentCollection?.title || titles[path] || 'Revise'} — Revise`;
    $('#app').innerHTML = `${header()}${renderContent(path)}${footer()}${menu()}${searchOverlay()}<div class="rr-toast" data-toast role="status" aria-live="polite"></div>`;
    initScrollStory();
    const root = $('[data-owner-world]');
    if (root) {
      const request = ownerWorldRequest;
      import(asset('owner-scenes/owner-world-app.js')).then(module => module.mountOwnerWorld(root)).then(dispose => {
        if (request === ownerWorldRequest) ownerWorldDispose = dispose; else dispose?.();
      }).catch(error => console.error('[Revise] Owner experience unavailable:', error));
    }
  };
  let storyObserver = null;
  const initScrollStory = () => {
    if (storyObserver) storyObserver.disconnect();
    const root = $('[data-scroll-story]');
    if (!root) return;
    const scenes = $$('[data-scene-image]', root);
    const storyChapters = $$('[data-chapter-index]', root);
    const setActive = index => {
      root.dataset.activeChapter = String(index);
      scenes.forEach(scene => scene.classList.toggle('is-active', Number(scene.dataset.sceneImage) === index));
      storyChapters.forEach(chapter => chapter.classList.toggle('is-active', Number(chapter.dataset.chapterIndex) === index));
      const current = chapters[index];
      const number = $('[data-scene-number]', root);
      const title = $('[data-scene-title]', root);
      if (number) number.textContent = current.number + ' / 03';
      if (title) title.textContent = current.title;
    };
    setActive(0);
    if (!('IntersectionObserver' in window)) return;
    storyObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(Number(visible.target.dataset.chapterIndex));
    }, { rootMargin: '-34% 0px -34% 0px', threshold: [0.05, 0.25, 0.55, 0.8] });
    storyChapters.forEach(chapter => storyObserver.observe(chapter));
  };
  const setBackgroundInert = (active, except) => {
    $$('#app > .rr-announcement, #app > .rr-header, #app > main, #app > .rr-footer').forEach(node => {
      if (node !== except) node.inert = active;
    });
  };
  const navigate = path => {
    const destination = new URL(href(path), location.origin);
    history.pushState({}, '', destination.pathname + destination.search + destination.hash);
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const openMenu = open => {
    const panel = $('[data-menu]');
    if (!panel) return;
    panel.dataset.open = String(open);
    panel.setAttribute('aria-hidden', String(!open));
    document.documentElement.classList.toggle('rr-lock-scroll', open);
    setBackgroundInert(open, panel);
    if (open) $('[data-menu-close]')?.focus(); else $('[data-menu-toggle]')?.focus();
  };
  const openSearch = open => {
    const panel = $('[data-search]');
    if (!panel) return;
    panel.dataset.open = String(open);
    panel.setAttribute('aria-hidden', String(!open));
    document.documentElement.classList.toggle('rr-lock-scroll', open);
    setBackgroundInert(open, panel);
    if (open) $('#rr-search-input')?.focus(); else $('[data-search-toggle]')?.focus();
  };
  document.addEventListener('click', event => {
    if (event.target.matches('[data-menu]')) { openMenu(false); return; }
    if (event.target.matches('[data-search]')) { openSearch(false); return; }
    const target = event.target.closest('button,a');
    if (!target) return;
    if (target.matches('[data-menu-toggle]')) { openMenu(true); return; }
    if (target.matches('[data-menu-close]')) { openMenu(false); return; }
    if (target.matches('[data-search-toggle]')) { openSearch(true); return; }
    if (target.matches('[data-search-close]')) { openSearch(false); return; }
    if (target.matches('[data-filter]')) {
      activeProductFilter = target.dataset.filter || 'all';
      $$('[data-filter]').forEach(filter => filter.setAttribute('aria-pressed', String(filter === target)));
      const results = $('[data-product-results]');
      if (results) results.innerHTML = productGrid(getVisibleProducts());
      const count = $('[data-product-count]');
      if (count) count.textContent = getVisibleProducts().length + ' WAYS TO BEGIN';
      return;
    }
    if (target.matches('[data-quick-add]')) { const product = findProduct(target.dataset.quickAdd); if (product) addToCart(product, product.variants?.[0] || 'One size', 1); return; }
    if (target.matches('[data-add-to-cart]')) {
      const product = findProduct(target.dataset.addToCart);
      if (product) addToCart(product, $('[data-variant]')?.value || product.variants?.[0] || 'One size', Math.max(1, Number($('[data-quantity]')?.value || 1)));
      return;
    }
    if (target.matches('[data-qty]')) { const input = $('[data-quantity]'); if (input) input.value = String(Math.max(1, Number(input.value) + Number(target.dataset.qty))); return; }
    if (target.matches('[data-cart-qty]')) { updateQuantity(target.dataset.cartQty, Number(target.dataset.amount)); return; }
    if (target.matches('[data-remove]')) { removeLine(target.dataset.remove); return; }
    if (target.matches('[data-go-checkout]')) { navigate('/checkout/'); return; }
    if (target.matches('[data-gallery-image]')) { const main = $('.rr-product-gallery__main img'); if (main) main.src = target.dataset.galleryImage; return; }
    const anchor = target.closest('a[data-link]');
    if (anchor && anchor.origin === location.origin && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && anchor.target !== '_blank') {
      event.preventDefault();
      let path = anchor.pathname;
      if (BASE_PATH && path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length) || '/';
      navigate(path + anchor.search + anchor.hash);
    }
  });
  document.addEventListener('submit', event => {
    const form = event.target;
    if (form.matches('[data-search-form]')) { event.preventDefault(); const data = new FormData(form); openSearch(false); navigate(`/search/?q=${encodeURIComponent(String(data.get('q') || '').trim())}`); return; }
    if (form.matches('[data-gift-form]')) {
      event.preventDefault();
      const data = new FormData(form);
      const value = Number(data.get('gift-value') || 100);
      addToCart({ id: `gift-card-${value}`, title: `Revise Gift Card · ${money(value)}`, kind: 'digital', type: 'Gift card', optionLabel: 'Delivery', price: value, image: 'revise-detail-paper.webp', variants: ['Digital delivery'] }, 'Digital delivery', 1, { meta: { recipient: data.get('recipient') || '', email: data.get('recipient-email') || '', deliveryDate: data.get('delivery-date') || '', message: data.get('message') || '' } });
      return;
    }
    if (form.matches('[data-checkout-form]')) { event.preventDefault(); const message = $('[data-checkout-message]'); if (message) message.textContent = 'Checkout is not connected yet. No payment was collected and no order was placed.'; return; }
    if (form.matches('[data-account-form]')) { event.preventDefault(); const message = $('[data-account-message]'); if (message) message.textContent = 'Customer sign-in is handled by the store account provider.'; return; }
    if (form.matches('[data-contact-form]')) { event.preventDefault(); const message = $('[data-contact-message]'); if (message) message.textContent = 'Your inquiry is ready for the store contact service.'; return; }
    if (form.matches('[data-newsletter]')) { event.preventDefault(); const message = $('[data-form-message]', form); if (message) message.textContent = 'Thanks for your interest. Newsletter delivery is configured by the store.'; return; }
  });
  document.addEventListener('change', event => {
    const target = event.target;
    if (target.matches('[data-sort]')) {
      const results = $('[data-product-results]');
      if (!results) return;
      activeSort = target.value || 'featured';
      results.innerHTML = productGrid(getVisibleProducts());
      const count = $('[data-product-count]');
      if (count) count.textContent = getVisibleProducts().length + ' WAYS TO BEGIN';
    }
  });
  document.addEventListener('keydown', event => {
    const menuPanel = $('[data-menu][data-open="true"]');
    if (event.key === 'Tab' && menuPanel) {
      const focusable = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', menuPanel);
      if (focusable.length) {
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    if (event.key === 'Escape') {
      if ($('[data-menu][data-open="true"]')) openMenu(false);
      if ($('[data-search][data-open="true"]')) openSearch(false);
    }
  });
  window.addEventListener('popstate', render);
  render();
})();