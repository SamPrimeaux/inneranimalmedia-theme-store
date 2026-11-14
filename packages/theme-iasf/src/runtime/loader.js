/*
 * IASF globe loader — the supplied d3 orthographic globe + rotating whirl arcs, ported
 * with the original geometry/motion and recolored entirely from theme tokens
 * (--iasf-loader-* → derived from --ia-*). Uses a 27 KB d3-geo bundle, not full d3.
 *
 * IASF.loader.show(label) / hide()   — also usable for route transitions.
 */
(function (root) {
  'use strict';
  if (typeof document === 'undefined') return;
  var I = (root.IASF = root.IASF || {});
  var cfg = (I.config && I.config.loader) || { enabled: true, mode: 'session', minMs: 900, maxMs: 6000, label: 'Entering the field' };
  var html = document.documentElement;
  var el = null, raf = 0, stopped = true, shownAt = 0;

  var SIZE = 200, R = 72, CX = 100, CY = 100, DPR = Math.min(root.devicePixelRatio || 1, 2);
  var SVG = 'http://www.w3.org/2000/svg';

  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function tok(name) { return getComputedStyle(el).getPropertyValue(name).trim(); }

  function build(label) {
    el = document.createElement('div');
    el.className = 'iasf-loader';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML =
      '<div class="iasf-loader-globe">' +
      '<canvas width="' + SIZE * DPR + '" height="' + SIZE * DPR + '" aria-hidden="true"></canvas>' +
      '<svg viewBox="0 0 ' + SIZE + ' ' + SIZE + '" aria-hidden="true"><g class="iasf-whirl"></g></svg>' +
      '</div><p class="iasf-loader-label"></p>';
    el.querySelector('.iasf-loader-label').textContent = label || cfg.label || '';
    document.body.appendChild(el);
    return el;
  }

  function startWhirl() {
    var g = el.querySelector('.iasf-whirl');
    var arcs = [];
    var COUNT = 10;
    for (var i = 0; i < COUNT; i++) {
      var p = document.createElementNS(SVG, 'path');
      var o = 0.55 - i * 0.04;
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', 'currentColor');
      p.setAttribute('stroke-opacity', o.toFixed(2));
      p.setAttribute('stroke-width', (1.1 - i * 0.06).toFixed(2));
      p.setAttribute('stroke-linecap', 'round');
      g.appendChild(p);
      arcs.push({ el: p, r: 76 + i * 2.6, speed: 0.6 + i * 0.12, span: 55 + Math.sin(i * 1.3) * 35, phase: (i / COUNT) * 360 });
    }
    function arc(r, a, b) {
      var s = a * Math.PI / 180, e = b * Math.PI / 180;
      return 'M ' + (CX + r * Math.cos(s)) + ' ' + (CY + r * Math.sin(s)) + ' A ' + r + ' ' + r + ' 0 ' + ((b - a) > 180 ? 1 : 0) + ' 1 ' + (CX + r * Math.cos(e)) + ' ' + (CY + r * Math.sin(e));
    }
    var t = 0;
    function draw() { arcs.forEach(function (a) { var ang = a.phase + t * a.speed; a.el.setAttribute('d', arc(a.r, ang, ang + a.span)); }); }
    draw();
    if (I.reducedMotion()) return;
    (function tick() { if (stopped) return; t += 1; draw(); raf = requestAnimationFrame(tick); })();
  }

  function startGlobe() {
    var canvas = el.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);
    var ocean = tok('--iasf-loader-ocean'), land = tok('--iasf-loader-land'), landLine = tok('--iasf-loader-land-line'), grat = tok('--iasf-loader-graticule'), rim = tok('--iasf-loader-rim');

    return Promise.all([
      root.IasfGeo ? 0 : loadScript(new URL('vendor/iasf-globe.min.js', I.base).href),
    ]).then(function () {
      return fetch(new URL('vendor/world-countries-110m.json', I.base).href).then(function (r) { return r.json(); });
    }).then(function (world) {
      var G = root.IasfGeo;
      var countries = G.feature(world, world.objects.countries);
      var projection = G.geoOrthographic().scale(R).translate([SIZE / 2, SIZE / 2]).clipAngle(90);
      var path = G.geoPath(projection, ctx);
      var graticule = G.geoGraticule()();
      var rot = 0;
      function paint() {
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = ocean; ctx.fill();
        ctx.beginPath(); path(graticule); ctx.strokeStyle = grat; ctx.lineWidth = 0.5; ctx.stroke();
        ctx.beginPath(); path(countries); ctx.fillStyle = land; ctx.fill(); ctx.strokeStyle = landLine; ctx.lineWidth = 0.4; ctx.stroke();
        ctx.beginPath(); path({ type: 'Sphere' }); ctx.strokeStyle = rim; ctx.lineWidth = 1; ctx.stroke();
      }
      projection.rotate([rot, -20, 0]); paint();
      el.classList.add('has-globe');
      if (I.reducedMotion()) return;
      (function frame() { if (stopped) return; rot += 0.25; projection.rotate([rot, -20, 0]); paint(); requestAnimationFrame(frame); })();
    });
  }

  function show(label) {
    if (el) return;
    build(label);
    stopped = false; shownAt = Date.now();
    html.classList.add('iasf-loading');
    requestAnimationFrame(function () { el.classList.add('is-visible'); });
    startWhirl();
    startGlobe().catch(function () { /* whirl-only fallback is already visible */ });
    I.emit('loader:show');
  }

  function hide() {
    if (!el) { html.classList.remove('iasf-loading'); return; }
    var wait = Math.max(0, (cfg.minMs || 900) - (Date.now() - shownAt));
    setTimeout(function () {
      var node = el; el = null; stopped = true; cancelAnimationFrame(raf);
      html.classList.remove('iasf-loading');
      node.classList.remove('is-visible'); node.classList.add('is-leaving');
      var done = function () { node.parentNode && node.parentNode.removeChild(node); };
      node.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 700);
      try { sessionStorage.setItem('iasf:loaded', '1'); } catch (e) { /* private mode */ }
      I.emit('loader:hide');
    }, wait);
  }

  I.loader = { show: show, hide: hide };

  function auto() {
    if (!cfg.enabled || cfg.mode === 'off') { html.classList.remove('iasf-loading'); return; }
    var first = true;
    try { first = cfg.mode === 'always' || !sessionStorage.getItem('iasf:loaded'); } catch (e) { first = true; }
    if (!first || navigator.webdriver) { html.classList.remove('iasf-loading'); return; }
    show();
    var release = function () { hide(); };
    if (document.readyState === 'complete') release(); else root.addEventListener('load', release, { once: true });
    setTimeout(release, cfg.maxMs || 6000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto, { once: true }); else auto();
})(typeof window !== 'undefined' ? window : globalThis);
