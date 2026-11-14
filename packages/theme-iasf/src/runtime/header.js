/* IASF header motion — entrance, condense/hide on scroll, progress line, animated menu, active link, bag bump. */
(function (root) {
  'use strict';
  if (typeof document === 'undefined') return;
  var I = (root.IASF = root.IASF || {});

  function init() {
    var header = document.querySelector('[data-iasf-header]');
    if (!header) return;
    var motion = Object.assign(
      { enabled: true, condenseOnScroll: true, hideOnScrollDown: true, scrollProgress: true },
      (I.config && I.config.header && I.config.header.motion) || {}
    );
    var animated = motion.enabled !== false && header.getAttribute('data-motion') !== 'off';
    var nav = header.querySelector('#iasf-nav');
    var btn = header.querySelector('[data-iasf-menu]');
    var bar = header.querySelector('.ia-header-progress');
    var dropbar = document.querySelector('[data-iasf-dropbar]');

    // Entrance: one frame after load so CSS transitions have a start state.
    requestAnimationFrame(function () { requestAnimationFrame(function () { header.classList.add('is-ready'); }); });

    // Active link (works under any base path: compare trailing path segments).
    var here = location.pathname.replace(/\/+$/, '') || '/';
    Array.prototype.forEach.call(header.querySelectorAll('[data-iasf-nav]'), function (a) {
      var p = new URL(a.getAttribute('href'), location.href).pathname.replace(/\/+$/, '') || '/';
      var logoRoot = header.querySelector('.ia-logo') ? new URL(header.querySelector('.ia-logo').getAttribute('href'), location.href).pathname.replace(/\/+$/, '') || '/' : '/';
      var match = p !== logoRoot && (here === p || here.indexOf(p + '/') === 0);
      if (match) { a.setAttribute('aria-current', 'page'); a.classList.add('is-active'); }
    });

    // Dropbar: marquee only when the message can't fit.
    function measureDropbar() {
      if (!dropbar) return;
      var track = dropbar.querySelector('.ia-dropbar-track');
      dropbar.classList.remove('is-marquee');
      if (track && track.scrollWidth > dropbar.clientWidth + 2 && !I.reducedMotion()) dropbar.classList.add('is-marquee');
    }
    measureDropbar();
    root.addEventListener('resize', measureDropbar, { passive: true });

    // Menu
    function setMenu(open) {
      if (!btn || !nav) return;
      header.classList.toggle('is-menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      I.lockScroll(open && root.innerWidth <= 800);
      if (open) header.classList.remove('is-hidden');
    }
    btn && btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
    nav && nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.classList.contains('is-menu-open')) { setMenu(false); btn && btn.focus(); } });
    document.addEventListener('click', function (e) {
      if (header.classList.contains('is-menu-open') && !header.contains(e.target)) setMenu(false);
    });
    root.addEventListener('resize', function () { if (root.innerWidth > 800 && header.classList.contains('is-menu-open')) setMenu(false); }, { passive: true });

    // Scroll behaviors
    var lastY = root.scrollY, ticking = false;
    function onScroll() {
      ticking = false;
      var y = Math.max(0, root.scrollY);
      var delta = y - lastY;
      if (motion.condenseOnScroll) header.classList.toggle('is-condensed', y > 24);
      if (motion.hideOnScrollDown && animated) {
        var focusInside = header.contains(document.activeElement);
        if (y > 160 && delta > 6 && !header.classList.contains('is-menu-open') && !focusInside) header.classList.add('is-hidden');
        else if (delta < -4 || y <= 160) header.classList.remove('is-hidden');
      }
      if (motion.scrollProgress && bar) {
        var h = document.documentElement.scrollHeight - root.innerHeight;
        bar.style.setProperty('--p', h > 0 ? (y / h).toFixed(4) : '0');
      }
      lastY = y;
    }
    root.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
    onScroll();

    // Bag count bump (preview-ui dispatches iasf:cart:count; any cart integration can too).
    document.addEventListener('iasf:cart:count', function (e) {
      var c = header.querySelector('[data-iasf-count]');
      if (!c) return;
      c.textContent = String((e.detail && e.detail.count) || 0);
      c.classList.remove('is-bump'); void c.offsetWidth; c.classList.add('is-bump');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})(typeof window !== 'undefined' ? window : globalThis);
