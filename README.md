# InnerAnimalMedia Theme Store

The source-controlled storefront and distribution service for **themes.inneranimalmedia.com**.

Browse original InnerAnimalMedia theme products, inspect full responsive demos, then add a private theme draft to your AgentSam workspace. Downloadable releases are immutable, versioned ZIP packages stored in private Cloudflare R2. Theme Store owns **product discovery, catalog, release manifests and downloads** — **not** sites, projects, CMS editor state, tenant identity, checkout, or publishing.

## First launch

```bash
npm install
npm run dev       # localhost:5173
npm run check
npm run build
npx wrangler dev  # local Worker / catalog API
```

Cloudflare prerequisites: create a private R2 bucket named `iam-theme-packages` (or change the binding in `wrangler.jsonc`), assign the already-configured `themes.inneranimalmedia.com` custom domain to this Worker, and deploy with `npm run deploy`. GitHub Actions validates typechecking and builds before shipping. Do not enable a downloadable release until its ZIP has been uploaded to R2 and its SHA-256 recorded in the catalog.

## Customer journey

1. **Browse** by category, intended use, or searchable keywords.
2. **Preview** a theme in desktop/mobile framing, and inspect its included pages.
3. **Add to AgentSam** navigates to the canonical `/sites` flow with the selected theme SKU/version. The receiving AgentSam workspace must confirm authorization and create the **private draft**; this storefront never fabricates installation success.
4. **Edit** in the installed ecommerce CMS v2 editor, then **publish** through the normal authorization gates.
5. **Download** only when a release is explicitly marked published and its immutable R2 key and digest have been configured. Free/open products can be downloaded; paid/private releases must use a future entitlement-checked issuance flow.

## Ownership and integration

- **This repo:** `src/catalog.ts` metadata and release contracts; `src/main.tsx` theme storefront; `src/worker.ts` catalog/download API; `bin/iam-theme.mjs` CLI.
- **AgentSam SDK / Local Studio:** authenticates user, lists authorized sites, handles add-to-draft and installation through site-scoped CMS v2 APIs; no duplicate `themeProjectStore`.
- **`inneranimalmedia-cms`:** canonical CMS v2 schema and installation migrations; theme ZIP seed files target that schema.
- **R2:** stores immutable artifacts and previews, not Git source code or editable site data.

See [the distribution and installation contract](docs/DISTRIBUTION.md) before enabling downloads or connecting the production add-to-draft handler.

**Current catalog:** Resolve, Violet, and Plain Jane Journal are catalog examples in preview state. Package downloads and direct one-click installation are intentionally gated until real v2-compatible release artifacts and AgentSam's receiving flow pass verification.
