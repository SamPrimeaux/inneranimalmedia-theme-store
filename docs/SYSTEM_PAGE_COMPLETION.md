# Theme Store system-page completion

The Theme Store is the authority for installable, source-verified theme packages and their
`install-project.json` documents. The CMS owns each installed site's editable copy,
revision history and publication status. Do not create another page or theme registry.

## Completion policy

1. Preserve every authored page, source section, media reference, preview URL, and
   source-release fingerprint exactly. Do not dilute source page HTML/3D/motion.
2. The deterministic `completeInstallProject()` step adds only missing system-page
   *drafts* to the immutable R2 install document immediately before publication.
3. Baselines inherit the source page's head/styles and any authored HEADER/FOOTER
   sections. They are editable in the existing theme-project editor and clearly
   marked `sourceOrigin: "platform-system-baseline"`.
4. Never mistake a rendered visual baseline for an application integration.
   `requiresRuntimeAdapter` identifies missing commerce, account, search or
   access-control behavior. 404 has a working home link; password-page layout
   alone **does not** secure a site.
5. The completion function is idempotent. Existing `404` and `not-found`
   authored routes win and are never overwritten.
6. CSS is scoped to the generated baseline; authored styles, branding and
   interactive sections must not be replaced by a generic visual proof.
7. Keep releases content-addressed. The completion changes the install-project
   JSON hash and R2 object key, **not** the source release ZIP hash.

## Delivery gate

- Test all 11 published packages and the matched SDK `validateThemeProjectPayload`
  acceptance path.
- The CMS backend must accept canonical slug `404` before publishing completed
  install documents or retrying legacy editor startup migrations.
- `npm test`, `npm run check`, `npm run build`.
- After the SDK fix is deployed, run `npm run publish:install-projects` from
  this repository with authorized Cloudflare credentials. That action writes
  immutable project objects and updates the live install index.
- Re-open an *existing* installed draft like Cypress and confirm the editor
  repairs its missing pages, persists a new D1/R2 revision, and reloads.
- Reinstall each listed theme into a fresh authorized site; check original
  pages and media, system 404/password, section editing, publish and rollback.

This migration does not edit existing site revisions, deploy Workers, wire
checkout/password handlers, or create new template-definition registries.
