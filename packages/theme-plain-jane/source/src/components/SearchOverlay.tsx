import { motion, AnimatePresence } from "motion/react";
import { Search, X, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { articles } from "../data/articles";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setQuery("");
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

  const normalized = query.trim().toLowerCase();
  const results =
    normalized.length > 1
      ? articles.filter(
          (a) =>
            a.title.toLowerCase().includes(normalized) ||
            a.excerpt.toLowerCase().includes(normalized) ||
            a.categoryLabel.toLowerCase().includes(normalized) ||
            a.tags.some((t) => t.toLowerCase().includes(normalized))
        )
      : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    navigate(normalized ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] bg-[var(--iapj-surface-elevated)]/95 backdrop-blur-xl flex flex-col"
        >
          <div className="flex justify-end p-6">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="p-2 text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)] transition-colors cursor-pointer"
            >
              <X className="h-7 w-7" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-24">
            <div className="mx-auto max-w-3xl pt-8 sm:pt-12">
              <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-7 text-[var(--iapj-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search blog posts, SAM docs, design guides..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent border-b-2 border-[var(--iapj-border)] py-4 pl-11 pr-4 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--iapj-text-primary)] placeholder:text-[var(--iapj-text-muted)]/60 focus:border-[var(--iapj-border-strong)] focus:outline-none transition-colors"
                />
              </form>

              <div className="mt-4 flex justify-end">
                <Link
                  to={normalized ? `/search?q=${encodeURIComponent(query.trim())}` : "/search"}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)] transition-colors"
                >
                  <span>Open full archive search</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-12 flex flex-col gap-8">
                {normalized.length > 1 && results.length === 0 && (
                  <p className="text-[var(--iapj-text-muted)] text-lg">
                    No entries found for &ldquo;{query}&rdquo;.
                  </p>
                )}
                {results.map((article, idx) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-[var(--iapj-border)] pb-6"
                  >
                    <Link
                      to={article.canonicalPath ?? `/blog/${article.slug}`}
                      onClick={onClose}
                      className="group block"
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-[var(--iapj-text-muted)] mb-2">
                        <span>{article.categoryLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{article.date}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{article.readTime}</span>
                      </div>
                      <h3 className="text-2xl font-semibold tracking-tight text-[var(--iapj-text-primary)] group-hover:text-[var(--iapj-link-hover)] transition-colors mb-2">
                        {article.title}
                      </h3>
                      <p className="text-[var(--iapj-text-body)] line-clamp-2 text-sm leading-relaxed">
                        {article.excerpt}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
