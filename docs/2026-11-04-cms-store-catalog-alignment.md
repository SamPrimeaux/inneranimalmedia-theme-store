# Theme Store → AgentSam CMS alignment audit

**Date:** 2026-11-04
**Repositories:** `SamPrimeaux/inneranimalmedia-theme-store` and `SamPrimeaux/agentsam-sdk`
**Live:** `https://themes.inneranimalmedia.com/` (`inneranimalmedia-theme-store` Worker)
**CMS database:** `inneranimalmedia-business` D1; **R2:** `theme-store` / `THEME_PACKAGES`

## Verified state (not a shipment claim)

- The theme store Worker is deployed, its R2 binding works, and `/api/catalog` advertises **11** products with live R2 previews.
- Only **Plain Jane 0.1.0** advertises a published immutable ZIP in the catalog. The other 10 advertise `preview`, even where their R2 preview is live.
- The CMS already has an **active** `cms_sites` row with ID/slug `theme-store` and primary domain `themes.inneranimalmedia.com`. The site's `settings_json.store` holds authored homepage copy and style tokens.
- No `cms_pages` rows and no `cms_collections` rows currently belong to this site. No rows exist in `agentsam_product_releases`. Most theme products are not registered in `agentsam_products`.
- Current production reads `site/store-site.json` published to R2, validated against `src/site.default.json`. `scripts/publish-site.mjs` can publish the `cms_sites.settings_json.store` document. This is **not** full page/section/product CMS support.
- `apps/ecommerce-cms-agentsam/frontend/static/data/site-theme-projects/index.json` currently lists **only Plain Jane**, with 5 installer-rendered pages versus 9 source CMS manifest pages.
- The Plain Jane edit canvas had root-relative `/theme-packages/...` asset paths that resolved against the AgentSam app origin inside an iframe. The shared `renderThemePage` fix was committed and pushed to `agentsam-sdk/main` as `73b932ed`. The 7 focused install/preview checks passed. **Not yet independently verified as deployed live.**

## Current product/release readiness

| Theme | Version | Public R2 preview | Published ZIP in catalog | SDK installer |
| --- | --- | --- | --- | --- |
| Cypress | 2.6.13 | Yes | No | No |
| Violet | 2.6.13 | Yes | No | No |
| Grove | 2.6.13 | Yes | No | No |
| Ember | 2.6.13 | Yes | No | No |
| Forge | 2.6.13 | Yes | No | No |
| Harbor | 2.6.13 | Yes | No | No |
| Summit | 2.6.13 | Yes | No | No |
| Resolve | 2.6.13 | Yes | No | No |
| IASF | 2.6.14 | Yes | No | No |
| Plain Jane | 0.1.0 | Yes | Yes | Yes, pending live CSS regression check |
| Revise | 0.1.1 | Yes | No | No |

All 10 other theme ZIPs pass the existing `scripts/build-theme-release.mjs <slug>` local packaging command. They were **not** remotely published or advertised as installer-ready.

## Owners and existing implementation to extend

**Theme Store repo**: `src/main.tsx` owns gallery/detail routes; `src/catalog.ts` and `scripts/build-catalog.mjs` build the package-source product catalog; `src/worker.ts` serves catalog, site snapshot, preview files, release manifest and immutable downloads; `src/site.mjs` validates website copy/tokens; `scripts/publish-site.mjs` explicitly publishes the site snapshot; `scripts/build-theme-release.mjs` materializes/checksums ZIPs; `scripts/publish-theme-packages.mjs` publishes complete R2 previews.

**AgentSam SDK repo**: `apps/local-studio/backend/worker/studio-website-theme-install.js` authorizes and verifies theme installs; `apps/local-studio/scripts/build-installable-website-theme.mjs` extracts editable source-backed projects only after verifying a published release checksum and source manifest; `apps/ecommerce-cms-agentsam/frontend/theme-editor/project.mjs` owns the shared editable HTML renderer; `apps/ecommerce-cms-agentsam/frontend/static/data/site-theme-projects/index.json` gates installer readiness. The CMS store already persists private theme project revisions.

## Agreed canonical model (no parallel CMS)

1. **Website:** `cms_sites` is Theme Store's site identity. Populate `cms_pages` for `/` and each of the 11 `/themes/<slug>/` storefront detail URLs. Build editable sections/blocks from the *existing* layout using `cms_page_sections`, `cms_section_blocks`, and existing `cms_definitions` conventions. Existing page drafts/revisions own draft/live/rollback, rather than ad-hoc new tables.
2. **Product:** an installable theme is a product in `agentsam_products`, while source package manifests continue to own immutable technical metadata. Customer-editable storefront content belongs to the site's CMS pages and product presentation metadata. Never let editorial edits change checksums, release status, or R2 package paths.
3. **Collection:** categories and curated groups are site-scoped `cms_collections`, with `cms_collection_items` referencing theme product IDs. Use the same CMS collection infrastructure as commerce, without inventing a second collection table.
4. **Release:** `agentsam_product_releases` records each **verified** immutable R2 ZIP, version, SHA-256, preview and installer compatibility. Preview files at `theme-packages/<slug>/<version>/preview/*` are not the installable ZIP; release ZIPs live at `releases/<slug>/<version>/<sha256>.zip`.
5. **Publishing:** preserve explicit draft vs published boundaries. Generate validated published page/product/collection snapshots from approved CMS revisions, atomically publish them to R2, and have the Theme Store Worker render only the published snapshot. Do **not** make live Worker requests directly read editable draft section data.
6. **Installation:** expand the **existing** source-manifest + checksum-verified SDK installer for the other 10 themes. Never activate Try/Install solely because a preview folder or ZIP exists. Every advertised release must have the matching editable project artifact and successful permission/reinstall tests.
7. **Editor:** the existing AgentSam theme editor must select the `theme-store` site and each storefront page, edit copy/layout/media/SEO/navigation, save draft, preview without publishing, publish a revision, and restore a prior revision. Installed customer copies remain independent of the original theme release.

**Do not use `cms_themes`:** that table is for UI color/appearance themes, not website packages.

## Acceptance checklist (block production claim until complete)

- `/api/catalog` resolves 11 canonical theme products with editable catalog metadata and the correct actual installer readiness.
- Homepage and all 11 detail paths have canonical `cms_pages` and editable sections, plus a tested route-to-page resolution.
- Theme collections are real CMS collections; adding/removing a product changes public filtering after publishing, not after saving a private draft.
- A site editor can change the homepage hero, a theme detail description, a media asset, navigation, and SEO; draft preview shows changes, public URL stays unchanged until publishing.
- The published revisions are reversible without mutating the original package ZIPs or installed customer projects.
- All 11 versions have R2 ZIPs with verified digests **and** matching source-based editable project artifacts; install into two different authorized sites, save content edits, reopen, and verify isolation.
- Plain Jane editor screenshot reproduces the proper fonts/layout/imagery under its AgentSam host after the deployed renderer fix.
- Validate all live routes on phone/tablet/desktop; no 404 asset references, unstyled editor pages, or false published/installable badges.

## Verification performed on 2026-11-04

- `npm test` in Theme Store: **23/23 passed**.
- `npm run build` in Theme Store: **passed**.
- `node scripts/build-theme-release.mjs <slug>`: **10/10 preview-only themes generated local ZIPs**; no R2 changes.
- SDK focused theme-install + preview regression suite: **7/7 passed**.
- The Theme Store Worker and SDK Worker were both deployed earlier that day, but neither deployment proves the subsequent SDK code fix has reached production.
