import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Search as SearchIcon, X } from "lucide-react";
import { articles } from "../data/articles";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { resolveMedia } from "../lib/mediaResolver";
import { FadeImage } from "../components/FadeImage";
import { EditorialMediaPlate } from "../components/EditorialMediaPlate";

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      setSearchParams({ q: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const normalized = query.trim().toLowerCase();
  const results = normalized
    ? articles.filter(
        (article) =>
          article.title.toLowerCase().includes(normalized) ||
          article.excerpt.toLowerCase().includes(normalized) ||
          article.categoryLabel.toLowerCase().includes(normalized) ||
          article.tags.some((t) => t.toLowerCase().includes(normalized))
      )
    : articles;

  const quickTopics = Array.from(new Set(articles.flatMap((a) => a.tags))).slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--iapj-bg)] text-[var(--iapj-text-primary)]">
      <Header />

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-3 text-xs font-medium tracking-wider text-[var(--iapj-text-muted)]">
              Archive
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--iapj-text-primary)] sm:text-5xl">
              Search the Blog
            </h1>

            <div className="relative mt-10">
              <SearchIcon className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6 text-[var(--iapj-text-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search by title, architecture, or topic..."
                aria-label="Search articles"
                className="w-full bg-transparent border-b-2 border-[var(--iapj-border)] py-4 pl-10 pr-10 text-2xl font-semibold tracking-tight text-[var(--iapj-text-primary)] placeholder:text-[var(--iapj-text-muted)]/60 focus:border-[var(--iapj-border-strong)] focus:outline-none transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => handleQueryChange("")}
                  aria-label="Clear search query"
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)] transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-[var(--iapj-text-muted)]">
              <span>Topics:</span>
              {quickTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleQueryChange(topic)}
                  className="underline-offset-4 hover:underline hover:text-[var(--iapj-text-primary)] transition-colors cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="mt-14 border-t border-[var(--iapj-border)]">
            {results.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-2xl font-semibold text-[var(--iapj-text-primary)]">
                  No entries matched &ldquo;{query}&rdquo;
                </p>
                <p className="mt-3 text-sm text-[var(--iapj-text-muted)]">
                  Try searching for another architecture topic or clear your filter to browse all entries.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--iapj-border)]">
                {results.map((article) => {
                  const cover = resolveMedia(article.coverImageRef);
                  return (
                    <li key={article.id} className="py-8">
                      <Link
                        to={article.canonicalPath ?? `/blog/${article.slug}`}
                        className="group flex flex-col gap-6 sm:flex-row sm:items-center"
                      >
                        <div className="aspect-[16/10] w-full sm:w-48 shrink-0 overflow-hidden rounded-xl iapj-clay-card">
                          {cover.src ? (
                            <FadeImage
                              src={cover.src}
                              alt={cover.alt || article.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <EditorialMediaPlate
                              plateKey={article.coverImageRef}
                              alt={article.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--iapj-text-muted)]">
                            <span>{article.categoryLabel}</span>
                            <span aria-hidden="true">·</span>
                            <span>Created: {article.date}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{article.readTime}</span>
                          </div>
                          <h2 className="text-2xl font-semibold tracking-tight text-[var(--iapj-text-primary)] group-hover:text-[var(--iapj-link-hover)] transition-colors">
                            {article.title}
                          </h2>
                          <p className="mt-2 text-sm text-[var(--iapj-text-body)] line-clamp-2 leading-relaxed">
                            {article.excerpt}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
