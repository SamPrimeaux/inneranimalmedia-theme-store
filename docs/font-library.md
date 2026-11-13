# Shared font library

The `theme-store` R2 bucket owns the shared, versioned font library at `fonts/`. Theme records store font family IDs and role choices; they do not copy font binaries into individual theme packages or D1 rows.

## Public delivery

- `GET /fonts/manifest.json` — catalog metadata, weights, styles, licenses, and immutable object keys.
- `GET /fonts/css?families=inter,jetbrains-mono` — generated `@font-face` rules for selected catalog families.
- `GET|HEAD /fonts/{family-id}/{subset}-{weight}-{style}.{sha256-prefix}.woff2` — immutable WOFF2 assets.
- `GET /fonts/{family-id}/LICENSE.txt` — source license text.

Font and CSS responses include public CORS headers for dashboard use from `agentsam.inneranimalmedia.com`. Binary files are cached for one year because the object key includes a content hash. The manifest and generated CSS use a short cache window so catalog changes become visible quickly.

## Publishing additional families

The publishing script is dry-run by default. It enriches existing manifest records with Fontsource axis metadata and downloads only newly requested families.

```sh
npm run fonts:publish -- --family=jetbrains-mono
npm run fonts:publish -- --family=jetbrains-mono --apply
```

The `--apply` run uploads WOFF2 files and the license first, then updates `fonts/manifest.json`. It reads each uploaded object back from R2 and verifies its SHA-256 before reporting success. Add additional `--family=<fontsource-id>` arguments to the same command when needed.

All published families must have a clear upstream license recorded in the manifest. Do not place font binaries in `cms_themes`; store only the selected family IDs and typography roles there.
