// Reusable IAPJ Theme Package Entry Point
export { BrandLogo } from "../components/BrandLogo";
export { Header } from "../components/Header";
export { Footer } from "../components/Footer";
export { FooterBackdrop3D } from "../components/FooterBackdrop3D";
export { MenuOverlay } from "../components/MenuOverlay";
export { SearchOverlay } from "../components/SearchOverlay";
export { BlogSubNav } from "../components/BlogSubNav";
export { ArticleCard } from "../components/ArticleCard";
export { AuthorInfo } from "../components/AuthorInfo";
export { FadeImage } from "../components/FadeImage";
export { Gallery } from "../components/Gallery";
export { ImageEmbed } from "../components/ImageEmbed";
export { Lightbox } from "../components/Lightbox";
export { QuoteEmbed } from "../components/QuoteEmbed";

export { BlogIndex } from "../pages/BlogIndex";
export { BlogCategory } from "../pages/BlogCategory";
export { Post } from "../pages/Post";
export { Photography } from "../pages/Photography";
export { About } from "../pages/About";
export { Search } from "../pages/Search";

export { brandLogoSchema } from "./brandSchema";
export {
  resolveMedia,
  resolveLink,
  getSiteManifest,
  resolveBrandLogo,
  updateRuntimeBrandLogo,
  resetRuntimeBrandLogo,
} from "../lib/mediaResolver";
export type {
  BrandLogoConfig,
  BrandLogoMode,
  BrandWordmarkCase,
  BrandLogoIconConfig,
  BrandFullLogoConfig,
  ResolvedBrandLogo,
  SiteManifest,
  MediaCatalogEntry,
  ResolvedMedia,
} from "../lib/mediaResolver";
export type {
  Article,
  ArticleSection,
  Author,
  CategorySlug,
} from "../data/articles";
