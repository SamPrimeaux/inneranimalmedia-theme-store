/**
 * Declarative CMS / Admin CRUD schema for the IAPJ header & overlay logo set.
 * Enables installers (e.g. user123) to create, read, update, or remove the
 * brand icon, wordmark, or horizontal full-logo lockup without touching TSX.
 */
export const brandLogoSchema = {
  section: "header_brand_logo",
  name: "Header Brand & Logo Set",
  settings: [
    {
      type: "select",
      id: "brand.logo.mode",
      label: "Logo Display Mode",
      default: "lockup",
      options: [
        { value: "lockup", label: "Icon + Wordmark Lockup" },
        { value: "icon-only", label: "Icon Mark Only" },
        { value: "wordmark-only", label: "Wordmark Text Only" },
        { value: "full-logo", label: "Uploaded Full Logo Image" },
      ],
    },
    {
      type: "text",
      id: "brand.logo.wordmark",
      label: "Wordmark Text",
      default: "inneranimal",
    },
    {
      type: "select",
      id: "brand.logo.wordmarkCase",
      label: "Wordmark Casing",
      default: "lowercase",
      options: [
        { value: "lowercase", label: "Lowercase" },
        { value: "none", label: "As Typed" },
        { value: "uppercase", label: "Uppercase" },
      ],
    },
    {
      type: "checkbox",
      id: "brand.logo.showIcon",
      label: "Show Icon Mark",
      default: true,
    },
    {
      type: "checkbox",
      id: "brand.logo.showWordmark",
      label: "Show Wordmark Text",
      default: true,
    },
    {
      type: "media_asset",
      id: "brand.logo.icon.mediaRef",
      label: "Icon Upload (Light / Default Surface)",
      logicalKey: "media://brand-icon",
      accept: ["image/svg+xml", "image/png", "image/webp"],
    },
    {
      type: "media_asset",
      id: "brand.logo.icon.darkMediaRef",
      label: "Icon Upload (Dark Surface / Menu Overlay)",
      logicalKey: "media://brand-icon-dark",
      accept: ["image/svg+xml", "image/png", "image/webp"],
    },
    {
      type: "text",
      id: "brand.logo.icon.svgPath",
      label: "Fallback Vector Icon SVG Path",
      default: "M12 2a10 10 0 1 0 0 20V2z",
    },
    {
      type: "number",
      id: "brand.logo.icon.sizePx",
      label: "Icon Size (px)",
      default: 20,
    },
    {
      type: "media_asset",
      id: "brand.logo.fullLogo.mediaRef",
      label: "Full Horizontal Logo Upload (Light Surface)",
      logicalKey: "media://brand-logo-light",
      accept: ["image/svg+xml", "image/png", "image/webp"],
    },
    {
      type: "media_asset",
      id: "brand.logo.fullLogo.darkMediaRef",
      label: "Full Horizontal Logo Upload (Dark Surface)",
      logicalKey: "media://brand-logo-dark",
      accept: ["image/svg+xml", "image/png", "image/webp"],
    },
    {
      type: "number",
      id: "brand.logo.fullLogo.heightPx",
      label: "Full Logo Height (px)",
      default: 24,
    },
  ],
} as const;
