# SDK theme package source migration

Imported 372 **Git-tracked** files (4,823,341 bytes) from `SamPrimeaux/agentsam-sdk` commit `0891e75bbfb820ac437c7cf84d4b1d4a0f58566c` into `SamPrimeaux/inneranimalmedia-theme-store` on 2026-11-02.

## Scope and ownership

- **Storefront theme candidates (11):** cypress, ember, forge, grove, harbor, resolve, summit, violet, plain-jane, iasf, heuristic.
- **Transitional internal packages (2):** `fnf-theme` (Fuel N Free Time adapter) and `agentsam-docs-theme` (currently serving the live AgentSam public website; **not** a customer-installable docs theme). These are preserved for ownership cleanup and must **not** be listed as products until separated from their production consumers.
- **Remain in SDK:** `theme-scenes`, both `theme-contract` implementations, `copro-templates`, original `apps/theme-gallery-preview` and CMS runtime. These are cross-product contracts, creative templates or legacy compatibility surfaces, not independent theme releases.

Package paths intentionally retain their original `packages/...` layout for source provenance and future npm/workspace compatibility. This migration **copies** sources and does not remove SDK modules or modify production routing; retire old copies only after dependency rewiring and verified installs.

## Important limitations

- Source import is **not** equivalent to an approved theme release, live R2 preview or CMS installation.
- The original Theme Store catalog uses hard-coded products and AgentSam-hosted preview URLs for eight themes; migrate to compiled R2 previews and D1 release records before claiming independence.
- Do not publish the copied websites, downloadable ZIPs or customer-facing "Install" statuses without tests, manifests, license review and CMS v2 integration.
- Several package versions can disagree with their `prebuild.json` and `src/index.js` embedded version values (notably Violet); normalize versions before publishing.
- Installable themes must not require unversioned SDK URLs, dev services or customer-specific source data; validate all relative/absolute assets and supported API bindings.
- Theme Store's existing Plain Jane source-backed, pinned-commit preview publisher remains unchanged. It may be generalized later; do not introduce a second preview authority.
- Public source files can be developed here, but no theme is marked as installed or promoted simply because its source exists.

## Next work: one vertical slice

1. Define one canonical theme package contract (reconcile duplicate SDK `theme-contract` packages).
2. Build a generalized artifact/preview pipeline with version consistency and relative-path checks.
3. Prove Violet (or another source-complete candidate) preview and installation on a fresh authorized CMS v2 site.
4. Record products and releases in `agentsam_products` / `agentsam_product_releases`, with private immutable R2 files and checksum verification.
5. Add upgrade/rollback paths, migrate remaining previews and deprecate SDK-hosted files only after verification.
