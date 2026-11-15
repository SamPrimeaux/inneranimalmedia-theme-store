import { motion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { getSiteManifest, resolveLink, resolveMedia } from "../lib/mediaResolver";
import { FadeImage } from "../components/FadeImage";

export function About() {
  const manifest = getSiteManifest();
  const { author, contact } = manifest;
  const portrait = resolveMedia(author.portraitRef);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--iapj-bg)] text-[var(--iapj-text-primary)]">
      <Header />
      <main className="flex-1">
        <article className="mx-auto max-w-[var(--iapj-container-max)] px-4 py-14 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row gap-12 lg:gap-20 items-start"
          >
            <div className="w-full md:w-5/12">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl iapj-clay-card sticky top-28">
                <FadeImage
                  src={portrait.src}
                  alt={portrait.alt || author.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="w-full md:w-7/12 flex flex-col justify-center pt-2 md:pt-0">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--iapj-text-primary)] mb-8 tracking-tight">
                {author.aboutHeading}
              </h1>
              <div className="prose prose-lg iapj-prose prose-p:leading-relaxed">
                <p className="text-2xl font-serif italic text-[var(--iapj-text-primary)] mb-8 leading-snug">
                  {author.bio}
                </p>
                {author.aboutParagraphs.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-14 pt-10 border-t border-[var(--iapj-border)]">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--iapj-text-muted)] mb-6">
                  {contact.heading}
                </h2>
                <div className="flex flex-col gap-3.5">
                  <a
                    href={resolveLink(contact.emailRef)}
                    className="text-lg font-medium text-[var(--iapj-text-primary)] underline underline-offset-4 hover:opacity-75 transition-opacity w-fit"
                  >
                    {contact.email}
                  </a>
                  <div className="mt-2 flex flex-wrap gap-6">
                    {contact.socials.map((social) => (
                      <a
                        key={social.id}
                        href={resolveLink(social.urlRef)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-[var(--iapj-text-body)] hover:text-[var(--iapj-text-primary)] transition-colors"
                      >
                        {social.label}: {social.handle}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
