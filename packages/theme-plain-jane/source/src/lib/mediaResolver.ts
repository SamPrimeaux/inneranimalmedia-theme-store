import siteManifest from "../content/site.manifest.json";

export interface MediaCatalogEntry {
  provider?: string;
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface ResolvedMedia {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export type BrandLogoMode = "lockup" | "icon-only" | "wordmark-only" | "full-logo";

export type BrandWordmarkCase = "lowercase" | "uppercase" | "none";

export interface BrandLogoIconConfig {
  mediaRef?: string;
  darkMediaRef?: string;
  svgPath?: string;
  svgViewBox?: string;
  sizePx?: number;
}

export interface BrandFullLogoConfig {
  mediaRef?: string;
  darkMediaRef?: string;
  alt?: string;
  heightPx?: number;
}

export interface BrandLogoConfig {
  mode?: BrandLogoMode;
  href?: string;
  wordmark?: string;
  wordmarkCase?: BrandWordmarkCase;
  showIcon?: boolean;
  showWordmark?: boolean;
  icon?: BrandLogoIconConfig;
  fullLogo?: BrandFullLogoConfig;
}

export type SiteManifest = Omit<typeof siteManifest, "brand"> & {
  brand: Omit<typeof siteManifest.brand, "logo"> & {
    logo?: BrandLogoConfig;
  };
};

export interface ResolvedBrandLogo {
  mode: BrandLogoMode;
  href: string;
  wordmark: string;
  wordmarkCase: BrandWordmarkCase;
  showIcon: boolean;
  showWordmark: boolean;
  iconSrc: string;
  iconAlt: string;
  iconSvgPath: string;
  iconSvgViewBox: string;
  iconSizePx: number;
  fullLogoSrc: string;
  fullLogoAlt: string;
  fullLogoHeightPx: number;
}

export const MANIFEST_UPDATE_EVENT = "iapj:manifest-updated";

// Vite-bundled local studio assets so paths work identically in dev and production builds
const bundledAssets = import.meta.glob<string>("/src/assets/images/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
});

declare global {
  interface Window {
    __IA_MEDIA_MAP__?: Record<
      string,
      MediaCatalogEntry | { src: string; alt?: string; caption?: string; width?: number; height?: number }
    >;
    __IA_LINK_MAP__?: Record<string, string>;
    __IA_SITE_MANIFEST__?: Partial<{
      brand: Partial<SiteManifest["brand"]>;
      contact: Partial<SiteManifest["contact"]>;
      author: Partial<SiteManifest["author"]>;
      navigation: Partial<SiteManifest["navigation"]>;
    }>;
  }
}

/**
 * Resolves logical asset keys (e.g., "media://cover-structured-decisions" or "cms://media_9821")
 * without baking external URLs into article data or JSX components.
 */
export function resolveMedia(
  mediaRef: string,
  customCatalog?: Record<string, MediaCatalogEntry>
): ResolvedMedia {
  if (!mediaRef) return { src: "", alt: "" };

  // Support direct uploaded URLs / data URIs passed straight through CMS overrides
  if (
    mediaRef.startsWith("http://") ||
    mediaRef.startsWith("https://") ||
    mediaRef.startsWith("data:") ||
    mediaRef.startsWith("blob:") ||
    mediaRef.startsWith("/")
  ) {
    return {
      src: bundledAssets[mediaRef] ?? mediaRef,
      alt: "",
    };
  }

  if (typeof window !== "undefined" && window.__IA_MEDIA_MAP__?.[mediaRef]) {
    const runtimeEntry = window.__IA_MEDIA_MAP__[mediaRef];
    const rawSrc = "src" in runtimeEntry ? runtimeEntry.src : runtimeEntry.url;
    return {
      src: bundledAssets[rawSrc] ?? rawSrc,
      alt: runtimeEntry.alt ?? "",
      caption: runtimeEntry.caption,
      width: runtimeEntry.width,
      height: runtimeEntry.height,
    };
  }

  const catalog = customCatalog ?? (siteManifest.mediaCatalog as Record<string, MediaCatalogEntry>);
  const entry = catalog[mediaRef];

  if (entry) {
    return {
      src: entry.url ? bundledAssets[entry.url] ?? entry.url : "",
      alt: entry.alt ?? "",
      caption: entry.caption,
      width: entry.width,
      height: entry.height,
    };
  }

  return { src: "", alt: "" };
}

/**
 * Resolves logical navigation or external link refs (e.g., "social://github", "internal://about")
 * with optional CMS runtime override via window.__IA_LINK_MAP__.
 */
export function resolveLink(
  linkRef: string,
  customLinks?: Record<string, string>
): string {
  if (typeof window !== "undefined" && window.__IA_LINK_MAP__?.[linkRef]) {
    return window.__IA_LINK_MAP__[linkRef];
  }

  const links = customLinks ?? (siteManifest.linkCatalog as Record<string, string>);
  return links[linkRef] ?? "#";
}

export function getSiteManifest(): SiteManifest {
  const base = siteManifest as SiteManifest;
  if (typeof window === "undefined" || !window.__IA_SITE_MANIFEST__) {
    return base;
  }

  const override = window.__IA_SITE_MANIFEST__;
  const baseLogo: BrandLogoConfig = base.brand.logo ?? {};
  const overrideLogo: BrandLogoConfig = override.brand?.logo ?? {};

  return {
    ...base,
    ...override,
    brand: {
      ...base.brand,
      ...override.brand,
      logo: {
        ...baseLogo,
        ...overrideLogo,
        icon: {
          ...baseLogo.icon,
          ...overrideLogo.icon,
        },
        fullLogo: {
          ...baseLogo.fullLogo,
          ...overrideLogo.fullLogo,
        },
      },
      attribution: {
        ...base.brand.attribution,
        ...override.brand?.attribution,
      },
    },
    contact: {
      ...base.contact,
      ...override.contact,
    },
    author: {
      ...base.author,
      ...override.author,
    },
    navigation: {
      ...base.navigation,
      ...override.navigation,
    },
  } as SiteManifest;
}

function resolveThemeDarkSurface(): boolean {
  if (typeof document === "undefined") return false;
  const themeAttr = document.documentElement.getAttribute("data-theme");
  if (themeAttr === "dark") return true;
  if (themeAttr === "light") return false;
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
  );
}

