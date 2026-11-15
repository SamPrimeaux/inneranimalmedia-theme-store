import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { getSiteManifest } from "../lib/mediaResolver";
import { cn } from "../lib/utils";

interface BlogSubNavProps {
  activeSlug: string;
  onOpenSearch?: () => void;
}

export function BlogSubNav({ activeSlug, onOpenSearch }: BlogSubNavProps) {
  const manifest = getSiteManifest();

  return (
    <div className="mx-auto max-w-[var(--iapj-container-max)] px-4 sm:px-6 lg:px-8 pt-6 pb-4">
      <div className="flex items-center justify-between gap-6 border-b border-[var(--iapj-border)] pb-3">
        <nav
          className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1"
          aria-label="Blog categories"
        >
          {manifest.navigation.categories.map((cat) => {
            const isActive = activeSlug === cat.slug;
            return (
              <Link
                key={cat.slug}
                to={cat.path}
                className={cn(
                  "whitespace-nowrap shrink-0 pb-2 -mb-[13px] text-sm font-medium transition-colors border-b-2",
                  isActive
                    ? "border-[var(--iapj-border-strong)] text-[var(--iapj-text-primary)]"
                    : "border-transparent text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)]"
                )}
              >
                {cat.label}
              </Link>
            );
          })}
        </nav>

        {onOpenSearch ? (
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search articles"
            className="p-1.5 text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)] transition-colors shrink-0 cursor-pointer"
          >
            <Search className="h-4 w-4" />
          </button>
        ) : (
          <Link
            to="/search"
            aria-label="Search articles"
            className="p-1.5 text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)] transition-colors shrink-0"
          >
            <Search className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
