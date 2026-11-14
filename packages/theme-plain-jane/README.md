# Plain Jane Journal — SDK product staging

Original source snapshot: https://github.com/SamPrimeaux/inneranimalmedia-blog-template
at the pinned commit in provenance.json. Theme Store editorial additions are maintained here. The authored React/TypeScript site
lives under source/, generated storefront under site/, and SDK package contract
under src/ and prebuild.json. Never hand-edit the bundled output.

## Local verification

The SDK demo server serves the actual build at /themes/plain-jane/demo/ and the
CMS manifest at /themes/plain-jane/demo/journal-cms-manifest.json.

The source has fourteen preview pages (nine original, five added article routes) and 18 component definitions. Real routes:
home, about, photography, two journal posts, contact, privacy, terms, 404.
All artwork in the authored repository is local, including two Growth & Performance chart scenes; the original Google Fonts
import still requires network access and has fallback fonts.

For local dev:
1. Run npm ci and npm run lint from source/.
2. Run the package build script from the theme-plain-jane root.
3. Run node --test packages/theme-plain-jane/test/*.test.mjs from SDK root.
4. Optional: node packages/theme-plain-jane/scripts/export-preview-zip.mjs
5. Open /admin/store and Browse Templates, then Plain Jane Journal.

The UI is read-only. The external CMS needs to own all writes, revisions,
transactions and permissions. The exported manifest retains original section
and block IDs, definition keys, version and template SKU.

## First-party compiled Theme Store release

The publisher has approved distribution of the **compiled** Plain Jane site and
its CMS component manifest through Theme Store. Its package source and npm
package stay private (UNLICENSED). Public distribution does not grant source
resale, open-source relicensing, or derivative sublicensing.

To build a reviewed release: run \`node scripts/build-theme-release.mjs plain-jane\`
at the Theme Store repository root. Publishing uses \`--publish\`, uploads the
zip to its SHA-256-addressed R2 key, verifies it by downloading it, and records
the hash on the package manifest. The public \`/api/themes/plain-jane/0.1.0/manifest.json\`
and \`/download\` endpoints serve that immutable release.

The compiled site materializes independently with deep routes and the
\`journal-cms-manifest.json\` used for future site-scoped authoring. This is a
**real downloadable package**, not yet a verified AgentSam CMS draft install.
Release 0.1.0 remains immutable. The enhanced 0.1.1 artifact must be generated, uploaded and digest-verified before its download link is promoted. The Theme Store must never imply that the customer editor save/publish flow is
complete until the authenticated install receipt and isolation tests pass.

Do NOT run seed/plain-jane-journal.sql against customer D1 databases without
a matching schema, ownership checks, validated parameters, backup and
transaction tests. Audit the existing CMS database before adding tables.

See docs/architecture/AGENTSAM-PRODUCT-CATALOG-RELEASES-20261028.md.
