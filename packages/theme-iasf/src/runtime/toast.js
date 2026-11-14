/* IASF toasts — stacked, animated, accessible. IASF.toast.show({ type, title, message, action, duration }) */
(function (root) {
  'use strict';
  if (typeof document === 'undefined') return;
  var I = (root.IASF = root.IASF || {});

  var MAX = 3;
  var host = null;

  var ICONS = {
    success: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-7"/></svg>',
    error: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 7.5v5.5M12 16.5v.1"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 11v5.5M12 7.5v.1"/></svg>'
  };

  function ensureHost() {
    if (host && host.isConnected) return host;
    host = document.createElement('div');
    host.className = 'iasf-toasts';
    host.setAttribute('role', 'region');
    host.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(host);
    return host;
  }

  function show(opts) {
    opts = opts || {};
    var type = ICONS[opts.type] ? opts.type : 'info';
    var duration = opts.duration != null ? opts.duration : (type === 'error' ? 8000 : 6000);
    var h = ensureHost();

    var el = document.createElement('div');
    el.className = 'iasf-toast';
    el.dataset.type = type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');

    var icon = document.createElement('span');
    icon.className = 'iasf-toast-icon';
    icon.innerHTML = ICONS[type];

    var body = document.createElement('div');
    body.className = 'iasf-toast-body';
    if (opts.title) { var t = document.createElement('strong'); t.textContent = opts.title; body.appendChild(t); }
    if (opts.message) { var m = document.createElement('span'); m.textContent = opts.message; body.appendChild(m); }

    el.appendChild(icon);
    el.appendChild(body);

    var closed = false;
    function dismiss() {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      el.classList.add('is-leaving');
      var done = function () { if (el.parentNode) el.parentNode.removeChild(el); };
      el.addEventListener('animationend', done, { once: true });
      setTimeout(done, 420);
    }

    if (opts.action && opts.action.label) {
      var a = document.createElement('button');
      a.type = 'button';
      a.className = 'iasf-toast-action';
      a.textContent = opts.action.label;
      a.addEventListener('click', function () {
        try { opts.action.onClick && opts.action.onClick(); } finally { dismiss(); }
      });
      el.appendChild(a);
    }

    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'iasf-toast-close';
    x.setAttribute('aria-label', 'Dismiss notification');
    x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    x.addEventListener('click', dismiss);
    el.appendChild(x);

    var timer = 0;
    if (duration > 0) {
      var bar = document.createElement('i');
      bar.className = 'iasf-toast-progress';
      bar.style.animationDuration = duration + 'ms';
      el.appendChild(bar);
      var remaining = duration, started = Date.now();
      var arm = function () { started = Date.now(); timer = setTimeout(dismiss, remaining); bar.style.animationPlayState = 'running'; };
      var pause = function () { clearTimeout(timer); remaining -= Date.now() - started; bar.style.animationPlayState = 'paused'; };
      el.addEventListener('mouseenter', pause);
      el.addEventListener('mouseleave', arm);
      el.addEventListener('focusin', pause);
      el.addEventListener('focusout', arm);
      arm();
    }

    h.appendChild(el);
    while (h.children.length > MAX) { var old = h.firstElementChild; if (old === el) break; old.remove(); }
    I.emit('toast', { type: type });
    return { dismiss: dismiss, el: el };
  }

  I.toast = {
    show: show,
    success: function (title, message, o) { return show(Object.assign({ type: 'success', title: title, message: message }, o)); },
    error: function (title, message, o) { return show(Object.assign({ type: 'error', title: title, message: message }, o)); },
    info: function (title, message, o) { return show(Object.assign({ type: 'info', title: title, message: message }, o)); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
