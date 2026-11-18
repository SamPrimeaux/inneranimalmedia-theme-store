# Theme Store release authority

**Current architecture (2026-11-18):** `inneranimalmedia-theme-store` is the sole authority for website-theme availability and distribution.

## Canonical ownership

- `GET /api/catalog` publishes the Theme Store's product metadata and published status.
- `GET /api/install-index` publishes the immutable, installer-ready release list.
- `theme-store` R2 owns release ZIPs, editable install-project JSON, versioned preview files and their checksums.
- The Theme Store Worker validates and serves the public catalog, release index, preview aliases and project artifacts.
- AgentSam SDK is a generic authenticated consumer. It reads the provider's catalog/index, verifies the selected release and project, then creates an account-owned CMS draft.

## Explicit non-dependency

Theme publication does **not** create, update or require rows in AgentSam's `agentsam_products` or `agentsam_product_releases` tables. Those are not the Theme Store catalog, install index, or release authority. A theme is installable when the Theme Store's own published catalog and checksum-verified install index agree.

Existing historical rows in the platform product registry are not authoritative and are not read by the website-theme installer. Do not add a product row or SDK-side slug allowlist to release a new theme.

## Release sequence

1. Build the theme's immutable ZIP and compute its SHA-256.
2. Export the editable CMS project against the shared SDK project contract and bind it to the ZIP digest.
3. Publish the ZIP and editable project to Theme Store R2, then read them back and verify their digests.
4. Publish the versioned preview files and preview manifest to Theme Store R2.
5. Publish the combined `/api/install-index` and deploy the Theme Store Worker/catalog.
6. Verify the public catalog, install index, ZIP and editable project endpoints.

The Theme Store publisher is responsible for these steps. It does not need AgentSam product-D1 write permissions. The SDK must not be modified when a theme is added.

## Verification

```sh
npm run check
npm run build
npm test
node scripts/verify-published-installations.mjs --min 12
```
