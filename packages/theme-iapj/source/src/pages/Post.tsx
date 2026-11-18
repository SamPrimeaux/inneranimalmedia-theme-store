import { useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Copy, ChevronDown } from "lucide-react";
import { articles, uxGuideArticles } from "../data/articles";
import { resolveMedia } from "../lib/mediaResolver";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AuthorInfo } from "../components/AuthorInfo";
import { QuoteEmbed } from "../components/QuoteEmbed";
import { ImageEmbed } from "../components/ImageEmbed";
import { Gallery } from "../components/Gallery";
import { FadeImage } from "../components/FadeImage";
import { ArticleCard } from "../components/ArticleCard";
import { EditorialMediaPlate } from "../components/EditorialMediaPlate";
import { RichMarkdownContent } from "../components/RichMarkdownContent";
import { cn } from "../lib/utils";

function CodeBlock({ language, label, content }: { language: string; label?: string; content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="my-10 overflow-hidden rounded-2xl border border-[var(--iapj-border)] bg-[var(--iapj-surface-subtle)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--iapj-border)] px-5 py-3 text-xs text-[var(--iapj-text-muted)]">
        <span className="font-mono tracking-tight">
          {label ? `${label} · ${language}` : language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto bg-transparent p-5 text-[13px] leading-relaxed font-mono text-[var(--iapj-text-primary)]">
        <code>{content}</code>
      </pre>
    </div>
  );
}

export function Post({ forcedSlug }: { forcedSlug?: string }) {
  const params = useParams<{ slug: string }>();
  const resolvedSlug = forcedSlug ?? params.slug;
  const currentIndex = articles.findIndex((a) => a.slug === resolvedSlug);
  const article = currentIndex >= 0 ? articles[currentIndex] : undefined;
  const [chaptersOpen, setChaptersOpen] = useState(false);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 220]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const cover = resolveMedia(article.coverImageRef);
  const isUxSeries = article.guideSeries === "ux-guide";

  const seriesIndex = isUxSeries
    ? uxGuideArticles.findIndex((a) => a.slug === article.slug)
    : -1;

  const previousArticle = isUxSeries
    ? seriesIndex > 0
      ? uxGuideArticles[seriesIndex - 1]
      : undefined
    : currentIndex > 0
    ? articles[currentIndex - 1]
    : undefined;

  const nextArticle = isUxSeries
    ? seriesIndex >= 0 && seriesIndex < uxGuideArticles.length - 1
      ? uxGuideArticles[seriesIndex + 1]
      : undefined
    : currentIndex < articles.length - 1
    ? articles[currentIndex + 1]
    : undefined;

  const explicitRelated = article.relatedSlugs
    ? article.relatedSlugs
        .map((relSlug) => articles.find((a) => a.slug === relSlug))
        .filter((a): a is NonNullable<typeof a> => Boolean(a))
    : [];

  const relatedArticles =
    explicitRelated.length > 0
      ? explicitRelated.slice(0, 3)
      : articles.filter((a) => a.id !== article.id).slice(0, 3);

  const chapterBadge =
    typeof article.chapterNumber === "number"
      ? `Chapter ${String(article.chapterNumber).padStart(2, "0")}`
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--iapj-bg)] text-[var(--iapj-text-primary)]">
      <Header />

      <main className="flex-1">
        {/* Immersive Hero */}
        <div className="relative h-[64vh] min-h-[460px] w-full overflow-hidden bg-[var(--iapj-media-backdrop)]">
          <motion.div style={{ y, opacity }} className="absolute inset-0">
            {cover.src ? (
              <FadeImage
                src={cover.src}
                alt={cover.alt || article.title}
                className="h-full w-full object-cover opacity-65"
              />
            ) : (
              <EditorialMediaPlate
                plateKey={article.coverImageRef}
                alt={article.title}
                className="h-full w-full object-cover opacity-75"
              />
            )}
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />

          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12 md:p-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-4xl"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2.5 text-xs font-medium tracking-wider text-[var(--iapj-media-ink-muted)] tabular-nums">
                <Link
                  to={`/blog/category/${article.category}`}
                  className="hover:text-white transition-colors underline underline-offset-4"
                >
                  {article.categoryLabel}
                </Link>
                {chapterBadge && (
                  <>
                    <span aria-hidden="true">·</span>
                    <Link
                      to="/blog/ux-guide"
                      className="hover:text-white transition-colors underline underline-offset-4"
                    >
                      {chapterBadge}
                    </Link>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>Created: {article.date}</span>
                <span aria-hidden="true">·</span>
                <span>{article.readTime}</span>
              </div>

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-[var(--iapj-media-ink)] sm:text-5xl md:text-6xl">
                {article.title}
              </h1>
            </motion.div>
          </div>
        </div>

        {/* Article Body */}
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="prose prose-lg iapj-prose mx-auto prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed"
          >
            <p className="lead text-2xl font-serif italic text-[var(--iapj-text-primary)] mb-12">
              {article.excerpt}
            </p>

            {article.markdownBlocks && article.markdownBlocks.length > 0 ? (
              <RichMarkdownContent blocks={article.markdownBlocks} />
            ) : (
              article.sections.map((section, idx) => {
                const sectionImage = section.imageRef
                  ? resolveMedia(section.imageRef)
                  : undefined;
                const sectionGallery = section.galleryRefs
                  ? section.galleryRefs.map((ref) => {
                      const resolved = resolveMedia(ref);
                      return {
                        src: resolved.src,
                        alt: resolved.alt,
                        caption: resolved.caption,
                      };
                    })
                  : undefined;

                return (
                  <section key={idx} className="mb-10">
                    {section.heading && (
                      <h2 className="text-3xl mt-16 mb-6 text-[var(--iapj-text-primary)]">
                        {section.heading}
                      </h2>
                    )}

                    {section.subheading && (
                      <h3 className="text-2xl mt-10 mb-4 text-[var(--iapj-text-primary)]">
                        {section.subheading}
                      </h3>
                    )}

                    {section.paragraphs?.map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}

                    {section.callout && (
                      <div className="not-prose my-10 rounded-2xl iapj-clay-card p-6 sm:p-8">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--iapj-text-muted)]">
                          {section.callout.label}
                        </p>
                        <p className="font-serif text-xl leading-relaxed text-[var(--iapj-text-primary)]">
                          {section.callout.text}
                        </p>
                      </div>
                    )}

                    {section.bullets && (
                      <ul className="my-6 space-y-3">
                        {section.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="leading-relaxed">
                            {bullet.label && (
                              <strong className="font-semibold text-[var(--iapj-text-primary)]">
                                {bullet.label}:{" "}
                              </strong>
                            )}
                            <span>{bullet.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.table && (
                      <div className="not-prose my-10 overflow-x-auto rounded-2xl border border-[var(--iapj-border)]">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-[var(--iapj-border)] bg-[var(--iapj-surface-subtle)]">
                              {section.table.headers.map((header, hIdx) => (
                                <th
                                  key={hIdx}
                                  className="px-4 py-3 font-semibold tracking-wide text-[var(--iapj-text-primary)]"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--iapj-border)]">
                            {section.table.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="px-4 py-3 align-top text-[var(--iapj-text-body)] tabular-nums"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {section.code && (
                      <div className="not-prose">
                        <CodeBlock
                          language={section.code.language}
                          label={section.code.label}
                          content={section.code.content}
                        />
                      </div>
                    )}

                    {section.quote && (
                      <QuoteEmbed
                        quote={section.quote.quote}
                        author={section.quote.author}
                        source={section.quote.source}
                      />
                    )}

                    {sectionImage && (
                      <ImageEmbed
                        src={sectionImage.src}
                        alt={sectionImage.alt}
                        caption={sectionImage.caption}
                        size="wide"
                      />
                    )}

                    {sectionGallery && <Gallery images={sectionGallery} />}
                  </section>
                );
              })
            )}
          </motion.div>

          {/* UX Guide Series Chapter Directory */}
          {isUxSeries && (
            <section
              aria-label="UX Guide chapters"
              className="mt-14 rounded-2xl border border-[var(--iapj-border)] bg-[var(--iapj-surface-subtle)] p-6"
            >
              <button
                type="button"
                onClick={() => setChaptersOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <p className="text-xs font-medium text-[var(--iapj-text-muted)]">
                    The Working UI/UX Design Guide for 2026
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--iapj-text-primary)]">
                    All 14 Chapters ({chapterBadge} of 13)
                  </h2>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-[var(--iapj-text-muted)] transition-transform duration-200",
                    chaptersOpen && "rotate-180"
                  )}
                />
              </button>

              {chaptersOpen && (
                <ol className="mt-6 grid grid-cols-1 gap-2 border-t border-[var(--iapj-border)] pt-5 sm:grid-cols-2">
                  {uxGuideArticles.map((ch) => {
                    const isCurrent = ch.slug === article.slug;
                    const chNum = String(ch.chapterNumber ?? 0).padStart(2, "0");
                    return (
                      <li key={ch.slug}>
                        <Link
                          to={ch.canonicalPath ?? `/blog/ux-guide/${ch.slug}`}
                          className={cn(
                            "flex items-baseline gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            isCurrent
                              ? "bg-[var(--iapj-surface-elevated)] font-semibold text-[var(--iapj-text-primary)] border border-[var(--iapj-border)]"
                              : "text-[var(--iapj-text-body)] hover:text-[var(--iapj-text-primary)] hover:bg-[var(--iapj-surface-elevated)]/60"
                          )}
                        >
                          <span className="font-mono text-xs text-[var(--iapj-text-muted)] tabular-nums shrink-0">
                            {chNum}
                          </span>
                          <span className="truncate">{ch.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          )}

          <AuthorInfo author={article.author} />

          {/* Sequential Article Navigation */}
          <nav
            aria-label="Adjacent entries"
            className="mt-16 grid grid-cols-1 gap-6 border-t border-[var(--iapj-border)] pt-10 sm:grid-cols-2"
          >
            <div>
              {previousArticle && (
                <Link
                  to={previousArticle.canonicalPath ?? `/blog/${previousArticle.slug}`}
                  className="group flex flex-col gap-2"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider text-[var(--iapj-text-muted)]">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>{isUxSeries ? "Previous Chapter" : "Previous Entry"}</span>
                  </span>
                  <span className="text-lg font-semibold text-[var(--iapj-text-primary)] group-hover:text-[var(--iapj-link-hover)] transition-colors">
                    {previousArticle.title}
                  </span>
                </Link>
              )}
            </div>
            <div className="sm:text-right">
              {nextArticle && (
                <Link
                  to={nextArticle.canonicalPath ?? `/blog/${nextArticle.slug}`}
                  className="group flex flex-col gap-2 sm:items-end"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider text-[var(--iapj-text-muted)]">
                    <span>{isUxSeries ? "Next Chapter" : "Next Entry"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-lg font-semibold text-[var(--iapj-text-primary)] group-hover:text-[var(--iapj-link-hover)] transition-colors">
                    {nextArticle.title}
                  </span>
                </Link>
              )}
            </div>
          </nav>
        </article>

        {/* Bottom 3-Column More Reading Strip */}
        <section className="mx-auto max-w-[var(--iapj-container-max)] border-t border-[var(--iapj-border)] px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--iapj-text-primary)]">
              Continue Reading
            </h2>
            {isUxSeries && (
              <Link
                to="/blog/category/ui-ux"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--iapj-text-muted)] hover:text-[var(--iapj-text-primary)] transition-colors"
              >
                <span>All UI/UX guides</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {relatedArticles.map((related, idx) => (
              <ArticleCard key={related.id} article={related} variant="standard" index={idx} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
