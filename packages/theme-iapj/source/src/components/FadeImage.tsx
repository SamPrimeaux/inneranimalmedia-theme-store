import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "../lib/utils";

interface FadeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
}

export function FadeImage({ className, src, alt, fallbackLabel, ...props }: FadeImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setHasError(false);
    if (!src) {
      setHasError(true);
      return;
    }
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt || fallbackLabel || "Editorial image placeholder"}
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--iapj-surface-subtle)] p-6 text-center text-[var(--iapj-text-muted)] border border-[var(--iapj-border)]",
          className
        )}
      >
        <ImageIcon className="h-5 w-5 opacity-50" strokeWidth={1.5} aria-hidden="true" />
        {(fallbackLabel || alt) && (
          <span className="max-w-xs font-serif text-sm italic text-[var(--iapj-text-muted)]">
            {fallbackLabel || alt}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={cn(
        "transition-all duration-700 ease-out",
        isLoaded ? "opacity-100 blur-0" : "opacity-0 blur-md",
        className
      )}
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
