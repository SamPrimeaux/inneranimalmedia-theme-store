import { motion, AnimatePresence } from "motion/react";
import { X, Github, Twitter, Linkedin, Globe, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSiteManifest, resolveLink, type BrandLogoConfig } from "../lib/mediaResolver";
import { cn } from "../lib/utils";
import { BrandLogo } from "./BrandLogo";

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
  brandLogoOverride?: Partial<BrandLogoConfig>;
}

function OverlaySocialIcon({ id }: { id: string }) {
  switch (id) {
    case "github":
      return <Github className="h-4 w-4" aria-hidden="true" />;
    case "twitter":
      return <Twitter className="h-4 w-4" aria-hidden="true" />;
    case "linkedin":
      return <Linkedin className="h-4 w-4" aria-hidden="true" />;
    default:
      return <Globe className="h-4 w-4" aria-hidden="true" />;
  }
}

export function MenuOverlay({ isOpen, onClose, onOpenSearch, brandLogoOverride }: MenuOverlayProps) {
  const location = useLocation();
  const manifest = getSiteManifest();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-[100] flex flex-col bg-[var(--iapj-menu-bg)] text-[var(--iapj-menu-text)]"
        >
          {/* Top Bar */}
          <div className="mx-auto flex h-20 w-full max-w-[var(--iapj-container-max)] items-center justify-between px-4 sm:px-6 lg:px-8">
            <BrandLogo
              surface="dark"
              override={brandLogoOverride}
              onClick={onClose}
              className="text-[var(--iapj-menu-text)]"
            />

            <div className="flex items-center gap-4">
              {onOpenSearch && (
                <button
                  type="button"
                  onClick={onOpenSearch}
                  aria-label="Search blog"
                  className="p-2 text-[var(--iapj-menu-muted)] hover:text-[var(--iapj-menu-text)] transition-colors cursor-pointer"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
              <Link
                to={manifest.navigation.headerCta.path}
                onClick={onClose}
                className="whitespace-nowrap shrink-0 rounded-full bg-white px-5 py-2 text-sm font-medium text-[#111115] transition-transform duration-150 hover:scale-[1.02]"
              >
                {manifest.navigation.headerCta.label}
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="p-2 text-[var(--iapj-menu-muted)] hover:text-[var(--iapj-menu-text)] transition-colors cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Center 2-Column Editorial Menu */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto grid h-full max-w-[var(--iapj-container-max)] grid-cols-1 gap-12 px-4 py-10 sm:px-6 md:grid-cols-12 md:items-center lg:px-8">
              {/* Left Column: Contact & Studio Info */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.4 }}
                className="md:col-span-5 flex flex-col gap-3"
              >
                <a
                  href={resolveLink(manifest.contact.emailRef)}
                  className="w-fit text-xl sm:text-2xl font-normal underline underline-offset-8 decoration-1 hover:opacity-75 transition-opacity"
                >
                  {manifest.contact.email}
                </a>
                <p className="text-base text-[var(--iapj-menu-muted)]">
                  {manifest.contact.secondaryLine}
                </p>
              </motion.div>

              {/* Right Column: Large Stacked Navigation */}
              <nav
                className="md:col-span-7 flex flex-col gap-2"
                aria-label="Primary menu links"
              >
                {manifest.navigation.overlayMenu.map((item, idx) => {
                  const isActive =
                    item.path === "/blog"
                      ? location.pathname === "/" || location.pathname === "/blog"
                      : location.pathname.startsWith(item.path);
                  const isFramed = hoveredPath === item.path || (hoveredPath === null && isActive);

                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 + idx * 0.04, duration: 0.35 }}
                    >
                      <Link
                        to={item.path}
                        onClick={onClose}
                        onMouseEnter={() => setHoveredPath(item.path)}
                        onMouseLeave={() => setHoveredPath(null)}
                        className={cn(
                          "block rounded-xl px-5 py-3 text-3xl sm:text-4xl font-semibold tracking-tight transition-all duration-150 border",
                          isFramed
                            ? "border-white/15 bg-white/[0.04] text-white"
                            : "border-transparent text-white/80 hover:text-white"
                        )}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Bottom Strip */}
          <div className="mx-auto flex w-full max-w-[var(--iapj-container-max)] flex-col items-start justify-between gap-4 border-t border-[var(--iapj-menu-border)] px-4 py-6 sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <div className="flex items-center gap-5">
              {manifest.contact.socials.map((social) => (
                <a
                  key={social.id}
                  href={resolveLink(social.urlRef)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="text-[var(--iapj-menu-text)] hover:opacity-70 transition-opacity"
                >
                  <OverlaySocialIcon id={social.id} />
                </a>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--iapj-menu-muted)]">
              {manifest.navigation.legalLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  className="underline underline-offset-4 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <span>{manifest.brand.tagline}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
