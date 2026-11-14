import { shellDefaults } from './config.js';

export const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Announcement bar + global header. Animations live in storefront.css and
 * runtime/header.js; this only emits semantic, hook-bearing markup.
 */
export function renderHeader(header = shellDefaults.header) {
  const { dropbar, brand, nav, actions, motion } = header;
  const bar = dropbar?.enabled
    ? '<div class="ia-dropbar" data-iasf-dropbar><span class="ia-dropbar-track"><span class="ia-dropbar-text">' +
      esc(dropbar.text) +
      '</span>' +
      (dropbar.cta?.label
        ? '<a class="ia-dropbar-cta" href="#join-the-pack" data-pack-open data-pack-source="iasf_dropbar">' + esc(dropbar.cta.label) + '</a>'
        : '') +
      '</span></div>\n'
    : '';

  const links = (nav || [])
    .map((l, i) => '<a href="' + esc(l.href) + '" data-iasf-nav style="--i:' + i + '">' + esc(l.label) + '</a>')
    .join('');

  const search = actions?.search
    ? '<button type="button" data-iasf-action="search">Search</button>'
    : '';
  const bag = actions?.bag
    ? '<button type="button" data-iasf-action="bag" aria-label="View bag, 0 items">' +
      esc(actions.bagLabel || 'Bag') +
      ' <span class="ia-count" data-iasf-count>0</span></button>'
    : '';

  return (
    bar +
    '<header class="ia-header" data-iasf-header' +
    (motion?.enabled === false ? ' data-motion="off"' : '') +
    '>' +
    '<a class="ia-logo" href="' + esc(brand?.href || '/') + '"><span class="ia-mark" aria-hidden="true"><i></i><i></i></span><b>' +
    esc(brand?.name) +
    '</b></a>' +
    '<nav id="iasf-nav" class="ia-nav" aria-label="Primary">' + links + '</nav>' +
    '<div class="ia-actions">' + search + bag +
    '<button class="ia-menu-btn" type="button" data-iasf-menu aria-expanded="false" aria-controls="iasf-nav" aria-label="Toggle navigation"><span></span><span></span></button>' +
    '</div>' +
    '<i class="ia-header-progress" aria-hidden="true"></i>' +
    '</header>'
  );
}
