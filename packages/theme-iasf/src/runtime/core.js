/* IASF runtime core — config + tiny helpers. No dependencies. */
(function (root) {
  'use strict';
  if (typeof document === 'undefined') return;

  var I = (root.IASF = root.IASF || {});

  function readConfig() {
    var el = document.getElementById('iasf-config');
    if (!el) return {};
    try { return JSON.parse(el.textContent || '{}'); } catch (e) { return {}; }
  }

  I.config = I.config || readConfig();
  I.reducedMotion = function () {
    return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  /** Dispatches `iasf:<name>` on document so host apps can listen (analytics, CRM, etc.). */
  I.emit = function (name, detail) {
    try { document.dispatchEvent(new CustomEvent('iasf:' + name, { detail: detail || {} })); } catch (e) { /* noop */ }
  };
  /** Directory of the runtime scripts, so lazy assets resolve under any base path. */
  var cs = document.currentScript;
  I.base = cs && cs.src ? new URL('../', cs.src).href : '/';
  I.lockScroll = function (on) {
    document.documentElement.classList.toggle('iasf-lock', !!on);
  };
})(typeof window !== 'undefined' ? window : globalThis);
