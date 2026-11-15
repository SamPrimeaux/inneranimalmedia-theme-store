# Theme Store → AgentSam release registry

**Authority:** This repository publishes verified theme ZIPs and editable projects to
`theme-store` R2. Its public `/api/catalog` and `/api/install-index` describe
releases; `agentsam_products` and `agentsam_product_releases` are the existing
platform discovery/entitlement inventory, **not a second Theme Store**.

## Connected pipeline

`npm run publish:install-projects -- --only=plain-jane` uploads the immutable
source-backed editable project, verifies its hash after reading back from R2,
updates the install index, **then runs registry sync** for that SKU. The
registry sync verifies the current public catalog, install-project bytes, release
manifest and ZIP SHA-256 before changing the production D1 product/release
spine. The publisher fails if it cannot verify or persist the registry entry;
R2 objects remain immutable, so rerunning safely resumes.

Use the publisher with Cloudflare credentials that permit **R2 reads/writes and
D1 writes**. The live Worker must already serve the new release through both
catalog and install-project routes. If the Worker deployment lags the R2 index,
complete the deployment and rerun the sync. This intentionally fails closed
rather than promoting a release that customers cannot yet install.

## Reconcile an already-live release

```sh
node scripts/register-product-releases.mjs --dry-run --only=plain-jane
node scripts/register-product-releases.mjs --publish --only=plain-jane
```

Omit `--only` to reconcile all current published catalog products. Some paid/
entitled theme ZIPs deliberately return HTTP 403 to public visitors. In an
authorized publisher run, the registrar uses Wrangler to verify these ZIPs
**directly from R2** instead; it never bypasses storefront entitlements.

Reconciliation retains historical release rows and refuses to alter the
checksum or object key of an existing version. The production writer reads back
and confirms the exact release before reporting success. Source metadata comes
from the live published assets, **not** the obsolete
`.releases/staged-releases.json` file. No account-specific theme or customer
data is embedded in the source registry.

## Checks

```sh
npm test
npm run check
node --test tests/product-release-registry.test.mjs
```
