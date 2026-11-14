/*
 * IASF "Join the Pack" — modular email capture.
 *
 *   <form data-pack-form data-pack-source="iasf_footer">…</form>   inline form (footer, any section)
 *   <a data-pack-open href="#join-the-pack">Join the pack</a>        opens the dialog
 *
 * Public API: IASF.pack.open() / close() / submit(fields) / configure({ transport, endpoint, mode })
 * Events on document: iasf:pack:submit | success | duplicate | invalid | rate | network | error
 *
 * Wire contract (same as the Theme Store's other newsletter blocks):
 *   POST  {endpoint}  application/json
 *   { email, first_name, last_name, source_path, source_page, source_type, source_ref, consent_text }
 *   200 { message? }                    → success
 *   200 { status:"exists" } or 409      → already a member
 *   400/422 { error }                   → invalid
 *   429 (Retry-After)                   → rate limited
 *   anything else / network / timeout   → error
 *
 * Preview mode (config.pack.mode = "preview") simulates the round trip with no network:
 *   any email → success · …@dupe.test → already a member · …@fail.test → server error · …@rate.test → rate limit
 */
(function (root) {
  'use strict';

  // ── Pure logic (unit-tested in Node via vm; no DOM) ────────────────────────
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validEmail(v) {
    v = String(v == null ? '' : v).trim();
    return v.length > 0 && v.length <= 254 && EMAIL.test(v);
  }

  function maskEmail(email) {
    var parts = String(email || '').split('@');
    if (parts.length !== 2) return '';
    var l = parts[0];
    return (l.length <= 2 ? l.charAt(0) + '•' : l.slice(0, 2) + '•••') + '@' + parts[1];
  }

  function classify(status, data) {
    data = data || {};
    var msg = data.message || data.error || '';
    if (status >= 200 && status < 300) {
      if (data.status === 'exists' || data.duplicate === true) return { kind: 'duplicate', message: msg };
      return { kind: 'success', message: msg };
    }
    if (status === 409) return { kind: 'duplicate', message: msg };
    if (status === 400 || status === 422) return { kind: 'invalid', message: msg };
    if (status === 429) return { kind: 'rate', message: msg, retryAfter: Number(data.retryAfter) || 0 };
    if (status === 0) return { kind: 'network', message: '', timeout: !!data.timeout, offline: !!data.offline };
    return { kind: 'error', message: msg };
  }

  var pure = { validEmail: validEmail, maskEmail: maskEmail, classify: classify };
  if (typeof module === 'object' && module && module.exports) module.exports = pure;
  if (typeof document === 'undefined') return;

  // ── Browser ────────────────────────────────────────────────────────────────
  var I = (root.IASF = root.IASF || {});
  var cfg = (I.config && I.config.pack) || {};
  var D = cfg.dialog || {};
  var customTransport = null;

  var COPY = {
    success: D.successBody || 'Check your inbox for a confirmation link to lock in your spot.',
    duplicate: D.duplicateBody || "That email is already on the list. We'll see you at the next drop.",
    invalid: "That email doesn't look right. Check it and try again.",
    rate: 'Too many attempts. Give it a minute and try again.',
    offline: "You're offline. Reconnect and try again.",
    timeout: 'That took too long. Try again in a moment.',
    error: 'Something went wrong on our end. Try again in a moment.'
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ── Transports ──────────────────────────────────────────────────────────────
  function previewTransport(p) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        var domain = (String(p.email).split('@')[1] || '').toLowerCase();
        if (/fail\.test$/.test(domain)) return resolve({ status: 503, data: { error: '' } });
        if (/dupe\.test$/.test(domain)) return resolve({ status: 409, data: {} });
        if (/rate\.test$/.test(domain)) return resolve({ status: 429, data: { retryAfter: 60 } });
        resolve({ status: 200, data: { message: 'Preview mode: no email was sent or stored.' } });
      }, 950);
    });
  }

  function httpTransport(p) {
    if (root.navigator && root.navigator.onLine === false) {
      return Promise.resolve({ status: 0, data: { offline: true } });
    }
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { ctl && ctl.abort(); }, cfg.timeoutMs || 12000);
    return fetch(cfg.endpoint || '/api/newsletter', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(p),
      credentials: 'same-origin',
      signal: ctl ? ctl.signal : undefined
    })
      .then(function (r) {
        clearTimeout(timer);
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (r.status === 429) d.retryAfter = Number(r.headers.get('retry-after')) || 0;
          return { status: r.status, data: d };
        });
      })
      .catch(function (e) {
        clearTimeout(timer);
        return { status: 0, data: { timeout: !!e && e.name === 'AbortError' } };
      });
  }

  function transport() {
    if (customTransport) return customTransport;
    return cfg.mode === 'preview' ? previewTransport : httpTransport;
  }

  // ── Submit pipeline ─────────────────────────────────────────────────────────
  /** fields: { email, firstName, source, ref, hp } → Promise<{ kind, message, … }> */
  function submit(fields) {
    fields = fields || {};
    var source = fields.source || cfg.source || 'iasf_footer';
    if (fields.hp) return Promise.resolve({ kind: 'success', silent: true, message: '' }); // honeypot: look successful, send nothing
    var email = String(fields.email || '').trim();
    if (!validEmail(email)) return Promise.resolve({ kind: 'invalid', client: true, message: COPY.invalid });

    I.emit('pack:submit', { source: source });
    var payload = {
      email: email,
      first_name: String(fields.firstName || '').trim(),
      last_name: '',
      source_path: location.pathname,
      source_page: location.pathname,
      source_type: source,
      source_ref: fields.ref || null,
      consent_text: fields.consent || cfg.consentText || 'Joined the pack from the storefront.'
    };

    return Promise.resolve(transport()(payload))
      .catch(function () { return { status: 0, data: {} }; })
      .then(function (r) {
        var res = classify(r.status, r.data);
        res.email = email;
        res.source = source;
        if (res.kind === 'network') res.message = res.offline ? COPY.offline : res.timeout ? COPY.timeout : COPY.error;
        else if (res.kind === 'rate') res.message = res.message || (res.retryAfter ? 'Too many attempts. Try again in about ' + Math.max(1, Math.ceil(res.retryAfter / 60)) + ' min.' : COPY.rate);
        else if (res.kind === 'duplicate') res.message = COPY.duplicate;
        else if (res.kind === 'invalid') res.message = res.message || COPY.invalid;
        else if (res.kind === 'error') res.message = res.message || COPY.error;
        I.emit('pack:' + res.kind, { source: source });
        return res;
      });
  }

  // ── Form binding (inline forms + dialog form share this) ───────────────────
  function setNote(form, text, tone) {
    var n = $('[data-pack-note]', form);
    if (!n) return;
    if (!n.hasAttribute('data-default')) n.setAttribute('data-default', n.textContent);
    n.textContent = text == null ? n.getAttribute('data-default') : text;
    if (tone) n.dataset.tone = tone; else n.removeAttribute('data-tone');
  }

  function setBusy(form, on) {
    form.dataset.state = on ? 'busy' : 'idle';
    form.setAttribute('aria-busy', on ? 'true' : 'false');
    var b = $('button[type=submit]', form);
    if (b) b.disabled = !!on;
    $$('input', form).forEach(function (i) { if (i.type !== 'hidden') i.readOnly = !!on; });
  }

  function shake(el) {
    if (!el || I.reducedMotion()) return;
    el.classList.remove('is-shaking'); void el.offsetWidth; el.classList.add('is-shaking');
  }

  function handleForm(form, ctx) {
    if (form.dataset.state === 'busy') return; // double-submit guard
    var emailInput = $('input[name=email]', form);
    var nameInput = $('input[name=first_name]', form);
    var hp = $('input[name=company]', form);
    var source = form.getAttribute('data-pack-source') || cfg.source;

    setNote(form, null);
    emailInput && emailInput.removeAttribute('aria-invalid');
    setBusy(form, true);

    submit({
      email: emailInput ? emailInput.value : '',
      firstName: nameInput ? nameInput.value : '',
      source: source,
      hp: hp ? hp.value : '',
      consent: form.getAttribute('data-consent-text') || ''
    }).then(function (res) {
      setBusy(form, false);
      applyResult(form, res, ctx || {});
    });
  }

  function applyResult(form, res, ctx) {
    var emailInput = $('input[name=email]', form);
    var field = $('.iasf-pack-field', form) || emailInput;

    if (res.kind === 'success') {
      form.dataset.state = 'success';
      var who = res.silent ? '' : maskEmail(res.email);
      if (emailInput) emailInput.value = '';
      var nameInput = $('input[name=first_name]', form); if (nameInput) nameInput.value = '';
      setNote(form, who ? 'Confirmation link sent to ' + who : (res.message || COPY.success), 'ok');
      I.toast.success(D.successTitle ? titleCase(D.successTitle) : "You're in the pack", res.message || COPY.success);
      if (ctx.onSuccess) ctx.onSuccess(res);
      return;
    }
    if (res.kind === 'duplicate') {
      form.dataset.state = 'duplicate';
      setNote(form, "You're already in the pack.", 'ok');
      I.toast.info(D.duplicateTitle ? titleCase(D.duplicateTitle) : 'Already in the pack', res.message);
      if (ctx.onDuplicate) ctx.onDuplicate(res);
      return;
    }

    // invalid / rate / network / error → stay on the form, keep their input, offer retry
    form.dataset.state = 'error';
    if (emailInput && (res.kind === 'invalid')) { emailInput.setAttribute('aria-invalid', 'true'); emailInput.focus(); }
    setNote(form, res.message, 'error');
    shake(field);
    if (!res.client) {
      I.toast.error(
        res.kind === 'rate' ? 'Slow down a moment' : res.kind === 'network' ? "Couldn't reach the pack" : res.kind === 'invalid' ? 'Check that email' : 'Something went wrong',
        res.message,
        res.kind === 'invalid' ? {} : { action: { label: 'Retry', onClick: function () { form.requestSubmit ? form.requestSubmit() : handleForm(form, ctx); } } }
      );
    }
    if (ctx.onError) ctx.onError(res);
  }

  function titleCase(s) {
    return String(s).toLowerCase().replace(/(^|\s)\S/g, function (m) { return m.toUpperCase(); }).replace(/[.]+$/, '');
  }

  function bindForm(form, ctx) {
    if (form.__iasfPack) return;
    form.__iasfPack = true;
    form.setAttribute('novalidate', '');
    form.dataset.state = 'idle';
    form.addEventListener('submit', function (e) { e.preventDefault(); handleForm(form, ctx); });
    form.addEventListener('input', function () {
      if (form.dataset.state === 'success' || form.dataset.state === 'error' || form.dataset.state === 'duplicate') {
        form.dataset.state = 'idle';
        setNote(form, null);
        var ei = $('input[name=email]', form); ei && ei.removeAttribute('aria-invalid');
      }
    });
  }

  // ── Dialog ─────────────────────────────────────────────────────────────────
  var shade = null, lastTrigger = null, trapHandler = null;

  function dialogHTML() {
    return (
      '<section class="iasf-pack-dialog iasf-clay" role="dialog" aria-modal="true" aria-labelledby="iasf-pack-title" aria-describedby="iasf-pack-desc">' +
      '<button type="button" class="iasf-pack-close" data-pack-close aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<div class="iasf-pack-view" data-view="form">' +
      '<p class="iasf-eyebrow"></p><h2 id="iasf-pack-title" class="iasf-pack-title"></h2><p id="iasf-pack-desc" class="iasf-pack-desc"></p>' +
      '<form class="iasf-pack-form iasf-pack-form--dialog" data-pack-form data-pack-source="iasf_dialog" novalidate>' +
      '<label class="iasf-pack-label-text" for="iasf-pack-name"></label>' +
      '<input id="iasf-pack-name" class="iasf-input iasf-glass" name="first_name" type="text" autocomplete="given-name" maxlength="60">' +
      '<label class="iasf-pack-label-text" for="iasf-pack-email"></label>' +
      '<input id="iasf-pack-email" class="iasf-input iasf-glass" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" required>' +
      '<input class="iasf-hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button type="submit" class="iasf-pack-submit iasf-pack-submit--solid"><span class="iasf-pack-label"></span><span class="iasf-pack-arrow" aria-hidden="true">→</span><span class="iasf-pack-spinner" aria-hidden="true"></span></button>' +
      '<p class="iasf-pack-note" data-pack-note role="status" aria-live="polite"></p>' +
      '</form></div>' +
      '<div class="iasf-pack-view" data-view="success" hidden>' +
      '<svg class="iasf-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l8 8 14-17"/></svg>' +
      '<h2 class="iasf-pack-title" data-slot="successTitle"></h2><p class="iasf-pack-desc" data-slot="successBody"></p>' +
      '<button type="button" class="iasf-pack-submit iasf-pack-submit--solid" data-pack-close><span class="iasf-pack-label" data-slot="done"></span></button></div>' +
      '<div class="iasf-pack-view" data-view="duplicate" hidden>' +
      '<svg class="iasf-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M26 15v14M26 36v.5"/></svg>' +
      '<h2 class="iasf-pack-title" data-slot="duplicateTitle"></h2><p class="iasf-pack-desc" data-slot="duplicateBody"></p>' +
      '<button type="button" class="iasf-pack-submit iasf-pack-submit--solid" data-pack-close><span class="iasf-pack-label" data-slot="done"></span></button></div>' +
      '</section>'
    );
  }

  function showView(name) {
    $$('.iasf-pack-view', shade).forEach(function (v) { v.hidden = v.dataset.view !== name; });
    var v = $('.iasf-pack-view[data-view="' + name + '"]', shade);
    var focusEl = $('button[data-pack-close].iasf-pack-submit', v) || $('input', v);
    focusEl && focusEl.focus();
  }

  function open(opts) {
    opts = opts || {};
    if (shade) return;
    lastTrigger = opts.trigger || document.activeElement;
    shade = document.createElement('div');
    shade.className = 'iasf-pack-shade';
    shade.innerHTML = dialogHTML();

    var set = function (sel, txt) { var el = $(sel, shade); if (el) el.textContent = txt; };
    set('.iasf-eyebrow', D.eyebrow || 'FIELD ISSUE 001 / FIRST ACCESS');
    set('#iasf-pack-title', D.title || 'JOIN THE PACK.');
    set('#iasf-pack-desc', D.body || 'Private drops, field notes and member access.');
    set('label[for=iasf-pack-name]', D.nameLabel || 'First name (optional)');
    set('label[for=iasf-pack-email]', D.emailLabel || 'Email address');
    set('.iasf-pack-form--dialog .iasf-pack-label', D.submit || 'Join the pack');
    var form = $('form', shade);
    form.setAttribute('data-pack-source', opts.source || 'iasf_dialog');
    var note = $('[data-pack-note]', form); note.textContent = D.consent || 'We send a confirmation link first. Unsubscribe anytime.';
    $$('[data-slot]', shade).forEach(function (el) {
      var k = el.getAttribute('data-slot');
      el.textContent = D[k] || ({ done: 'Back to the field' })[k] || '';
    });

    bindForm(form, {
      onSuccess: function () { showView('success'); },
      onDuplicate: function () { showView('duplicate'); }
    });

    shade.addEventListener('click', function (e) {
      if (e.target === shade || e.target.closest('[data-pack-close]')) close();
    });
    trapHandler = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('button:not([disabled]):not([hidden]), input:not([tabindex="-1"]):not([readonly]), a[href]', $('.iasf-pack-view:not([hidden])', shade).parentNode)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trapHandler, true);

    document.body.appendChild(shade);
    I.lockScroll(true);
    requestAnimationFrame(function () { shade.classList.add('is-open'); });
    $('#iasf-pack-email', shade).focus();
    I.emit('pack:open', { source: opts.source || 'iasf_dialog' });
  }

  function close() {
    if (!shade) return;
    var s = shade; shade = null;
    document.removeEventListener('keydown', trapHandler, true);
    s.classList.remove('is-open'); s.classList.add('is-closing');
    var done = function () { s.parentNode && s.parentNode.removeChild(s); };
    s.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 420);
    I.lockScroll(false);
    if (lastTrigger && lastTrigger.focus) { try { lastTrigger.focus(); } catch (e) { /* noop */ } }
    if (location.hash === '#join-the-pack') { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* noop */ } }
  }

  // ── Wire-up ────────────────────────────────────────────────────────────────
  function scan() { $$('form[data-pack-form]').forEach(function (f) { bindForm(f); }); }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-pack-open]');
    if (!t) return;
    e.preventDefault();
    open({ trigger: t, source: t.getAttribute('data-pack-source') || 'iasf_dialog' });
  });

  function start() {
    scan();
    if (location.hash === '#join-the-pack') open({ source: 'iasf_link' });
    // pick up forms added later (CMS blocks, page composers)
    if (typeof MutationObserver === 'function') new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();

  I.pack = {
    open: open,
    close: close,
    submit: submit,
    bindForm: bindForm,
    validEmail: validEmail,
    configure: function (o) {
      o = o || {};
      if (typeof o.transport === 'function') customTransport = o.transport;
      if (o.endpoint) cfg.endpoint = o.endpoint;
      if (o.mode) cfg.mode = o.mode;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
