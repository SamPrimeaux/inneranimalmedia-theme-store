import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getSiteManifest, type BrandLogoConfig } from "../lib/mediaResolver";
import { cn } from "../lib/utils";
import { BrandLogo } from "./BrandLogo";
import { MenuOverlay } from "./MenuOverlay";
import { SearchOverlay } from "./SearchOverlay";

export function Header({ brandLogoOverride }: { brandLogoOverride?: Partial<BrandLogoConfig> } = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const location = useLocation();
  const manifest = getSiteManifest();

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 18);

      if (isMenuOpen || isSearchOpen) {
        setIsHidden(false);
        lastScrollY.current = currentY;
        return;
      }

      const delta = currentY - lastScrollY.current;
      if (currentY <= 72) {
        setIsHidden(false);
      } else if (delta > 6) {
        setIsHidden(true);
      } else if (delta < -4) {
        setIsHidden(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMenuOpen, isSearchOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isHidden ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100",
          isScrolled ? "iapj-glass-header" : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="mx-auto flex h-20 max-w-[var(--iapj-container-max)] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Unified Brand Logo Set (Icon + Wordmark or Full Lockup) */}
          <BrandLogo
            surface="auto"
            override={brandLogoOverride}
            className="text-[var(--iapj-text-primary)]"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--iapj-text-body)]"
            aria-label="Primary navigation"
          >
            {manifest.navigation.topBar.map((item) => {
              const isActive =
                item.path === "/blog"
                  ? location.pathname === "/" ||
                    location.pathname === "/blog" ||
                    location.pathname.startsWith("/blog/")
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "whitespace-nowrap shrink-0 py-1 transition-colors border-b",
                    isActive
                      ? "text-[var(--iapj-text-primary)] border-[var(--iapj-border-strong)]"
                      : "border-transparent hover:text-[var(--iapj-text-primary)]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Contact Pill + Fullscreen Overlay Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={manifest.navigation.headerCta.path}
              className="whitespace-nowrap shrink-0 rounded-full bg-[var(--iapj-accent)] px-5 py-2 text-sm font-medium text-[var(--iapj-accent-contrast)] shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              {manifest.navigation.headerCta.label}
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--iapj-text-primary)] hover:bg-[var(--iapj-surface-subtle)] transition-colors cursor-pointer"
            >
              <span className="flex flex-col gap-1.5 w-5" aria-hidden="true">
                <span className="h-[1.5px] w-full bg-current block" />
                <span className="h-[1.5px] w-full bg-current block" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header height */}
      <div className="h-20" aria-hidden="true" />

      <MenuOverlay
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        brandLogoOverride={brandLogoOverride}
        onOpenSearch={() => {
          setIsMenuOpen(false);
          setIsSearchOpen(true);
        }}
      />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
