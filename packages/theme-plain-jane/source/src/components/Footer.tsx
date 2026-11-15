import { Link } from "react-router-dom";
import { Github, Globe, Linkedin, Twitter } from "lucide-react";
import { getSiteManifest, resolveLink } from "../lib/mediaResolver";
import { FooterBackdrop3D } from "./FooterBackdrop3D";

function SocialIcon({ id }: { id: string }) {
  switch (id) {
    case "github":
      return <Github className="h-4 w-4" aria-hidden="true" />;
    case "twitter":
      return <Twitter className="h-4 w-4" aria-hidden="true" />;
    case "linkedin":
      return <Linkedin className="h-4 w-4" aria-hidden="true" />;
    default:
      return <Globe className="h-4 w-4" aria-hidden="true" />;
  }
}

export function Footer() {
  const manifest = getSiteManifest();
  const { brand, contact, navigation } = manifest;

  return (
    <footer
      className="relative overflow-hidden border-t border-[var(--iapj-footer-border)] bg-[var(--iapj-footer-bg)] text-[var(--iapj-footer-text)]"
    >
      {/* Opposing-tone 3D sculptural GLB-style backdrop */}
      <FooterBackdrop3D />

      <div className="relative z-10 mx-auto max-w-[var(--iapj-container-max)] px-4 pt-20 pb-12 sm:px-6 lg:px-8 lg:pt-24">
        {/* Main Upper Split */}
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
          {/* Left: Let's Talk & Contact */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                {contact.heading}
              </h2>
              <div className="mt-6 flex flex-col gap-2">
                <a
                  href={resolveLink(contact.emailRef)}
                  className="w-fit text-xl font-normal underline underline-offset-8 decoration-1 hover:opacity-75 transition-opacity sm:text-2xl"
                >
                  {contact.email}
                </a>
                <p className="mt-2 text-base text-[var(--iapj-footer-muted)]">
                  {contact.secondaryLine}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Two Nav Columns + 3x2 Platform Pillars */}
          <div className="lg:col-span-7 flex flex-col gap-14">
            <div className="grid grid-cols-2 gap-8 max-w-md">
              <nav className="flex flex-col gap-3.5" aria-label="Primary footer navigation">
                {navigation.footerPrimary.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="w-fit text-lg font-medium underline underline-offset-4 decoration-1 hover:opacity-70 transition-opacity"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <nav className="flex flex-col gap-3.5" aria-label="Category footer navigation">
                {navigation.footerSecondary.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="w-fit text-lg font-medium underline underline-offset-4 decoration-1 hover:opacity-70 transition-opacity"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* 3x2 Platform Architecture Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3">
              {navigation.footerPillars.map((pillar) => (
                <Link
                  key={pillar.title}
                  to={pillar.path}
                  className="group flex flex-col gap-1.5 w-fit"
                >
                  <span className="text-sm font-semibold tracking-tight group-hover:opacity-75 transition-opacity">
                    {pillar.title}
                  </span>
                  <span className="text-xs text-[var(--iapj-footer-muted)] underline underline-offset-2 decoration-1 leading-relaxed">
                    {pillar.line1}
                    <br />
                    {pillar.line2}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Legal & Social Strip */}
        <div className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-[var(--iapj-footer-border)] pt-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            {contact.socials.map((social) => (
              <a
                key={social.id}
                href={resolveLink(social.urlRef)}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                className="text-[var(--iapj-footer-text)] hover:opacity-70 transition-opacity"
              >
                <SocialIcon id={social.id} />
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--iapj-footer-muted)]">
            <span>
              &copy; 2016&ndash;{new Date().getFullYear()} {brand.copyrightHolder}
            </span>
            {navigation.legalLinks.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="underline underline-offset-4 hover:text-[var(--iapj-footer-text)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
