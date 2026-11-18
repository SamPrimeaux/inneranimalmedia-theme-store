import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { Lightbox } from "./Lightbox";
import { FadeImage } from "./FadeImage";

interface ImageEmbedProps {
  src: string;
  alt: string;
  caption?: string;
  size?: "default" | "wide" | "full";
}

export function ImageEmbed({ src, alt, caption, size = "default" }: ImageEmbedProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <>
      <motion.figure
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "my-16 mx-auto",
          size === "default" && "max-w-4xl px-4 sm:px-6 lg:px-8",
          size === "wide" && "max-w-6xl px-4 sm:px-6 lg:px-8",
          size === "full" && "w-full max-w-none"
        )}
      >
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="block w-full overflow-hidden bg-[var(--iapj-surface-subtle)] cursor-zoom-in group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--iapj-accent)]"
        >
          <FadeImage
            src={src}
            alt={alt}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </button>
        {caption && (
          <figcaption className="mt-4 text-center text-sm italic text-[var(--iapj-text-muted)] max-w-2xl mx-auto px-4">
            {caption}
          </figcaption>
        )}
      </motion.figure>

      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        src={src}
        alt={alt}
        caption={caption}
      />
    </>
  );
}
