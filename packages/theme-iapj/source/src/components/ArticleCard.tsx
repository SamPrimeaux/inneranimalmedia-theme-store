import { Link } from "react-router-dom";
import { motion } from "motion/react";
import type { Article } from "../data/articles";
import { cn } from "../lib/utils";
import { resolveMedia } from "../lib/mediaResolver";
import { FadeImage } from "./FadeImage";
import { EditorialMediaPlate } from "./EditorialMediaPlate";

interface ArticleCardProps {
  article: Article;
  variant?: "standard" | "large" | "guide-portrait" | "overlay-banner";
  index?: number;
  className?: string;
}

function CardMedia({
  article,
  coverSrc,
  coverAlt,
  className,
  loading,
}: {
  article: Article;
  coverSrc: string;
  coverAlt: string;
  className?: string;
  loading: "eager" | "lazy";
}) {
  if (coverSrc) {
    return (
      <FadeImage
        src={coverSrc}
        alt={coverAlt || article.title}
        className={className}
        loading={loading}
      />
    );
  }
  return <EditorialMediaPlate plateKey={article.coverImageRef} alt={article.title} className={className} />;
}

export function ArticleCard({
  article,
  variant = "standard",
  index = 0,
  className,
}: ArticleCardProps) {
  const cover = resolveMedia(article.coverImageRef);
  const articleHref = article.canonicalPath ?? `/blog/${article.slug}`;
  const chapterLabel =
    typeof article.chapterNumber === "number"
      ? `Chapter ${String(article.chapterNumber).padStart(2, "0")}`
      : null;

  if (variant === "guide-portrait") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
        className={cn("group", className)}
      >
        <Link
          to={articleHref}
          className="relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-2xl bg-[var(--iapj-media-backdrop)] p-7 border border-white/10 shadow-xl transition-transform duration-300 group-hover:-translate-y-1"
        >
          <CardMedia
            article={article}
            coverSrc={cover.src}
            coverAlt={cover.alt}
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/85" />

          <div className="relative z-10">
            <span className="text-xs font-medium tracking-wide text-white/80">
              {chapterLabel ? `${article.categoryLabel} · ${chapterLabel}` : article.categoryLabel}
            </span>
            <h3 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-white">
              {article.title}
            </h3>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs text-white/75 tabular-nums">
            <span>{article.readTime}</span>
            <span aria-hidden="true">·</span>
            <span>Read manual</span>
          </div>
        </Link>
      </motion.article>
    );
  }

  if (variant === "overlay-banner") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
        className={cn("group", className)}
      >
        <Link
          to={articleHref}
          className="relative flex aspect-[16/9] flex-col justify-end overflow-hidden rounded-2xl bg-[var(--iapj-media-backdrop)] p-7 sm:p-9 border border-[var(--iapj-border)] transition-transform duration-300 group-hover:-translate-y-1"
        >
          <CardMedia
            article={article}
            coverSrc={cover.src}
            coverAlt={cover.alt}
            className="absolute inset-0 h-full w-full object-cover opacity-75 transition-transform duration-700 group-hover:scale-105"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />

          <div className="relative z-10 max-w-xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-white/80 tabular-nums">
              <span>{article.categoryLabel}</span>
              {chapterLabel && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{chapterLabel}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{article.readTime}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight text-white">
              {article.title}
            </h3>
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={cn("group flex flex-col", className)}
    >
      <Link
        to={articleHref}
        className="block aspect-[16/10] overflow-hidden rounded-2xl iapj-clay-card"
      >
        <CardMedia
          article={article}
          coverSrc={cover.src}
          coverAlt={cover.alt}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading={index < 2 ? "eager" : "lazy"}
        />
      </Link>

      <div className="mt-4 flex flex-col">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--iapj-text-muted)] tabular-nums">
          <span>{article.categoryLabel}</span>
          {chapterLabel && (
            <>
              <span aria-hidden="true">·</span>
              <span>{chapterLabel}</span>
            </>
          )}
        </div>

        <Link
          to={articleHref}
          className="mt-1.5 group-hover:text-[var(--iapj-link-hover)] transition-colors"
        >
          <h3
            className={cn(
              "font-semibold leading-snug tracking-tight text-[var(--iapj-text-primary)]",
              variant === "large" ? "text-2xl sm:text-[1.75rem]" : "text-xl"
            )}
          >
            {article.title}
          </h3>
        </Link>

        {variant === "large" && (
          <p className="mt-2.5 text-sm leading-relaxed text-[var(--iapj-text-body)] line-clamp-2">
            {article.excerpt}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-[var(--iapj-text-muted)] tabular-nums">
          <span>Created: {article.date}</span>
          {article.updatedDate && (
            <>
              <span aria-hidden="true">·</span>
              <span>Updated: {article.updatedDate}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{article.readTime}</span>
        </div>
      </div>
    </motion.article>
  );
}
