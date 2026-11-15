import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { articles, uxGuideArticles } from "../data/articles";
import { getSiteManifest } from "../lib/mediaResolver";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { BlogSubNav } from "../components/BlogSubNav";
import { ArticleCard } from "../components/ArticleCard";
import { SearchOverlay } from "../components/SearchOverlay";
import { cn } from "../lib/utils";

type UxTopicFilter = "all" | "process" | "research" | "craft" | "reference";

const UX_TOPIC_FILTERS: { id: UxTopicFilter; label: string }[] = [
  { id: "all", label: "All Chapters" },
  { id: "process", label: "Strategy & Process" },
  { id: "research", label: "Research & Data" },
  { id: "craft", label: "Craft & Roles" },
  { id: "reference", label: "Books & Myths" },
];

const UX_READING_TRACKS = [
  {
    track: "Track 01 · Ship Faster",
    title: "Strategy, Roadmaps & Task Structure",
    summary:
      "Start with the Working Guide loop, replace date-heavy backlogs with Now/Next/Later outcomes, and decompose messy workflows with Task Analysis.",
    chapters: [
      { label: "00 · Working Guide for 2026", path: "/blog/ux-guide" },
      { label: "06 · Now, Next, Later Roadmaps", path: "/blog/ux-guide/product-roadmap" },
      { label: "07 · Hierarchical Task Analysis", path: "/blog/ux-guide/ux-task-analysis" },
    ],
  },
  {
    track: "Track 02 · Find What's True",
    title: "Behavior Data, Testing & Personas",
    summary:
      "Instrument events before you guess, pair funnels with 5-person usability sessions, and anchor teams with evidence-backed journeys and personas.",
    chapters: [
      { label: "01 · Reading Behavior Data", path: "/blog/ux-guide/user-behavior-data" },
      { label: "03 · User Testing Craft", path: "/blog/ux-guide/user-testing" },
      { label: "04 · Customer Journey Mapping", path: "/blog/ux-guide/customer-journey-map" },
      { label: "05 · Decision-Ready Personas", path: "/blog/ux-guide/user-personas" },
    ],
  },
  {
    track: "Track 03 · Master the Craft",
    title: "Interaction States, Roles & Reading",
    summary:
      "Own behavior across states and edge cases, map all nine UX disciplines on a lean team, and separate durable craft from design folklore.",
    chapters: [
      { label: "09 · Interaction Designer", path: "/blog/ux-guide/interaction-designer" },
      { label: "10 · Product Designer", path: "/blog/ux-guide/product-designer" },
      { label: "13 · UX Disciplines Map", path: "/blog/ux-guide/ux-disciplines" },
      { label: "12 · UX Myths Worth Retiring", path: "/blog/ux-guide/ux-myths" },
    ],
  },
];

