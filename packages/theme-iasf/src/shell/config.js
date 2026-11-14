/**
 * IASF global shell — ONE source of truth for the header, footer, Join the Pack
 * flow and page loader. The renderers (header.js / footer.js), the runtime JSON
 * (`#iasf-config`) and the CMS starter seed all read from this shape, so editing
 * it (or the CMS section that mirrors it) changes every page.
 *
 * Nothing here is an account id, zone id or secret. Empty strings hide a row.
 * Colors are NOT configured here: every color comes from the active theme tokens
 * (see tokens.js / the :root block in storefront.css).
 */

export const SHELL_VERSION = 1;

export const shellDefaults = Object.freeze({
  header: {
    dropbar: {
      enabled: true,
      text: 'FIELD ISSUE 001 — FIRST ACCESS OPENS SOON',
      // Scrolling announcement messages (loops continuously). Empty list falls back to `text`.
      messages: [
        'FIELD ISSUE 001 — FIRST ACCESS OPENS SOON',
        'FREE SHIPPING ON ORDERS OVER $150',
        'HEAVYWEIGHT BASICS, CUT AND SEWN IN SMALL RUNS',
        'MEMBERS GET FIRST ACCESS TO EVERY DROP',
      ],
      speed: 38, // seconds per loop
      pauseOnHover: true,
      cta: { label: 'Join the pack', action: 'pack' },
    },
    brand: { name: 'Inner Animals', href: '/' },
    nav: [
      { label: 'Shop', href: '/shop/' },
      { label: 'Archetypes', href: '/collections/' },
      { label: 'Field Journal', href: '/journal/' },
      { label: 'Our Code', href: '/story/' },
    ],
    actions: { search: true, bag: true, bagLabel: 'Bag', cta: { label: 'Join the pack', source: 'iasf_header' } },
    motion: {
      enabled: true,
      condenseOnScroll: true,
      hideOnScrollDown: true,
      scrollProgress: true,
    },
  },

  footer: {
    tone: 'dark', // 'dark' (jungle clay/glass) | 'light' (bone clay/glass)
    eyebrow: 'FIELD ISSUE 001 / PRIVATE DROPS',
    heading: 'STAY CLOSE TO THE WILD.',
    body: 'Private drops, field notes and member access.',
    form: {
      label: 'Email address',
      placeholder: 'Email address',
      button: 'Join the pack',
      consent: 'Private drops and field notes. Unsubscribe anytime.',
      source: 'iasf_footer',
    },
    contact: { email: '', phone: '' },
    groups: [
      {
        label: 'Field store',
        links: [
          { label: 'Shop', href: '/shop/' },
          { label: 'Archetypes', href: '/collections/' },
        ],
      },
      {
        label: 'The pack',
        links: [
          { label: 'Field Journal', href: '/journal/' },
          { label: 'Our Code', href: '/story/' },
        ],
      },
      {
        label: 'Follow',
        // An empty href renders a visible, non-clickable label until a URL is set.
        links: [{ label: 'Instagram', href: '' }],
      },
    ],
    legal: [],
    copyright: '© {year} Inner Animals. Built in Lafayette, Louisiana.',
    tagline: 'Civilized enough to function. Wild enough to matter.',
    credit: {
      enabled: true,
      label: 'Developed by',
      name: 'Inner Animal Media',
      href: 'https://inneranimalmedia.com',
    },
    media: {
      // Packaged stock media. Delete or swap freely: an empty src renders a clean gradient.
      src: '/assets/iasf/jungle-river-mist-bg.webp',
      overlay: 0.74,
    },
    glb: {
      enabled: true,
      // Stock model. Replace with any .glb URL, or set enabled:false.
      url: 'https://assets.inneranimalmedia.com/glb/inneranimalmediafooterglb.glb',
      tint: '', // empty = foreground token
      opacity: 0.92, // model material opacity
      canvasOpacity: 0.16, // how visible the whole canvas is behind the glass
      rotation: 0.0016,
      animate: true,
    },
  },

  pack: {
    // Same contract the Theme Store's other newsletter blocks use: POST JSON, see docs.
    endpoint: '/api/newsletter',
    // 'live' posts to endpoint. 'preview' simulates the round trip (static demos).
    mode: 'live',
    timeoutMs: 12000,
    source: 'iasf_dialog',
    consentText: 'Joined the Inner Animals pack from the storefront.',
    dialog: {
      eyebrow: 'FIELD ISSUE 001 / FIRST ACCESS',
      title: 'JOIN THE PACK.',
      body: 'Private drops, field notes and member access. No noise, no algorithm.',
      nameLabel: 'First name (optional)',
      emailLabel: 'Email address',
      submit: 'Join the pack',
      consent: 'We send a confirmation link first. Unsubscribe anytime.',
      successTitle: "YOU'RE IN THE PACK.",
      successBody: 'Check your inbox for a confirmation link to lock in your spot.',
      duplicateTitle: 'ALREADY IN THE PACK.',
      duplicateBody: "That email is already on the list. We'll see you at the next drop.",
      done: 'Back to the field',
    },
  },

  loader: {
    enabled: true,
    // 'session' = first page of each browser session, 'always' = every load, 'off'
    mode: 'session',
    minMs: 900,
    maxMs: 6000,
    label: 'Entering the field',
  },
});

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

