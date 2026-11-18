# InnerAnimal Plain Jane (IAPJ) — v0.3.0

Canonical package: @inneranimalmedia/theme-iapj
Theme Store slug: iapj
Public preview: https://themes.inneranimalmedia.com/iapj/

IAPJ is a distinct, full editorial publishing package. It does not replace or reuse the identity of Plain Jane Classic.

## Product contract

- Free stock theme: sign-in/sign-up is required before creating or changing a private draft.
- No site required: a verified account may install IAPJ directly into Theme Studio. Its project, pages, sections, tokens, revisions and media references are independently owned.
- Full draft CRUD: create, read, update, delete and duplicate independent account-owned canvases. The shared master and other accounts are never mutated.
- Real source: source/ is the maintained IAPJ React/Vite code. site/ is its distributable preview and original authored media. install-project.json is the native agentsam.theme-project.v1 editable project generated from the actual rendered React pages using the existing SDK editor contract.
- Runtime: 31 authored editorial pages, 132 editable source sections, thousands of text/media/link fields, original asset references and optional platform system pages provided by the shared CMS.
- Separate identity: iapj, @inneranimalmedia/theme-iapj, and theme_iapj are reserved for this package. Plain Jane Classic retains plain-jane, @inneranimalmedia/theme-plain-jane, and theme_plain-jane.

## Local authoring and acceptance

    npm ci
    npm ci --prefix packages/theme-iapj/source
    npm run build --prefix packages/theme-iapj
    python3 packages/theme-iapj/scripts/export-install-project.py       --contract ../agentsam-sdk/apps/ecommerce-cms-agentsam/frontend/theme-editor/project.mjs
    node scripts/build-theme-release.mjs iapj
    node packages/theme-iapj/scripts/finalize-install-project.mjs
    node --test packages/theme-iapj/test/*.test.mjs
    npm run check && npm test

The compiled preview and editable CMS project are separate immutable release artifacts. The CMS editor handles private draft save/revision, media and code editing; Auth/Identity and D1/R2 ownership remain platform contracts.

## Release contract

A published release must have both a checksum-addressed ZIP and a checksum-verified editable install project registered in the Theme Store install index. The public preview alias is not the package identity. AgentSam remains responsible for user authentication, site ownership, draft creation and CMS writes.