export function BlogCategory() {
  const { slug = "all" } = useParams<{ slug: string }>();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [topicFilter, setTopicFilter] = useState<UxTopicFilter>("all");
  const manifest = getSiteManifest();

  const isUiUxCategory = slug === "ui-ux";

  const categoryMeta =
    manifest.navigation.categories.find((c) => c.slug === slug) ??
    manifest.navigation.categories[0];

  const categoryPosts =
    slug === "all"
      ? articles
      : articles.filter((article) => article.category === slug);

  const relatedPosts =
    slug === "all"
      ? []
      : articles.filter((article) => article.category !== slug).slice(0, 3);

  // For UI/UX category, highlight Chapter 00 + 7 Essential UX Principles in the 2-up top banner
  const featuredBanner = isUiUxCategory
    ? [
        uxGuideArticles.find((a) => a.slug === "ux-guide") ?? categoryPosts[0],
        articles.find((a) => a.slug === "essential-ux-design-principles") ?? categoryPosts[1],
      ].filter(Boolean)
    : categoryPosts.slice(0, 2);

  const filteredUiUxPosts = isUiUxCategory
    ? topicFilter === "all"
      ? categoryPosts
      : categoryPosts.filter(
          (a) => a.topicGroup === topicFilter || (topicFilter === "reference" && a.slug === "essential-ux-design-principles")
        )
    : categoryPosts;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--iapj-bg)] text-[var(--iapj-text-primary)]">
      <Header />

      <main className="flex-1">
        <BlogSubNav activeSlug={slug} onOpenSearch={() => setIsSearchOpen(true)} />

        {/* Category Header & Featured Banners */}
        <section className="mx-auto max-w-[var(--iapj-container-max)] px-4 pt-10 pb-14 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
          >
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-[var(--iapj-text-primary)] sm:text-5xl">
                {categoryMeta.label}
              </h1>
              <p className="mt-4 text-lg text-[var(--iapj-text-body)]">
                {categoryMeta.description}
              </p>
            </div>

            {isUiUxCategory && (
              <div className="text-sm font-medium text-[var(--iapj-text-muted)] tabular-nums shrink-0">
                <span>{categoryPosts.length} Guides &amp; Chapters</span>
              </div>
            )}
          </motion.div>

          {featuredBanner.length > 0 && (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {featuredBanner.map((article, idx) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="overlay-banner"
                  index={idx}
                />
              ))}
            </div>
          )}
        </section>

        {/* Latest / Complete Series Grid */}
        <section className="mx-auto max-w-[var(--iapj-container-max)] px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--iapj-text-primary)] sm:text-4xl">
              {isUiUxCategory ? "The Complete Field Guide" : "Latest"}
            </h2>

            {isUiUxCategory && (
              <div
                className="flex flex-wrap items-center gap-1 rounded-xl bg-[var(--iapj-surface-subtle)] p-1 border border-[var(--iapj-border)]"
                role="tablist"
                aria-label="Filter UI/UX chapters by topic"
              >
                {UX_TOPIC_FILTERS.map((tab) => {
                  const active = topicFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTopicFilter(tab.id)}
                      className={cn(
                        "whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                        active
                          ? "bg-[var(--iapj-surface-elevated)] text-[var(--iapj-text-primary)] shadow-sm"
                          : "text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)]"
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {filteredUiUxPosts.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[var(--iapj-border)] bg-[var(--iapj-surface-subtle)] p-10">
              <p className="text-lg font-medium text-[var(--iapj-text-primary)]">
                No entries published under this filter yet.
              </p>
              <Link
                to="/blog"
                className="mt-4 inline-flex items-center gap-2 border-b border-[var(--iapj-border-strong)] pb-1 text-sm font-medium"
              >
                <span>Return to all posts</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {filteredUiUxPosts.map((article, idx) => (
                <ArticleCard key={article.id} article={article} variant="standard" index={idx} />
              ))}
            </div>
          )}
        </section>

        {/* Contrasting Dark Reading Tracks Band for UI/UX Category */}
        {isUiUxCategory && (
          <section className="my-12 bg-[var(--iapj-surface-contrast)] py-20 text-[var(--iapj-surface-contrast-ink)] sm:py-24">
            <div className="mx-auto max-w-[var(--iapj-container-max)] px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Curated Reading Tracks
                </h2>
                <p className="mt-4 text-base text-[var(--iapj-surface-contrast-muted)]">
                  Start with the problem you are facing today and follow a focused sequence of chapters.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
                {UX_READING_TRACKS.map((track) => (
                  <div
                    key={track.track}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-7"
                  >
                    <div>
                      <p className="text-xs font-medium text-white/65 tabular-nums">
                        {track.track}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                        {track.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--iapj-surface-contrast-muted)]">
                        {track.summary}
                      </p>
                    </div>

                    <ul className="mt-8 space-y-2.5 border-t border-white/10 pt-5">
                      {track.chapters.map((ch) => (
                        <li key={ch.path}>
                          <Link
                            to={ch.path}
                            className="group flex items-center justify-between text-sm font-medium text-white/85 hover:text-white transition-colors"
                          >
                            <span className="tabular-nums">{ch.label}</span>
                            <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Related Reading */}
        {relatedPosts.length > 0 && (
          <section className="mx-auto max-w-[var(--iapj-container-max)] border-t border-[var(--iapj-border)] px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--iapj-text-primary)]">
                More from the Journal
              </h2>
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)] transition-colors"
              >
                <span>All posts</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((article, idx) => (
                <ArticleCard key={article.id} article={article} variant="standard" index={idx} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
