import { shellDefaults } from './config.js';
import { esc } from './header.js';
import { renderSignature } from './signature.js';

const link = (l) =>
  l.href
    ? '<a href="' + esc(l.href) + '"' + (/^https?:/i.test(l.href) ? ' rel="noopener"' : '') + '>' + esc(l.label) + '</a>'
    : '<span class="is-unlinked">' + esc(l.label) + '</span>';

/**
 * The footer as ONE editable unit: jungle clay/glass shell, newsletter form,
 * link groups, legal row and credit — all driven by config.footer.
 * `year` is injectable so builds are reproducible.
 */
export function renderFooter(footer = shellDefaults.footer, { year = new Date().getUTCFullYear() } = {}) {
  const f = footer;
  const tone = f.tone === 'light' ? 'light' : 'dark';
  const glb = f.glb || {};
  const style = [
    f.media?.src ? "--iasf-footer-media:url('" + esc(f.media.src) + "')" : '',
    '--iasf-footer-overlay:' + Number(f.media?.overlay ?? 0.74),
    '--iasf-glb-opacity:' + Number(glb.canvasOpacity ?? 0.16),
    glb.tint ? '--iasf-glb-tint:' + esc(glb.tint) : '',
  ].filter(Boolean).join(';');

  const copyright = esc(f.copyright || '').replace('{year}', '<span data-iasf-year>' + year + '</span>');

  const contact = [
    f.contact?.email ? '<a href="mailto:' + esc(f.contact.email) + '">' + esc(f.contact.email) + '</a>' : '',
    f.contact?.phone ? '<a href="tel:' + esc(String(f.contact.phone).replace(/[^+\d]/g, '')) + '">' + esc(f.contact.phone) + '</a>' : '',
  ].filter(Boolean).join('');

  const groups = (f.groups || [])
    .filter((g) => g.links?.length)
    .map(
      (g, i) =>
        '<div class="iasf-footer-group iasf-glass" data-reveal style="--d:' + (i + 2) + '"><h3 class="iasf-eyebrow">' + esc(g.label) + '</h3><ul>' +
        g.links.map((l) => '<li>' + link(l) + '</li>').join('') +
        '</ul></div>'
    )
    .join('');

  const legal = (f.legal || []).length
    ? '<nav class="iasf-footer-legal" aria-label="Legal">' + f.legal.map(link).join('') + '</nav>'
    : '';

  const credit = f.credit?.enabled
    ? '<a class="iasf-footer-credit" href="' + esc(f.credit.href) + '" rel="noopener"><span>' + esc(f.credit.label) + '</span>' +
      renderSignature({ title: f.credit.name }) + '</a>'
    : '';

  return (
    '<footer class="iasf-footer" id="iasf-footer" data-iasf-footer data-tone="' + tone + '"' + (style ? ' style="' + style + '"' : '') + '>' +
    '<div class="iasf-footer-media" aria-hidden="true"></div>' +
    (glb.enabled && glb.url
      ? '<canvas class="iasf-footer-glb" aria-hidden="true" data-glb-url="' + esc(glb.url) + '" data-glb-rotation="' + Number(glb.rotation ?? 0.0016) +
        '" data-glb-opacity="' + Number(glb.opacity ?? 0.92) + '" data-glb-animate="' + (glb.animate === false ? 'false' : 'true') + '"></canvas>'
      : '') +
    '<div class="iasf-footer-inner">' +
    '<section class="iasf-footer-cta iasf-clay" data-reveal>' +
    (f.eyebrow ? '<p class="iasf-eyebrow">' + esc(f.eyebrow) + '</p>' : '') +
    '<h2 class="iasf-footer-heading">' + esc(f.heading) + '</h2>' +
    (f.body ? '<p class="iasf-footer-body">' + esc(f.body) + '</p>' : '') +
    '<form class="iasf-pack-form" data-pack-form data-pack-source="' + esc(f.form?.source || 'iasf_footer') + '" novalidate>' +
    '<label class="iasf-sr" for="iasf-footer-email">' + esc(f.form?.label || 'Email address') + '</label>' +
    '<div class="iasf-pack-field iasf-glass">' +
    '<input id="iasf-footer-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="' +
    esc(f.form?.placeholder || 'Email address') + '" required>' +
    '<button type="submit" class="iasf-pack-submit"><span class="iasf-pack-label">' + esc(f.form?.button || 'Join the pack') +
    '</span><span class="iasf-pack-arrow" aria-hidden="true">→</span><span class="iasf-pack-spinner" aria-hidden="true"></span></button>' +
    '</div>' +
    '<input class="iasf-hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '<p class="iasf-pack-note" data-pack-note role="status" aria-live="polite">' + esc(f.form?.consent || '') + '</p>' +
    '</form>' +
    (contact ? '<div class="iasf-footer-contact">' + contact + '</div>' : '') +
    '</section>' +
    '<nav class="iasf-footer-links" aria-label="Footer">' + groups + '</nav>' +
    '</div>' +
    '<div class="iasf-footer-bar iasf-glass" data-reveal style="--d:5">' +
    '<span class="iasf-footer-copy">' + copyright + '</span>' +
    (f.tagline ? '<span class="iasf-footer-tagline">' + esc(f.tagline) + '</span>' : '') +
    legal + credit +
    '</div>' +
    '</footer>'
  );
}
