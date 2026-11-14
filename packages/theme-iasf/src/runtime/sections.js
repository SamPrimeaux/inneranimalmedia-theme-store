/* IASF sections — reveal-on-scroll, hero tabs + carousel, product shelf, quick add, parallax,
 * and shared-element (gallery -> product) page transitions via cross-document View Transitions. */
(function (root) {
  'use strict';
  if (typeof document === 'undefined') return;
  var I = (root.IASF = root.IASF || {});
  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduced = function () { return I.reducedMotion ? I.reducedMotion() : false; };
  var CART_KEY = 'iasf-preview-cart-v1';

  // ── Reveal on scroll (content stays visible without JS / IntersectionObserver) ──
  function reveal() {
    var els = $$('[data-reveal]');
    if (!els.length || !('IntersectionObserver' in root) || reduced()) return;
    doc.documentElement.classList.add('iasf-js');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el, i) { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', String(i % 4)); io.observe(el); });
  }

  // ── Hero: glass tabs + cream carousel ──
  function tabs() {
    $$('[data-iasf-tabs]').forEach(function (box) {
      var btns = $$('[role=tab]', box), panels = $$('[data-panel]', box);
      function pick(i) {
        btns.forEach(function (b, j) { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
        panels.forEach(function (p, j) { p.hidden = i !== j; });
      }
      btns.forEach(function (b, i) { b.addEventListener('click', function () { pick(i); }); });
      box.addEventListener('keydown', function (e) {
        var i = btns.indexOf(doc.activeElement); if (i < 0) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length; pick(n); btns[n].focus(); e.preventDefault();
        }
      });
      pick(Math.max(0, btns.findIndex(function (b) { return b.getAttribute('aria-selected') === 'true'; })));
    });
  }

  function carousels() {
    $$('[data-iasf-carousel]').forEach(function (box) {
      var slides = $$('.ia-slide', box), dots = $$('.ia-dots button', box), cap = $('[data-caption-out]', box), cur = $('[data-current]', box);
      var i = 0, timer = null;
      function go(n) {
        i = (n + slides.length) % slides.length;
        slides.forEach(function (s, j) { s.classList.toggle('is-active', j === i); });
        dots.forEach(function (d, j) { if (j === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
        if (cap) cap.textContent = slides[i].getAttribute('data-caption') || '';
        if (cur) cur.textContent = String(i + 1);
      }
      function play() { stop(); if (!reduced() && slides.length > 1) timer = setInterval(function () { go(i + 1); }, 6500); }
      function stop() { if (timer) clearInterval(timer); timer = null; }
      var prev = $('[data-prev]', box), next = $('[data-next]', box);
      prev && prev.addEventListener('click', function () { go(i - 1); play(); });
      next && next.addEventListener('click', function () { go(i + 1); play(); });
      dots.forEach(function (d, j) { d.addEventListener('click', function () { go(j); play(); }); });
      box.addEventListener('mouseenter', stop); box.addEventListener('mouseleave', play);
      box.addEventListener('focusin', stop); box.addEventListener('focusout', play);
      go(0); play();
    });
  }

  // ── Product shelf: tabs, arrows ──
  function shelves() {
    $$('[data-iasf-shelf]').forEach(function (shelf) {
      var btns = $$('[role=tab]', shelf), tracks = $$('[data-shelf-panel]', shelf);
      function pick(i) {
        btns.forEach(function (b, j) { b.setAttribute('aria-selected', String(i === j)); });
        tracks.forEach(function (t, j) { t.hidden = i !== j; if (i === j) t.scrollLeft = 0; });
      }
      btns.forEach(function (b, i) { b.addEventListener('click', function () { pick(i); }); });
      function scrollBy(dir) {
        var t = tracks.filter(function (x) { return !x.hidden; })[0]; if (!t) return;
        var c = t.firstElementChild; var w = c ? c.getBoundingClientRect().width + 24 : 300;
        t.scrollBy({ left: dir * w, behavior: reduced() ? 'auto' : 'smooth' });
      }
      var p = $('[data-shelf-prev]', shelf), n = $('[data-shelf-next]', shelf);
      p && p.addEventListener('click', function () { scrollBy(-1); });
      n && n.addEventListener('click', function () { scrollBy(1); });
      pick(0);
    });
  }

  // ── Quick add: cancelable event so a real cart can take over; preview cart as fallback ──
  function cartCount() {
    try { return JSON.parse(sessionStorage.getItem(CART_KEY) || '[]').reduce(function (n, x) { return n + (x.quantity || 0); }, 0); } catch (e) { return 0; }
  }
  function quickAdd() {
    doc.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-quick-add]');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var detail = { slug: b.getAttribute('data-quick-add'), size: b.getAttribute('data-size') || 'M', name: b.getAttribute('data-name') || 'Item' };
      var ev = new CustomEvent('iasf:cart:add', { detail: detail, cancelable: true });
      var handled = !doc.dispatchEvent(ev);
      if (!handled) {
        try {
          var cart = JSON.parse(sessionStorage.getItem(CART_KEY) || '[]');
          var m = cart.filter(function (x) { return x.slug === detail.slug && x.size === detail.size; })[0];
          if (m) m.quantity += 1; else cart.push({ slug: detail.slug, size: detail.size, quantity: 1 });
          sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch (err) { /* storage blocked: toast still confirms */ }
        I.emit('cart:count', { count: cartCount() });
      }
      b.classList.add('is-added');
      setTimeout(function () { b.classList.remove('is-added'); }, 1200);
      if (I.toast && I.toast.show) I.toast.show({ type: 'success', title: 'Added to bag', message: detail.name + ' · ' + detail.size, duration: 3200 });
    }, true);
  }

  // ── Parallax (single rAF, transform only) ──
  function parallax() {
    var els = $$('[data-parallax]');
    if (!els.length || reduced()) return;
    var ticking = false;
    function frame() {
      ticking = false;
      var vh = root.innerHeight;
      els.forEach(function (el) {
        var host = el.parentElement, r = host.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var k = ((r.top + r.height / 2) - vh / 2) / vh;
        el.style.setProperty('--py', (-k * 60).toFixed(1) + 'px');
      });
    }
    root.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    frame();
  }

  // ── Gallery <-> product shared-element transition (cross-document View Transitions) ──
  // Names the product image on the card that matches the page we are leaving to / returning from,
  // so the browser morphs that exact image into the product hero (and back).
  function transitions() {
    if (!('onpageswap' in root) && !('onpagereveal' in root)) return;
    function norm(u) { try { return new URL(u, location.href).pathname.replace(/\/+$/, '') || '/'; } catch (e) { return ''; } }
    function cardFor(path) {
      var links = $$('a.ia-product-image[href]');
      for (var i = 0; i < links.length; i++) {
        var r = links[i].getBoundingClientRect();
        if (norm(links[i].getAttribute('href')) === path && r.width > 0) return links[i];
      }
      return null;
    }
    function mark(el) { el.setAttribute('data-vt-active', ''); }
    function clear() { $$('[data-vt-active]').forEach(function (n) { n.removeAttribute('data-vt-active'); }); }
    root.addEventListener('pageswap', function (e) {
      if (!e.viewTransition || !e.activation || !e.activation.entry) return;
      var card = cardFor(norm(e.activation.entry.url));
      if (card) mark(card);
    });
    root.addEventListener('pagereveal', function (e) {
      if (!e.viewTransition) return;
      var from = root.navigation && root.navigation.activation && root.navigation.activation.from;
      if (from) { var card = cardFor(norm(from.url)); if (card) mark(card); }
      e.viewTransition.finished.then(clear, clear);
    });
    root.addEventListener('pageshow', function (e) { if (e.persisted) clear(); });
  }

  function init() {
    reveal(); tabs(); carousels(); shelves(); quickAdd(); parallax(); transitions();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})(typeof window !== 'undefined' ? window : globalThis);
