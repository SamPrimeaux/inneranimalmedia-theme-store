import { motion } from "motion/react";
import { useState } from "react";
import { photographyRefs } from "../data/articles";
import { resolveMedia } from "../lib/mediaResolver";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Lightbox } from "../components/Lightbox";
import { FadeImage } from "../components/FadeImage";

export function Photography() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const photos = photographyRefs.map((ref) => resolveMedia(ref));

  return (
    <div className="flex min-h-screen flex-col bg-[var(--iapj-bg)] text-[var(--iapj-text-primary)]">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[var(--iapj-container-max)] px-4 py-14 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <p className="mb-3 text-xs font-medium tracking-wider text-[var(--iapj-text-muted)]">
              Portfolio &amp; Visual Plates
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--iapj-text-primary)] sm:text-6xl">
              Selected Work &amp; Hardware Studies
            </h1>
            <p className="mt-4 text-lg text-[var(--iapj-text-body)] max-w-2xl leading-relaxed">
              Industrial enclosures, architectural studies, design system specimens, and mechanical assemblies produced for InnerAnimalMedia and AgentSam.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, idx) => (
              <motion.button
                type="button"
                key={photographyRefs[idx]}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "80px" }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.06 }}
                onClick={() => setSelectedIndex(idx)}
                className={`group relative overflow-hidden rounded-2xl iapj-clay-card cursor-zoom-in text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--iapj-accent)] ${
                  idx === 0 || idx === 4 ? "sm:col-span-2 aspect-[16/9]" : "aspect-[4/3]"
                }`}
              >
                <FadeImage
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="text-[var(--iapj-media-ink)] text-lg font-semibold tracking-tight">
                      {photo.caption}
                    </p>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </main>
      <Footer />

      <Lightbox
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        src={selectedIndex !== null ? photos[selectedIndex].src : ""}
        alt={selectedIndex !== null ? photos[selectedIndex].alt : ""}
        caption={selectedIndex !== null ? photos[selectedIndex].caption : ""}
      />
    </div>
  );
}
