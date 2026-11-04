# Universal global footer — Theme Store

The Theme Store Worker renders a reusable **CMS global-footer section**, not a bespoke Local Studio component. Only this repository deploys the renderer. Themes, future apps and customer storefronts may consume the section contract without copying the Theme Store's site-specific content.

## Live and editable sources

- **Live:** https://themes.inneranimalmedia.com/ (footer on all Theme Store views)
- **Read-only published endpoint:** https://themes.inneranimalmedia.com/api/footer
- **Editable CMS source:** D1 `inneranimalmedia-business`, page `/_site-shell`, section `cmss_cmsp_theme_store_site_shell_footer`.
- **Section schema:** `cms_definitions.id = cmsd_store_global_footer`.
- **Editable blocks:** `cms_section_blocks`, filter by `section_id = cmss_cmsp_theme_store_site_shell_footer`. The block `definition_id` resolves to nine editor schemas in `cms_definitions`.
- **Published snapshot:** `theme-store/site/theme-store-footer.json` in the Theme Store R2 bucket. Only the published, validated projection is publicly served; draft changes do **not** silently appear on the live site.

## Editor tree

```text
Footer (global-footer section)
├── CTA (heading, body, primary and secondary links, enabled)
├── Contact (optional logo URL, brand, heading, copy, email, phone)
├── Company (group)
│   ├── About (link)
│   ├── Our work (link)
│   └── Contact (link)
├── Products & Apps (group)
│   ├── AgentSam (real icon + URL)
│   ├── CAD Creator (URL)
│   └── Theme Store (URL)
├── Resources (group)
│   ├── Architecture Field Manual (URL)
│   └── Browse themes (URL)
├── Follow (social group)
│   ├── Facebook (link empty until connected)
│   ├── Instagram (link empty until connected)
│   └── YouTube (link empty until connected)
└── Utilities
    ├── Copyright ({year} placeholder)
    ├── Privacy / Terms / Sitemap (links)
    └── Developed by (company signature image + URL)
```

The section settings control background, foreground, secondary text, rule, width, and the editable GLB URL, tint, opacity, rotation and enabled state. The default background is black and text is white. Navigation labels and URLs are stored in individual CMS link blocks, **not** embedded in React, CSS or an individual theme package. Link block parent IDs and sort order support the editable group structure.

The live GLB is `https://assets.inneranimalmedia.com/glb/inneranimalmediafooterglb.glb`. It is a progressive, lazy-loaded visual enhancement. The footer still works when WebGL is unavailable or motion reduction is requested. The signature image and AgentSam icon are preconfigured in CMS block settings.

## Author, publish, validate

From **this repository only**:

```bash
npm run footer:seed             # no-write inspection
npm run footer:seed -- --apply  # initial idempotent CMS setup; preserves existing block edits
npm run publish:footer         # publish CMS section/blocks to R2, with readback verification
npm run publish:site           # publish site content and footer together
npm run build && npm test      # typecheck, bundle, and all Theme Store tests
npm run deploy                 # deploy Theme Store Worker and assets
```

A normal footer text/link/group update changes the existing CMS D1 rows; `publish:footer` updates R2 without a Worker redeploy. Changing the renderer or schemas requires a Theme Store deployment.

Public delivery through R2 protects the CMS database from unauthenticated visitors. Publishing checks the section is visible, a usable set of blocks exists, and every block passes validation. Unconnected social icons are visible but not clickable. Theme-specific sites can seed their own CMS section/blocks using the same contract, while retaining their own content and branding.

**Not implemented here:** changes to AgentSam Studio, the SDK, Local Studio, or a new CMS editing application. This is the Theme Store's working renderer, saved CMS data contract, publish path, and initial site content.
