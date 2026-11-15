# InnerAnimal Plain Jane — IAPJ theme candidate

The authored visual system, article library, editorial screens and source media are taken from
[SamPrimeaux/iapj](https://github.com/SamPrimeaux/iapj), pinned to the commit in `provenance.json`.

This is a **whole-source replacement** of the deprecated beige Plain Jane Journal starter.
The public Theme Store identity remains `plain-jane`, the package name remains
`@inneranimalmedia/theme-plain-jane`, and this preview's proposed version is `0.2.0`.

## Separation of responsibilities
- `source/`: imported IAPJ React/Vite application (not legacy Plain Jane)
- `site/`: derived static preview with original imagery, compiled JS/CSS and an exported preview CMS manifest
- `src/node.js`: reproducible nested-base materializer and deep-link page stubs
- `scripts/export-cms-manifest.mjs`: IAPJ source routes, logical media references and CMS definition keys
- `agentsam.package.json`, `prebuild.json`, `package.json`: the existing Theme Store product interface

## Local preflight (no remote or cloud access)
From the Theme Store root:
```sh
npm ci
npm ci --prefix packages/theme-plain-jane/source
npm run build --prefix packages/theme-plain-jane
node --test packages/theme-plain-jane/test/*.test.mjs
npm run check
npm test
node scripts/build-theme-release.mjs plain-jane
```

The site is **preview-only**. The exported CMS manifest identifies the authored pages but does
not implement authenticated CMS editing, tenant-scoped save, revisions or install receipts.
The previous `install-project.json` is intentionally removed; reusing the old beige renderer
would misrepresent the replacement. No fixture SQL is imported.

## Release gates
- Visual comparisons and real browser QA at desktop and mobile breakpoints
- All static and nested routes, 404, light/dark, image and navigation QA
- Native CMS section/block mapping from IAPJ source (not static placeholders)
- Content authoring, saved drafts, tenant ownership and publish/rollback tests
- Rebuilt `install-project.json` with verified editable source-rendered sections
- Reproducible ZIP hash, provenance, package version and catalog verification
- Explicit release approval for R2, downloadable artifact and public preview

**No cloud publish, CMS install or Theme Store promotion is approved by staging this branch.**
