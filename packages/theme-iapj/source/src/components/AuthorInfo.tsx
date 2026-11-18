import type { Author } from "../data/articles";
import { resolveMedia, resolveLink } from "../lib/mediaResolver";
import { FadeImage } from "./FadeImage";

interface AuthorInfoProps {
  author: Author;
}

export function AuthorInfo({ author }: AuthorInfoProps) {
  const avatar = resolveMedia(author.avatarRef);

  return (
    <div className="mt-24 border-t border-[var(--iapj-border)] pt-12">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[var(--iapj-surface-subtle)]">
          <FadeImage
            src={avatar.src}
            alt={avatar.alt || author.name}
            className="h-full w-full object-cover grayscale"
          />
        </div>
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <h3 className="font-serif text-2xl font-medium tracking-tight text-[var(--iapj-text-primary)]">
            Written by {author.name}
          </h3>
          <p className="mt-3 max-w-md text-[var(--iapj-text-body)] leading-relaxed">
            {author.bio}
          </p>
          <div className="mt-4 flex flex-wrap gap-5 text-xs font-medium tracking-wider text-[var(--iapj-text-muted)]">
            {author.socials.map((social) => (
              <a
                key={social.id}
                href={resolveLink(social.urlRef)}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--iapj-text-primary)] transition-colors"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
