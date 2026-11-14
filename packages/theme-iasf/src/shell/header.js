import { shellDefaults } from './config.js';

export const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderDropbar(dropbar) {
  if (!dropbar?.enabled) return '';
  const list = (Array.isArray(dropbar.messages) ? dropbar.messages : []).filter(Boolean);
  const messages = list.length ? list : [dropbar.text].filter(Boolean);
  if (!messages.length) return '';
  const cta = dropbar.cta?.label
    ? '<li><a class="ia-dropbar-cta" href="#join-the-pack" data-pack-open data-pack-source="iasf_dropbar">' + esc(dropbar.cta.label) + '</a></li>'
    : '';
  const items = messages.map((m) => '<li>' + esc(m) + '</li>').join('') + cta;
  // The set is rendered twice so the track can loop seamlessly at translateX(-50%).
  const set = (hidden) => '<ul class="ia-dropbar-set"' + (hidden ? ' aria-hidden="true"' : '') + '>' + items + '</ul>';
  return (
    '<div class="ia-dropbar" data-iasf-dropbar role="region" aria-label="Announcements"' +
    (dropbar.pauseOnHover === false ? '' : ' data-pause') +
    ' style="--ia-marquee:' + (Number(dropbar.speed) > 0 ? Number(dropbar.speed) : 38) + 's">' +
    '<div class="ia-dropbar-track">' + set(false) + set(true) + '</div></div>\n'
  );
}

/**
 * Announcement marquee + floating pill header (menu + nav left, logo centre,
 * search / bag / CTA right). Animations live in storefront.css and runtime/header.js;
 * this only emits semantic, hook-bearing markup.
 */
export function renderHeader(header = shellDefaults.header) {
  const { dropbar, brand, nav, actions, motion } = header;

  const links = (nav || [])
    .map((l, i) => '<a href="' + esc(l.href) + '" data-iasf-nav style="--i:' + i + '">' + esc(l.label) + '</a>')
    .join('');

  const search = actions?.search
    ? '<button type="button" class="ia-icon-btn" data-iasf-action="search" aria-label="Search"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5" stroke-linecap="round"/></svg></button>'
    : '';
  const bag = actions?.bag
    ? '<button type="button" class="ia-bag-btn" data-iasf-action="bag" aria-label="View bag, 0 items">' +
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z" stroke-linejoin="round"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>' +
      '<span>' + esc(actions.bagLabel || 'Bag') + '</span> <b class="ia-count" data-iasf-count>0</b></button>'
    : '';
  const cta = actions?.cta?.label
    ? '<a class="ia-cta-pill" href="#join-the-pack" data-pack-open data-pack-source="' + esc(actions.cta.source || 'iasf_header') + '">' + esc(actions.cta.label) + '</a>'
    : '';

  return (
    renderDropbar(dropbar) +
    '<header class="ia-header" data-iasf-header' +
    (motion?.enabled === false ? ' data-motion="off"' : '') +
    '><div class="ia-header-pill">' +
    '<div class="ia-header-left"><button class="ia-menu-btn" type="button" data-iasf-menu aria-expanded="false" aria-controls="iasf-nav" aria-label="Toggle navigation"><span></span><span></span></button>' +
    '<nav id="iasf-nav" class="ia-nav" aria-label="Primary">' + links + '</nav></div>' +
    '<a class="ia-logo" href="' + esc(brand?.href || '/') + '"><span class="ia-mark" aria-hidden="true"><i></i><i></i></span><b>' +
    esc(brand?.name) +
    '</b></a>' +
    '<div class="ia-actions">' + search + bag + cta + '</div>' +
    '<i class="ia-header-progress" aria-hidden="true"></i>' +
    '</div></header>'
  );
}
