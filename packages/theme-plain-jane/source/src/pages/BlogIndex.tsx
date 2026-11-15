import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { articles } from "../data/articles";
import { getSiteManifest } from "../lib/mediaResolver";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { BlogSubNav } from "../components/BlogSubNav";
import { ArticleCard } from "../components/ArticleCard";
import { SearchOverlay } from "../components/SearchOverlay";

export function BlogIndex() {
  const manifest = getSiteManifest();
  const [heroOffset, setHeroOffset] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Featured pairs controlled by the header carousel arrows
  const heroPair = [
    articles[heroOffset % articles.length],
    articles[(heroOffset + 1) % articles.length],
  ];

  const latestTop = articles.slice(0, 2);
  const latestGrid = articles.slice(2, 5);
  const fieldManuals = articles.filter((a) => a.isGuide).slice(0, 3);

  const aiArticles = articles.filter((a) => a.category === "ai" || a.category === "runtime");
  const designArticles = articles
    .filter(
      (a) => a.category === "ui-ux" || a.category === "design-systems" || a.category === "platform"
    )
    .slice(0, 5);

  const stepPrev = () => setHeroOffset((prev) => (prev - 1 + articles.length) % articles.length);
  const stepNext = () => setHeroOffset((prev) => (prev + 1) % articles.length);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--iapj-bg)] text-[var(--iapj-text-primary)]">
      <Header />

      <main className="flex-1">
        {/* Sub-navigation strip */}
        <BlogSubNav activeSlug="all" onOpenSearch={() => setIsSearchOpen(true)} />

        {/* Band 1: Blog Header & Featured 2-Up Showcase */}
        <section className="mx-auto max-w-[var(--iapj-container-max)] px-4 pt-10 pb-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
          >
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-[var(--iapj-text-primary)] sm:text-6xl">
                {manifest.brand.blogTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-[var(--iapj-text-body)]">
                {manifest.brand.blogSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={stepPrev}
                aria-label="Previous featured posts"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--iapj-border)] text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)] hover:border-[var(--iapj-border-strong)] transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={stepNext}
                aria-label="Next featured posts"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--iapj-border)] text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)] hover:border-[var(--iapj-border-strong)] transition-colors cursor-pointer"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            {heroPair.map((article, idx) => (
              <ArticleCard
                key={`${article.id}-${heroOffset}`}
                article={article}
                variant="overlay-banner"
                index={idx}
              />
            ))}
          </div>
        </section>

        {/* Band 2: Latest (2-up large + 3-up secondary + View archive) */}
        <section className="mx-auto max-w-[var(--iapj-container-max)] px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold tracking-tight text-[var(--iapj-text-primary)] sm:text-5xl">
            Latest
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
            {latestTop.map((article, idx) => (
              <ArticleCard key={article.id} article={article} variant="large" index={idx} />
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {latestGrid.map((article, idx) => (
              <ArticleCard key={article.id} article={article} variant="standard" index={idx} />
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 border-b border-[var(--iapj-border-strong)] pb-1 text-base font-medium text-[var(--iapj-text-primary)] hover:opacity-70 transition-opacity"
            >
              <span>View archive</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Band 3: Contrasting Dark Field Manuals Section */}
        <section className="my-12 bg-[var(--iapj-surface-contrast)] py-20 text-[var(--iapj-surface-contrast-ink)] sm:py-24">
          <div className="mx-auto max-w-[var(--iapj-container-max)] px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Field Manuals
              </h2>
              <p className="mt-4 text-lg text-[var(--iapj-surface-contrast-muted)]">
                Unlock canonical architecture guidance and hands-on engineering drills in our core collection
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {fieldManuals.map((article, idx) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="guide-portrait"
                  index={idx}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Band 4: AI & Edge Runtime Category Showcase */}
        <section className="mx-auto max-w-[var(--iapj-container-max)] px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight text-[var(--iapj-text-primary)] sm:text-5xl">
              AI &amp; Edge Runtime
            </h2>
            <p className="mt-4 text-lg text-[var(--iapj-text-body)]">
              Typed decision primitives, codebase benchmarking cookbooks, and hybrid Go-to-Cloudflare systems
            </p>
          </div>

          {aiArticles.length >= 2 && (
            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <ArticleCard article={aiArticles[0]} variant="large" index={0} />
              </div>
              <div className="lg:col-span-5">
                <ArticleCard article={aiArticles[1]} variant="standard" index={1} />
              </div>
            </div>
          )}

          {aiArticles.length > 2 && (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {aiArticles.slice(2).map((article, idx) => (
                <ArticleCard key={article.id} article={article} variant="standard" index={idx} />
              ))}
            </div>
          )}

          <div className="mt-14 flex justify-center">
            <Link
              to="/blog/category/ai"
              className="inline-flex items-center gap-2 border-b border-[var(--iapj-border-strong)] pb-1 text-base font-medium text-[var(--iapj-text-primary)] hover:opacity-70 transition-opacity"
            >
              <span>View all AI articles</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Band 5: UI/UX & Design Systems Category Showcase */}
        <section className="mx-auto max-w-[var(--iapj-container-max)] border-t border-[var(--iapj-border)] px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight text-[var(--iapj-text-primary)] sm:text-5xl">
              UI/UX &amp; Design Systems
            </h2>
            <p className="mt-4 text-lg text-[var(--iapj-text-body)]">
              Dual-mode surface tokens, split-composition media heroes, and multi-domain CMS architecture
            </p>
          </div>

          {designArticles.length >= 2 && (
            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <ArticleCard article={designArticles[0]} variant="large" index={0} />
              </div>
              <div className="lg:col-span-5">
                <ArticleCard article={designArticles[1]} variant="standard" index={1} />
              </div>
            </div>
          )}

          {designArticles.length > 2 && (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {designArticles.slice(2).map((article, idx) => (
                <ArticleCard key={article.id} article={article} variant="standard" index={idx} />
              ))}
            </div>
          )}

          <div className="mt-14 flex flex-wrap justify-center gap-8">
            <Link
              to="/blog/category/ui-ux"
              className="inline-flex items-center gap-2 border-b border-[var(--iapj-border-strong)] pb-1 text-base font-medium text-[var(--iapj-text-primary)] hover:opacity-70 transition-opacity"
            >
              <span>Explore 14-chapter UI/UX guide</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/blog/category/design-systems"
              className="inline-flex items-center gap-2 border-b border-[var(--iapj-border-strong)] pb-1 text-base font-medium text-[var(--iapj-text-primary)] hover:opacity-70 transition-opacity"
            >
              <span>View design systems</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