/** Deep-merge user overrides onto defaults (arrays replace, never concatenate). */
export function mergeShellConfig(overrides = {}, base = shellDefaults) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(overrides || {})) {
    if (isPlainObject(value) && isPlainObject(base[key])) out[key] = mergeShellConfig(value, base[key]);
    else if (value !== undefined) out[key] = Array.isArray(value) ? value.map((v) => (isPlainObject(v) ? { ...v } : v)) : value;
  }
  return out;
}

/** Editor schema for the shell — what the CMS/Theme Studio exposes as editable fields. */
export const shellSchema = Object.freeze({
  footer: [
    { key: 'tone', label: 'Tone', type: 'select', options: ['dark', 'light'] },
    { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'body', label: 'Body', type: 'textarea' },
    { key: 'form.button', label: 'Signup button', type: 'text' },
    { key: 'form.consent', label: 'Signup consent line', type: 'text' },
    { key: 'contact.email', label: 'Contact email', type: 'email' },
    { key: 'contact.phone', label: 'Contact phone', type: 'text' },
    { key: 'groups', label: 'Link groups', type: 'link-groups' },
    { key: 'legal', label: 'Legal links', type: 'links' },
    { key: 'copyright', label: 'Copyright ({year} supported)', type: 'text' },
    { key: 'tagline', label: 'Tagline', type: 'text' },
    { key: 'credit', label: 'Credit signature', type: 'toggle-link' },
    { key: 'media.src', label: 'Backdrop media', type: 'media' },
    { key: 'media.overlay', label: 'Backdrop darkness', type: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'glb.enabled', label: '3D model', type: 'toggle' },
    { key: 'glb.url', label: '3D model URL (.glb)', type: 'url' },
    { key: 'glb.tint', label: '3D model tint (blank = foreground)', type: 'color' },
    { key: 'glb.canvasOpacity', label: '3D model visibility', type: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'glb.rotation', label: '3D model spin', type: 'range', min: 0, max: 0.01, step: 0.0002 },
  ],
  header: [
    { key: 'dropbar.enabled', label: 'Announcement bar', type: 'toggle' },
    { key: 'dropbar.text', label: 'Announcement text', type: 'text' },
    { key: 'dropbar.cta.label', label: 'Announcement button', type: 'text' },
    { key: 'brand.name', label: 'Brand name', type: 'text' },
    { key: 'nav', label: 'Navigation', type: 'links' },
    { key: 'actions.bagLabel', label: 'Bag label', type: 'text' },
    { key: 'motion.enabled', label: 'Header animation', type: 'toggle' },
    { key: 'motion.hideOnScrollDown', label: 'Hide on scroll down', type: 'toggle' },
    { key: 'motion.scrollProgress', label: 'Scroll progress line', type: 'toggle' },
  ],
  pack: [
    { key: 'endpoint', label: 'Signup endpoint', type: 'text' },
    { key: 'mode', label: 'Mode', type: 'select', options: ['live', 'preview'] },
    { key: 'dialog.title', label: 'Dialog title', type: 'text' },
    { key: 'dialog.body', label: 'Dialog body', type: 'textarea' },
    { key: 'dialog.successTitle', label: 'Success title', type: 'text' },
    { key: 'dialog.successBody', label: 'Success message', type: 'textarea' },
  ],
  loader: [
    { key: 'enabled', label: 'Page loader', type: 'toggle' },
    { key: 'mode', label: 'When to show', type: 'select', options: ['session', 'always', 'off'] },
    { key: 'label', label: 'Loader label', type: 'text' },
  ],
});

/** The subset the browser runtime reads from <script id="iasf-config">. */
export function runtimeConfig(config = shellDefaults) {
  const { header, footer, pack, loader } = config;
  return {
    v: SHELL_VERSION,
    pack: {
      endpoint: pack.endpoint,
      mode: pack.mode,
      timeoutMs: pack.timeoutMs,
      source: pack.source,
      consentText: pack.consentText,
      dialog: pack.dialog,
    },
    header: { motion: header.motion },
    footer: { glb: footer.glb },
    loader,
  };
}