/**
 * Resolves the unified brand logo set (icon + wordmark or uploaded full lockup)
 * from site.manifest.json, window.__IA_SITE_MANIFEST__, window.__IA_MEDIA_MAP__,
 * and optional component-level overrides.
 */
export function resolveBrandLogo(
  surface: "auto" | "light" | "dark" = "auto",
  override?: Partial<BrandLogoConfig>
): ResolvedBrandLogo {
  const manifest = getSiteManifest();
  const baseLogo: BrandLogoConfig = manifest.brand.logo ?? {};

  const mergedLogo: BrandLogoConfig = {
    ...baseLogo,
    ...override,
    icon: {
      ...baseLogo.icon,
      ...override?.icon,
    },
    fullLogo: {
      ...baseLogo.fullLogo,
      ...override?.fullLogo,
    },
  };

  const isDarkSurface = surface === "dark" || (surface === "auto" && resolveThemeDarkSurface());

  const mode: BrandLogoMode = mergedLogo.mode ?? "lockup";
  const wordmark = mergedLogo.wordmark ?? manifest.brand.title;
  const wordmarkCase: BrandWordmarkCase = mergedLogo.wordmarkCase ?? "lowercase";
  const showIcon = mode === "wordmark-only" ? false : mergedLogo.showIcon ?? true;
  const showWordmark = mode === "icon-only" ? false : mergedLogo.showWordmark ?? true;

  const iconRef =
    (isDarkSurface && mergedLogo.icon?.darkMediaRef) ||
    mergedLogo.icon?.mediaRef ||
    "";
  const resolvedIcon = resolveMedia(iconRef);
  // Fall back to light icon ref if dark variant is registered but empty
  const fallbackIcon =
    !resolvedIcon.src && isDarkSurface && mergedLogo.icon?.mediaRef
      ? resolveMedia(mergedLogo.icon.mediaRef)
      : resolvedIcon;

  const fullLogoRef =
    (isDarkSurface && mergedLogo.fullLogo?.darkMediaRef) ||
    mergedLogo.fullLogo?.mediaRef ||
    "";
  const resolvedFullLogo = resolveMedia(fullLogoRef);
  const fallbackFullLogo =
    !resolvedFullLogo.src && isDarkSurface && mergedLogo.fullLogo?.mediaRef
      ? resolveMedia(mergedLogo.fullLogo.mediaRef)
      : resolvedFullLogo;

  return {
    mode,
    href: mergedLogo.href ?? "/blog",
    wordmark,
    wordmarkCase,
    showIcon,
    showWordmark,
    iconSrc: fallbackIcon.src,
    iconAlt: fallbackIcon.alt || `${wordmark} icon`,
    iconSvgPath: mergedLogo.icon?.svgPath ?? "",
    iconSvgViewBox: mergedLogo.icon?.svgViewBox ?? "0 0 24 24",
    iconSizePx: mergedLogo.icon?.sizePx ?? 20,
    fullLogoSrc: fallbackFullLogo.src,
    fullLogoAlt: mergedLogo.fullLogo?.alt || fallbackFullLogo.alt || wordmark,
    fullLogoHeightPx: mergedLogo.fullLogo?.heightPx ?? 24,
  };
}

/**
 * Runtime CRUD helper for theme installers & CMS editors to create, update, or
 * clear icon/wordmark/full-logo fields without rebuilding the bundle.
 */
export function updateRuntimeBrandLogo(patch: Partial<BrandLogoConfig> | null): void {
  if (typeof window === "undefined") return;

  if (patch === null) {
    if (window.__IA_SITE_MANIFEST__?.brand) {
      delete window.__IA_SITE_MANIFEST__.brand.logo;
    }
  } else {
    const existingManifest = window.__IA_SITE_MANIFEST__ ?? {};
    const existingBrand = existingManifest.brand ?? {};
    const existingLogo: BrandLogoConfig = existingBrand.logo ?? {};

    window.__IA_SITE_MANIFEST__ = {
      ...existingManifest,
      brand: {
        ...existingBrand,
        logo: {
          ...existingLogo,
          ...patch,
          icon: {
            ...existingLogo.icon,
            ...patch.icon,
          },
          fullLogo: {
            ...existingLogo.fullLogo,
            ...patch.fullLogo,
          },
        },
      },
    };
  }

  window.dispatchEvent(new CustomEvent(MANIFEST_UPDATE_EVENT));
}

export function resetRuntimeBrandLogo(): void {
  updateRuntimeBrandLogo(null);
}
