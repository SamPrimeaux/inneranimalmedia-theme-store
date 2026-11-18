import { motion } from "motion/react";

interface QuoteEmbedProps {
  quote: string;
  author?: string;
  source?: string;
}

export function QuoteEmbed({ quote, author, source }: QuoteEmbedProps) {
  return (
    <motion.blockquote
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="my-16 mx-auto max-w-3xl border-y border-[var(--iapj-border)] py-8 px-2"
    >
      <p className="font-serif text-2xl italic leading-relaxed text-[var(--iapj-text-primary)] md:text-3xl">
        &ldquo;{quote}&rdquo;
      </p>
      {(author || source) && (
        <footer className="mt-6 flex items-center gap-2 text-xs font-medium tracking-wider text-[var(--iapj-text-muted)]">
          {author && <span>{author}</span>}
          {author && source && <span aria-hidden="true">·</span>}
          {source && <cite className="italic">{source}</cite>}
        </footer>
      )}
    </motion.blockquote>
  );
}
