import { useState, useEffect, useRef } from "react";
import { cn } from "../lib/utils";

const fallbackImage = import.meta.env.BASE_URL.replace(/\/?$/, "/") + "images/cover-slow-travel.svg";

/** Never leave an article card transparent when an image fails to load. */
export function FadeImage({ className, src, onLoad, onError, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setResolvedSrc(src);
    setIsLoaded(false);
  }, [src]);

  useEffect(() => {
    if (imgRef.current?.complete && (imgRef.current.naturalWidth || 0) > 0) {
      setIsLoaded(true);
    }
  }, [resolvedSrc]);

  return (
    <img
      {...props}
      ref={imgRef}
      src={resolvedSrc}
      className={cn("transition-all duration-700 ease-out", isLoaded ? "opacity-100 blur-0" : "opacity-70 blur-0", className)}
      onLoad={event => { setIsLoaded(true); onLoad?.(event); }}
      onError={event => {
        if (resolvedSrc !== fallbackImage) setResolvedSrc(fallbackImage);
        else setIsLoaded(true);
        onError?.(event);
      }}
    />
  );
}
