# Canonical Theme Store distribution and CMS v2 installation contract

## Existing source inventory

The existing AgentSam eight-theme gallery lives in **agentsam-sdk/apps/frontend/public/site/themes/**; authored catalog data is at **agentsam-sdk/apps/theme-gallery-preview/data/catalog.json**. The standalone localhost 4324 process was independently traced to **inneranimalmedia-brand-guide/studio** (an unrelated private brand research tool). Use its visual language by deliberate design, not by importing private editor logic or content into this public storefront.

Source/demo assets have to be moved to this product's R2-managed release namespace before the old SDK-hosted paths can be retired. Do **not** remove original sources until every migrated route, asset, and public reference returns success. Current demoUrl fields are temporary compatibility URLs, transparently declared as such.

## Explicit ownership

| Resource | Owner |
|---|---|
| Theme product listing, versions, screenshot metadata, ZIP manifest, download | Theme Store repository/Worker |
| Immutable ZIP blobs and demo assets | Private Cloudflare R2 bucket |
| Site/project identity and permissions | AgentSam workspace, never Theme Store |
| Editable site content/sections and theme settings | Standalone CMS v2 |
| Local developer tools and installer compatibility | AgentSam SDK / Local Studio |
| Installed draft selection/activation | Site-scoped CMS authority, never `cms_themes` alone |

## Important correction: theme ≠ installation ≠ working draft

- `cms_themes`: canonical definition, tokens and reusable design system of a theme. It is **not** a person's downloaded draft list.
- `cms_theme_preferences`: already exists in CMS v2; site-scoped settings and token overrides of an assigned theme.
- `cms_page_drafts`: if created, handles one editor's **page** changes, not complete theme installation, asset references, navigation, or multi-page transactional drafts. Its UNIQUE(page_id,user_id) conflicts with multiple saved drafts per user and requires versioned revisions.
- **Recommended new table in CMS v2**, not the Theme Store DB: `cms_theme_installations` (site_id, product_sku, installed_version, installation_state, package_hash, created_by, installed_at, activated_at, unique installation ID) and `cms_theme_drafts` (installation_id, site_id, base_revision_id, draft_name, current_state, metadata_json, created_by, created_at, updated_at). Keep working JSON overrides or changesets in editor-specific draft/revision rows, with relations to content/sections/nav in canonical CMS tables.
- Use `cms_revisions` for immutable audit snapshots, `cms_publications` for controlled publishing, and transaction-safe installation. Don't encode draft identity in `cms_themes.status`.

Before adding tables, audit `inneranimalmedia-cms` current constraints, existing installation persistence and FK references. Write a forward-only SQLite + D1 migration with idempotent installation and scoped authorization; avoid changing published content on preview/add. The store should call an authenticated *receiving* AgentSam endpoint rather than accepting site IDs or client-provided account permissions as authority.

## Exact install journey

1. Shopper chooses a published product release and optionally an authorized site (after sign-in).
2. Site backend verifies user membership, entitlements, ZIP SHA-256, manifest schema, product capability compatibility and asset references.
3. Atomically creates the site's installed-theme record and a named *private draft* plus seeded CMS v2 pages/sections/nav/assets. If no site exists, offer to create it in the existing project/site workflow.
4. Operator receives a real draft ID and **Edit draft** deep link to the existing packaged TSX CMS. No separate demo editor.
5. Activation/publish is a distinct authorized action with preview and rollback.

Idempotency key: site ID + SKU + artifact SHA-256 + caller request ID. Never mutate the source package in R2, and never claim successful installation before receiving a server-verified draft ID.

## Release artifacts and Cloudflare

Publish **immutable** `releases/<slug>/<version>/<sha256>.zip` to R2. The public catalog entry must match a reviewed SHA and exactly one immutable key. Suggested ZIP root: `theme-package.json` containing `schema: 'iam.theme-package.v1'`, `sku`, `version`, `minCmsSchema`, `capabilities`, `definitions`, `assets`, `siteSeed`; optional `cms-v2-seed.sql`, `site/`, `LICENSE`, `README.md`. Installer checks content paths and rejects path traversal. ZIPs must never contain deployment secrets or user content.

GET /api/catalog = public discovery.
GET /api/themes/:slug = metadata.
GET /api/themes/:slug/:version/manifest.json = release digest info only when published.
GET /api/themes/:slug/:version/download = *only* for explicitly free, published, checksum-verified releases. Paid/private requires entitlement-checked token issuance and rate limiting before enabling checkout.

A stable CLI can run `iam-theme catalog`, `iam-theme inspect resolve` and `iam-theme download resolve --out ./resolve.zip`; `install` must remain explicitly gated until AgentSam's receiving API is ready. CLI verifies content hash before retaining artifact.

## Rollout gates

- [ ] Existing eight-theme visual sources audited and unbroken, originals copied to R2, URLs switched after verification.
- [ ] Original Plain Jane archive provenance validated; review_before_distribution lifted only following v2 import smoke test.
- [ ] Version-compatible complete theme ZIPs signed/checksummed and R2-backed.
- [ ] CMS v2 installation migration reviewed, tested on new SQLite and Cloudflare D1 with FK enabled, plus upgrade fixtures.
- [ ] Authenticated site-specific add-to-drafts flow produces a real editable private draft and does not alter published pages.
- [ ] Preview and public cards work without AgentSam SDK asset hosts.
- [ ] Rollback, permissions, pricing/entitlements, and safe ZIP extraction verified.
- [ ] Only then remove the duplicate SDK theme showroom assets (not required runtime rendering libraries).


## Independent demo hosting (Theme Store Worker)

Preview artifact key: `demos/<slug>/<version>/<relative-file>` within `THEME_PACKAGES` R2. The Worker now serves `GET/HEAD /demos/:slug/:version/*` with HTML route fallback, explicit MIME types and immutable caching for hashed assets. Only known SKU/version pairs can be requested. Uploaded demos must be reviewed; never publish secrets or site/customer data. Build with base path `/demos/<slug>/<version>/`, upload actual built files, test nested routes and interactive navigation at desktop/tablet/mobile sizes, then update the catalog demo URL.

The original blog running at the domain root is a separate deployment. **Do not replace the root deployment** until Plain Jane's actual compiled site is verified at its permanent demo path. The product card uses original Plain Jane SVG artwork but does not pretend that the R2 demo is already live.

The Theme Store itself remains completely operable using its own Worker, static product catalog and R2 bindings. CMS v2 is a compatibility specification for an installable artifact, *not* a runtime service dependency for browsing, previews or downloads.
