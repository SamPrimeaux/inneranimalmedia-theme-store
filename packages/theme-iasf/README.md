# @inneranimalmedia/theme-iasf

**IASF** (Inner Animal Storefront) — stock, installable commerce/editorial theme.

Normalized from `studio-cms-editor` harvest lane `theme_layout_donor` into a portable package:

- catalog content (`products`, `archetypes`, `journal`)
- CSS tokens + `styles/storefront.css`
- `createIasfStarterPackSeed()` for CMS first-run (`agentsam-cms create … --starter iasf`)

## Usage

```js
import { createTheme, createIasfStarterPackSeed, readStorefrontCss } from '@inneranimalmedia/theme-iasf';

const theme = createTheme(); // installable: true, id: iasf
const starter = createIasfStarterPackSeed();
```

Canonical id: **`iasf`**. Aliases: `inneranimals-site`, `theme-inneranimals-site`.

## Global shell (header, footer, Join the Pack)

Every page gets its header and footer from one config: `src/shell/config.js` (`shellDefaults`).
The CMS starter seed uses the same object for its header/footer section fields, so editing a
section and the rendered storefront share one source of truth. Pages contain only the markers
`<!--iasf:header-->` and `<!--iasf:footer-->`; `materializePrebuild` renders them.

- **Header**: announcement bar, glass sticky header, entrance/stagger, condense + hide-on-scroll,
  scroll progress bar, animated mobile menu, cart-count bump (`iasf:cart:count`). Toggle via `header.motion`.
- **Footer**: dark jungle clay/glass unit. Background image (`footer.media`), lazy WebGL GLB
  (`footer.glb`; stock URL, swap or disable), link groups, legal, signature credit. Unlinked socials render
  visibly but are not clickable.
- **Join the Pack**: one module (`runtime/pack.js`) drives the footer form, any `[data-pack-form]`,
  and the dialog (`[data-pack-open]` or `#join-the-pack`). Toasts, inline note, success/duplicate/error states.
  Wire contract: `POST pack.endpoint` (default `/api/newsletter`) with JSON `{email, name?, source, consent}`;
  200/201 success, 409 duplicate, 429 rate limit (honors `Retry-After`), anything else error.
  Hooks: `IASF.pack.configure({transport})` and `iasf:pack:*` events. Preview builds use `mode: 'preview'`
  (no network; `@dupe.test`, `@fail.test`, `@rate.test` simulate each outcome).
- **Loader**: globe splash once per session (`loader`), gated by an inline head script with a failsafe.

Vendor bundles in `src/vendor` are built from `vendor-src`; stock media lives in `site/assets/iasf`.

## Section library (2.6.16)

The home page ships a complete, editable section set ported from the Resolve patterns and re-skinned with the IASF tokens (every color is derived from `--ia-*`, nothing is baked in):

| Section | Hook | Notes |
| --- | --- | --- |
| Announcement marquee | `.ia-dropbar` | Loops forever; messages, speed and pause-on-hover live in `shellDefaults.header.dropbar`. Static + wrapped for reduced motion. |
| Floating pill header | `.ia-header-pill` | Menu + nav left, logo centre, search / bag / CTA right; condenses, hides on scroll down, scroll-progress line. |
| Atlas hero | `.ia-hero--atlas` | Full-bleed image, serif headline, glass tabbed card + cream milestone carousel (`data-iasf-tabs`, `data-iasf-carousel`). |
| Category cards | `.ia-cats` | Snap-scrolling cards with hover lift. |
| Editorial tiles | `.ia-tiles` | Image tiles plus a "Join the pack" invitation tile that opens the pack dialog. |
| Story rings | `.ia-rings` | Circular archetype links. |
| Tabbed product shelf | `data-iasf-shelf` | New / Best sellers / Archive tabs, arrows, quick add. |
| Brand world, Feature split, Quote | `.ia-world`, `.ia-feature`, `.ia-quote` | Parallax image, material spec list, testimonial. |

**Gallery → product transitions.** Cross-document View Transitions (`@view-transition { navigation: auto }`). `runtime/sections.js` names the product image that matches the page you are leaving (and returning from) `iasf-product`, so the browser morphs that exact image into the product hero and back. Browsers without support navigate normally.

**Quick add.** Dispatches a cancelable `iasf:cart:add` event (`{ slug, size, name }`). Call `preventDefault()` to take over with a real cart; otherwise the preview cart is updated and a toast confirms.

All copy, images (`/assets/iasf/*`) and milestone/quote text are stock placeholders — replace freely. The CMS starter seed exposes each section by name (`Atlas hero`, `Category cards`, `Editorial tiles`, `Story rings`, `Product shelf`, `Brand world`, `Material feature`, `Quote`).
