# InnerAnimalMedia Theme Store

The source-controlled storefront and distribution service for **themes.inneranimalmedia.com**.

Browse original InnerAnimalMedia theme products, inspect full responsive live previews, then add a private theme draft to your AgentSam workspace. Downloadable releases are immutable, versioned ZIP packages stored in private Cloudflare R2. Theme Store owns **product discovery, catalog, release manifests and downloads** — **not** sites, projects, CMS editor state, tenant identity, checkout, or publishing.

## First launch

```bash
npm install
npm run dev       # localhost:5173
npm run check
npm run build
npx wrangler dev  # local Worker / catalog API
```

Cloudflare prerequisites: create a private R2 bucket named `theme-store` (or change the binding in `wrangler.jsonc`), assign the already-configured `themes.inneranimalmedia.com` custom domain to this Worker, and deploy with `npm run deploy`. GitHub Actions validates typechecking and builds before shipping. Do not enable a downloadable release until its ZIP has been uploaded to R2 and its SHA-256 recorded in the catalog.

## Customer journey

1. **Browse** by category, intended use, or searchable keywords.
2. **Preview** a theme in desktop/mobile framing, and inspect its included pages.
3. **Add to AgentSam** navigates to the canonical `/sites` flow with the selected theme SKU/version. The receiving AgentSam workspace must confirm authorization and create the **private draft**; this storefront never fabricates installation success.
4. **Edit** in the installed ecommerce CMS v2 editor, then **publish** through the normal authorization gates.
5. **Download** only when a release is explicitly marked published and its immutable R2 key and digest have been configured. Free/open products can be downloaded; paid/private releases must use a future entitlement-checked issuance flow.

## Ownership and integration

- **This repo:** `src/catalog.ts` metadata and release contracts; `src/main.tsx` theme storefront; `src/worker.ts` catalog/download API; `bin/iam-theme.mjs` CLI.
- **AgentSam SDK / Local Studio:** authenticates user, lists authorized sites, handles add-to-draft and installation through site-scoped CMS v2 APIs; no duplicate `themeProjectStore`.
- **CMS v2 compatibility contract:** ZIP install manifests target the current CMS v2 schema. The Theme Store does not call a separate CMS repository or load another site's database to render its catalog or live previews; AgentSam's receiving installer is responsible for matching the declared schema.
- **R2:** stores immutable artifacts and previews, not Git source code or editable site data.

See [the distribution and installation contract](docs/DISTRIBUTION.md) before enabling downloads or connecting the production add-to-draft handler.

**Current catalog:** Resolve, Violet, and Plain Jane Journal are catalog examples in preview state. Package downloads and direct one-click installation are intentionally gated until real v2-compatible release artifacts and AgentSam's receiving flow pass verification.


## Versioned theme-packages and live previews

Each theme-package is a product with independently maintained source and immutable versioned release artifacts. The storefront operates from this repository; customer CMS data is never stored here.

A production preview is a **real compiled, navigable website**. The Worker resolves files in private R2 at `theme-packages/<slug>/<version>/preview/<relative-file>` and serves them at `/theme-packages/<slug>/<version>/preview/`. Products are browsable even before installable ZIPs are approved; only tested releases can be downloaded or installed.

Plain Jane's original source stays in `inneranimalmedia-blog-template`, not a second storefront. Its existing root deployment should be replaced only after the publication workflow uploads and checks the versioned live preview. The other eight themes retain legacy AgentSam preview URLs until their actual compiled assets move to this R2 namespace.

### Production launch / Cloudflare handoff

The Cloudflare Worker is named `inneranimalmedia-theme-store` and the authoritative private R2 bucket is `theme-store`. The GitHub workflow `Publish Theme Store` builds the source-backed Plain Jane preview, uploads every file to `theme-store/theme-packages/plain-jane/0.1.0/preview/`, then deploys the Worker and storefront. **Previews are functional compiled websites, not replacement scaffold screens.**

Required GitHub Actions secrets: `CLOUDFLARE_API_TOKEN` (Worker deploy + R2 Object write) and `CLOUDFLARE_ACCOUNT_ID` (the owning account). Run the workflow manually and check preview routes before announcing a published installation. The bucket's public access and r2.dev URL should remain disabled because the Worker serves vetted files. Source remains in its own repository; do not move the blog components or CMS into this repo.

The preview URL is not the downloadable theme-package. Production-ready installable ZIPs require their own approved manifest, version, hash and CMS v2 import tests, followed by separate release promotion.
