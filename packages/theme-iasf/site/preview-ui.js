/* IASF design-preview interactions. No payment, customer account or inventory APIs. */
(() => {
  'use strict';
  const script = document.currentScript;
  const base = new URL('.', script.src).pathname;
  const resolve = path => base + String(path).replace(/^\/+/, '');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  let catalog = { products: [], journal: [] };
  let overlay = null;
  const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const cartKey = 'iasf-preview-cart-v1';
  const loadCart = () => { try { return JSON.parse(sessionStorage.getItem(cartKey) || '[]').filter(x => x && x.slug && x.quantity > 0); } catch { return []; } };
  const saveCart = entries => { try { sessionStorage.setItem(cartKey, JSON.stringify(entries)); } catch { /* preview works without storage */ } updateCount(); };
  const updateCount = () => {
    const count = loadCart().reduce((sum, item) => sum + item.quantity, 0);
    $$('.ia-actions button').filter(b => /^cart/i.test(b.textContent.trim())).forEach(b => {
      b.innerHTML = 'Cart <span>(' + count + ')</span>';
      b.setAttribute('aria-label', 'View preview cart, ' + count + ' items');
    });
  };
  const close = () => {
    if (!overlay) return;
    const previous = overlay._trigger;
    overlay.remove(); overlay = null; previous?.focus?.();
  };
  function dialog(title, content, trigger) {
    close();
    const shade = document.createElement('div');
    shade.className = 'ia-demo-shade';
    shade.innerHTML = '<section class="ia-demo-panel" role="dialog" aria-modal="true" aria-labelledby="ia-demo-title">' +
      '<header><div><small>INNER ANIMALS / DESIGN PREVIEW</small><h2 id="ia-demo-title">' + safe(title) + '</h2></div>' +
      '<button type="button" data-close aria-label="Close panel">✕</button></header>' +
      '<div class="ia-demo-panel-body">' + content + '</div><footer>UI preview only · No orders, payments or accounts are created.</footer></section>';
    shade._trigger = trigger || document.activeElement;
    shade.addEventListener('click', event => { if (event.target === shade || event.target.closest('[data-close]')) close(); });
    document.body.append(shade); overlay = shade;
    $('[data-close]', shade)?.focus();
    return shade;
  }
  function renderCart(trigger) {
    const cart = loadCart();
    const rows = cart.map(item => {
      const product = catalog.products.find(p => p.slug === item.slug);
      if (!product) return '';
      return '<div class="ia-demo-cart-line"><div><small>' + safe(product.category) + ' / ' + safe(item.size) + '</small>' +
        '<a href="' + resolve('products/' + product.slug + '/') + '">' + safe(product.name) + '</a><span>' +
        money(product.price) + ' each</span></div><div><button data-remove="' + safe(item.slug + '|' + item.size) +
        '" aria-label="Remove ' + safe(product.name) + '">Remove</button><strong>' + item.quantity + '</strong></div></div>';
    }).join('');
    const total = cart.reduce((sum, item) => sum + (catalog.products.find(p => p.slug === item.slug)?.price || 0) * item.quantity, 0);
    const contents = cart.length
      ? rows + '<div class="ia-demo-total"><span>Concept subtotal</span><strong>' + money(total) + '</strong></div>' +
        '<a class="ia-demo-primary" href="' + resolve('checkout/') + '">Review checkout design ↗</a>'
      : '<div class="ia-demo-empty"><span>YOUR BAG IS EMPTY</span><h3>The work starts here.</h3>' +
        '<p>Browse the field collection and add a concept product to try the cart flow.</p>' +
        '<a class="ia-demo-primary" href="' + resolve('shop/') + '">Explore the collection ↗</a></div>';
    const layer = dialog('Your bag', contents, trigger);
    $$('[data-remove]', layer).forEach(button => button.addEventListener('click', () => {
      saveCart(loadCart().filter(item => item.slug + '|' + item.size !== button.dataset.remove));
      renderCart(trigger);
    }));
  }
  function renderSearch(trigger) {
    const layer = dialog('Search the field', '<label class="ia-demo-search-label" for="ia-demo-query">PRODUCTS / JOURNAL / ARCHETYPES</label>' +
      '<input id="ia-demo-query" class="ia-demo-search" type="search" placeholder="Try Train, Wolf or Field Journal" autocomplete="off">' +
      '<div id="ia-demo-results" aria-live="polite"></div>', trigger);
    const input = $('#ia-demo-query', layer);
    const output = $('#ia-demo-results', layer);
    const items = [
      ...catalog.products.map(p => ({kind:'Product · ' + p.category, name:p.name, href:resolve('products/' + p.slug + '/')})),
      ...catalog.journal.map(p => ({kind:'Journal · ' + p.kind, name:p.title, href:resolve('journal/')})),
      {kind:'Collection',name:'Explore the archetypes',href:resolve('collections/')},
      {kind:'About',name:'Our Code',href:resolve('story/')}
    ];
    function paint() {
      const q = input.value.trim().toLowerCase();
      const results = items.filter(item => !q || (item.name + ' ' + item.kind).toLowerCase().includes(q)).slice(0, 10);
      output.innerHTML = results.length ? results.map(item =>
        '<a class="ia-demo-result" href="' + item.href + '"><span><small>' + safe(item.kind) +
        '</small><strong>' + safe(item.name) + '</strong></span><span aria-hidden="true">↗</span></a>'
      ).join('') : '<p class="ia-demo-noresult">No matches. Try a different term.</p>';
    }
    input.addEventListener('input', paint); paint(); input.focus();
  }
  function initFilters() {
    const filters = $$('.ia-filters button');
    if (!filters.length) return;
    const cards = $$('.ia-shop .ia-product-card');
    filters.forEach(button => {
      button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
      button.addEventListener('click', () => {
        filters.forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
        const filter = button.textContent.trim().toLowerCase();
        cards.forEach(card => {
          const category = $('.ia-product-image span', card)?.textContent.trim().toLowerCase();
          card.hidden = filter !== 'all' && category !== filter;
        });
      });
    });
  }
  function initProduct() {
    const sizeButtons = $$('.ia-sizes button');
    sizeButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
      button.addEventListener('click', () => {
        sizeButtons.forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
      });
    });
    const add = $('.ia-add');
    if (!add) return;
    add.type = 'button';
    add.addEventListener('click', () => {
      const slug = location.pathname.match(/\/products\/([a-z0-9-]+)\/?$/)?.[1];
      const product = catalog.products.find(p => p.slug === slug);
      if (!product) return;
      const size = $('.ia-sizes button.active')?.textContent.trim() || 'M';
      const entries = loadCart();
      const match = entries.find(item => item.slug === slug && item.size === size);
      if (match) match.quantity += 1;
      else entries.push({ slug, size, quantity: 1 });
      saveCart(entries); renderCart(add);
    });
  }
  function initCheckout() {
    const host = $('[data-iasf-checkout]');
    if (!host) return;
    const cart = loadCart();
    const subtotal = cart.reduce((sum, item) => sum + (catalog.products.find(p => p.slug === item.slug)?.price || 0) * item.quantity, 0);
    const list = $('[data-iasf-order-items]', host);
    if (list) list.innerHTML = cart.length ? cart.map(item => {
      const p = catalog.products.find(p => p.slug === item.slug);
      return p ? '<div><span>' + safe(p.name) + ' · ' + safe(item.size) + ' × ' + item.quantity +
        '</span><strong>' + money(p.price * item.quantity) + '</strong></div>' : '';
    }).join('') : '<p>Your preview bag is empty. <a href="' + resolve('shop/') + '">Explore products</a>.</p>';
    const total = $('[data-iasf-total]', host);
    if (total) total.textContent = money(subtotal);
    const form = $('form', host);
    form?.addEventListener('submit', e => {
      e.preventDefault();
      const result = $('[data-iasf-confirmation]', host);
      result.hidden = false;
      result.focus();
    });
  }
  function initMenu() {
    const header = $('.ia-header'); if (!header) return;
    const nav = $('nav', header); if (!nav) return;
    const button = document.createElement('button');
    button.className = 'ia-demo-menu-btn'; button.type = 'button';
    button.setAttribute('aria-label','Toggle navigation'); button.setAttribute('aria-expanded','false');
    button.textContent = 'Menu';
    header.insertBefore(button, nav);
    button.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
    $$('a', nav).forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open'); button.setAttribute('aria-expanded','false');
    }));
  }
  async function start() {
    try {
      const response = await fetch(resolve('site-data.json'));
      if (response.ok) catalog = await response.json();
    } catch { /* Static page remains visible if fixture JSON is unavailable */ }
    initFilters(); initProduct(); initMenu(); initCheckout(); updateCount();
    $$('.ia-actions button').forEach(button => {
      if (/^search/i.test(button.textContent.trim())) button.addEventListener('click', () => renderSearch(button));
      else if (/^cart/i.test(button.textContent.trim())) button.addEventListener('click', () => renderCart(button));
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
