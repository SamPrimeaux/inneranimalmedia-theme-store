# Revise — Editorial Commerce

Canonical preview distribution for the Revise editorial-commerce design, using the existing InnerAnimalMedia CMS Revise visual foundation.

## Included
- Five routes: Home, Products, Stories, Campaigns and Ideas
- Global navigation with responsive overlay, search palette, announcement bar and footer
- Twenty-seven section patterns in the original Revise framework
- Product-detail preview drawers, editorial galleries, campaign layouts and design-local controls
- Immutable R2 demonstration under /theme-packages/revise/0.1.0/preview/

## Source and ownership
Source: inneranimalmedia-cms-site/examples/revise-foundation. This Theme Store package owns the reviewed compiled theme and its publication artifacts. Do not copy customer-brand site data into the AgentSam SDK. Media still hosted at Fuel & Free Time is a demonstration reference, not merchant inventory shipped in this package. The bundled site is not an authenticated CMS installation.

src/node.js exports materializePrebuild() for the Theme Store distribution pipeline. agentsam.store in package.json opts this preview-only theme into discovery. An installable ZIP and CMS import receipts remain separate release gates.
