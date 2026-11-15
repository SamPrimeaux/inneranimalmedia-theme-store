# InnerAnimal Plain Jane (IAPJ) · v0.3.0

**Canonical distribution and source:** `SamPrimeaux/inneranimalmedia-theme-store/packages/theme-plain-jane`.

`SamPrimeaux/iapj` was the original source seed, **not** a second production distribution authority. The product keeps the public `plain-jane` slug, while its short demo URL is `/iapj/`.

## Product contract

- **Free stock theme:** usable without a purchase; **sign-in/sign-up is required** before creating or changing a private draft.
- **No site required:** a verified account may install IAPJ directly into Theme Studio. It owns an independent project, pages, sections, tokens, revisions and media references. Its draft can become a site only after an explicit action.
- **Full draft CRUD:** create/read/update/delete and duplicate as many independent account-owned canvases as desired. The shared master and other accounts are never mutated.
- **Real source:** `source/` is the maintained IAPJ React/Vite code. `site/` is its distributable preview and original authored media. `install-project.json` is the native `agentsam.theme-project.v1` editable project generated from the actual rendered React pages using the existing SDK editor contract (no second CMS).
- **Runtime:** 31 authored editorial pages, 132 editable source sections, thousands of text/media/link fields, original asset references and the optional platform system pages provided by the shared CMS.
- **Distribution:** immutable ZIPs and verified install-project objects reside in the `theme-store` R2 bucket. The platform's `agentsam-sdk` Worker reads the registry and verifies signed content; it does not bundle IAPJ.

## Local authoring and acceptance

```sh
npm ci
npm ci --prefix packages/theme-plain-jane/source
npm run build --prefix packages/theme-plain-jane
python3 -m pip install playwright
python3 -m playwright install chromium
python3 packages/theme-plain-jane/scripts/export-install-project.py \
  --contract ../agentsam-sdk/apps/ecommerce-cms-agentsam/frontend/theme-editor/project.mjs
node scripts/build-theme-release.mjs plain-jane
node packages/theme-plain-jane/scripts/finalize-install-project.mjs
node --test packages/theme-plain-jane/test/*.test.mjs
npm run check && npm test
```

The exported project and the immutable ZIP are separate products of the same authored source. The CMS editor handles private draft save/revision, media and code editing; Auth/Identity and D1/R2 ownership are platform contracts. Do not copy CMS editor code or customer records into this theme package.

## Release contract

A published release must have **both** a checksum-addressed source-owned ZIP and a checksum-verified editable install-project registered in the Theme Store's `install-index` R2 object. Catalog install readiness is derived from those exact artifacts, not a hidden boolean. Never label the product installed or publish-ready before the real installer is available. No site, domain, store, or checkout is a prerequisite for a private account-owned Theme Studio copy.

Local source status is distinct from production: public `/iapj/` may still show the earlier release until R2 publication and worker rollout are separately verified.
