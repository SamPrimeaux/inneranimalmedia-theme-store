# Revise — Editorial Commerce

Revise 0.1.3 is an independent stock theme with a coherent Revise demonstration identity. It is not an InnerAnimalMedia company site or an extension of PrimeTech. The source of truth is this package; AgentSam's merchant CMS installs a site-scoped copy.

## Storefront and CMS scope

The stock project has **31 CMS page records across 22 page/template types**, **161 editable sections**, 1,416 field definitions and 80 configured repeatable blocks. These include Home, product catalog and four individual offering detail types (physical, digital, service and experience), collections, digital editions, services, experiences, gift cards, checkout layout, account templates, blog/article, search, content pages, password and 404. Global announcement/header/footer sections are shared.

The visual system uses a full-viewport navigation, dark/light editorial compositions, responsive product and collection grids, independent product detail pages, a scroll-driven story, and a five-image source-backed Revise identity lookbook. The lookbook and hero media have CMS image/text fields. Original media should be retained as source masters; the committed WebP files are storefront derivatives.

**Commerce boundary:** the preview catalog is editorial sample content from `site/fixtures/revise-demo.json`, not a production merchant catalog. The browser uses a preview-only local cart. Identity, real availability, checkout processing, payments, taxes, fulfillment, subscriber delivery and ordering belong to the merchant's trusted AgentSam host. This preview never charges anyone or creates orders. Do not expose generated sample products as actual merchant inventory without explicit catalog mapping.

## Source-owned creative world (owner opt-in)

The full creative-scene exploration is **not enabled in stock Revise**. For the InnerAnimalMedia/PrimeTech-owned experience only, an independently addressed scene pack is available, synchronized from the real PrimeTech showcase at `agentsam-3d-studio-primetech/experiences/primetech-showcase-v1`:

- One Three.js procedural world with the original **11 camera stops** and corresponding authored section content.
- One native `.iamscene.json` circuit scene, its four original GLTF assets, and a real bundled IAM scene runtime with authored interaction.
- One source-owned GLB for the cinematic footer, using lazy visibility-driven Three.js rendering.
- Original companion portraits and editorial source assets, with SHA-256 hashes in `owner-scenes/scene-manifest.json`.

Use `node packages/theme-revise/scripts/sync-owner-scenes.mjs <absolute-showcase-dir>` to update this pack from the source. The script fails if the expected 11 scene stops or original assets are missing, so source changes cannot silently degrade the design. The source showcase remains authoritative; the scene pack is a derived owner presentation, not a second CAD/BIM project.

On the local Theme Store development server, review it at:
`/theme-packages/revise/0.1.3/preview/pages/world/?owner=1`.

The regular portable theme deliberately **omits `owner-scenes/`**. Only `materializePrebuild(destination,{basePath,includeOwnerScenes:true})` includes the complete environment. Do not enable this option when distributing the default theme to other merchants. The owner experience is implemented for local review; importing those runtime-mounted scenes as merchant-editable live CMS sections still requires verifying the CMS scene renderer and source asset adapter.

## Review and builds

- `node packages/theme-revise/scripts/build-install-project.mjs` rebuilds the canonical CMS installation project.
- `node --test tests/revise-preview.test.mjs` verifies the package and the preview/owner separation.
- `python3 tests/revise-owner-scenes.browser.py` runs desktop and mobile browser acceptance against localhost:4321 (requires Playwright and Google Chrome on the review machine).
- `npm test` runs the repository's broader tests.

Revise remains `release.status: preview`, with no production release hash or R2 publication. A local preview is not proof of a deployed customer site. Do not publish to production without review and explicit authorization.

## Project separation

DreamHouse's V1.5 BIM/V1.6 scene alignment belongs to the existing DreamHouse project and its CAD/D1/R2 data path, not this merchant theme. Nothing in this Revise scene integration changes the DreamHouse current-project manifest, native model authority, gallery associations or production database records.
