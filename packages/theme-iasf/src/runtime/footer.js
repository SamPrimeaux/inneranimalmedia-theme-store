/* IASF footer — reveal-on-scroll, live year, and the lazy, WebGL-optional 3D model. */
(function (root) {
  'use strict';
  if (typeof document === 'undefined') return;
  var I = (root.IASF = root.IASF || {});

  function cssVar(el, name) { return getComputedStyle(el).getPropertyValue(name).trim(); }

  function webgl() {
    try { var c = document.createElement('canvas'); return !!(root.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function mountModel(footer) {
    var canvas = footer.querySelector('.iasf-footer-glb');
    if (!canvas || !canvas.getAttribute('data-glb-url')) return;
    var conn = navigator.connection;
    if (!webgl() || (conn && conn.saveData)) return; // footer stays fully usable without it

    var started = false;
    var io = new IntersectionObserver(function (entries) {
      if (started || !entries[0].isIntersecting) return;
      started = true; io.disconnect();
      var go = root.IasfGLB ? Promise.resolve() : loadScript(new URL('vendor/iasf-glb.min.js', I.base).href);
      go.then(function () {
        var tint = canvas.getAttribute('data-glb-tint') || cssVar(footer, '--iasf-glb-tint') || cssVar(footer, '--ia-bone') || '#e8e4d9';
        root.IasfGLB.mount(canvas, {
          // Packaged (relative) models resolve against the theme root so they work under any base path.
          url: /^(?:[a-z]+:)?\/\//i.test(canvas.getAttribute('data-glb-url')) || canvas.getAttribute('data-glb-url').charAt(0) === '/' ? canvas.getAttribute('data-glb-url') : new URL(canvas.getAttribute('data-glb-url'), I.base).href,
          tint: tint,
          opacity: parseFloat(canvas.getAttribute('data-glb-opacity')) || 0.92,
          rotation: parseFloat(canvas.getAttribute('data-glb-rotation')) || 0.0016,
          animate: canvas.getAttribute('data-glb-animate') !== 'false'
        });
      }).catch(function () { /* optional enhancement */ });
    }, { rootMargin: '300px' });
    io.observe(canvas);
  }

  function init() {
    var footer = document.querySelector('[data-iasf-footer]');
    if (!footer) return;

    Array.prototype.forEach.call(footer.querySelectorAll('[data-iasf-year]'), function (el) { el.textContent = String(new Date().getFullYear()); });

    var items = footer.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in root) || I.reducedMotion()) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { threshold: 0.12 });
      Array.prototype.forEach.call(items, function (el) { io.observe(el); });
    }

    // Gentle backdrop drift while the footer is on screen.
    var media = footer.querySelector('.iasf-footer-media');
    if (media && !I.reducedMotion()) {
      var raf = 0;
      var move = function () {
        raf = 0;
        var r = footer.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, 1 - r.top / root.innerHeight));
        media.style.setProperty('--shift', (p * 36 - 18).toFixed(1) + 'px');
      };
      root.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(move); }, { passive: true });
      move();
    }

    mountModel(footer);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})(typeof window !== 'undefined' ? window : globalThis);
