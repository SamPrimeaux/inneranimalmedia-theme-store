import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MANIFEST_UPDATE_EVENT,
  resolveBrandLogo,
  type BrandLogoConfig,
} from "../lib/mediaResolver";
import { cn } from "../lib/utils";

interface BrandLogoProps {
  surface?: "auto" | "light" | "dark";
  override?: Partial<BrandLogoConfig>;
  onClick?: () => void;
  className?: string;
}

export function BrandLogo({
  surface = "auto",
  override,
  onClick,
  className,
}: BrandLogoProps) {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const handleManifestUpdate = () => setVersion((v) => v + 1);
    window.addEventListener(MANIFEST_UPDATE_EVENT, handleManifestUpdate);

    // Watch <html data-theme="..."> updates so auto icon variant swaps cleanly
    const observer =
      surface === "auto" && typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => setVersion((v) => v + 1))
        : null;

    if (observer && typeof document !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    }

    return () => {
      window.removeEventListener(MANIFEST_UPDATE_EVENT, handleManifestUpdate);
      observer?.disconnect();
    };
  }, [surface]);

  const logo = resolveBrandLogo(surface, override);
  const [iconImgError, setIconImgError] = useState(false);
  const [fullLogoImgError, setFullLogoImgError] = useState(false);

  useEffect(() => {
    setIconImgError(false);
  }, [logo.iconSrc]);

  useEffect(() => {
    setFullLogoImgError(false);
  }, [logo.fullLogoSrc]);

  const caseClass =
    logo.wordmarkCase === "lowercase"
      ? "lowercase"
      : logo.wordmarkCase === "uppercase"
      ? "uppercase"
      : "";

  const canRenderFullLogo =
    logo.mode === "full-logo" && Boolean(logo.fullLogoSrc) && !fullLogoImgError;

  const canRenderIconImg =
    logo.showIcon && Boolean(logo.iconSrc) && !iconImgError;

  const canRenderIconSvg =
    logo.showIcon && !canRenderIconImg && Boolean(logo.iconSvgPath);

  return (
    <Link
      to={logo.href}
      onClick={onClick}
      aria-label={!logo.showWordmark || canRenderFullLogo ? logo.wordmark : undefined}
      className={cn(
        "flex items-center gap-2.5 whitespace-nowrap shrink-0",
        className
      )}
    >
      {canRenderFullLogo ? (
        <img
          src={logo.fullLogoSrc}
          alt={logo.fullLogoAlt}
          referrerPolicy="no-referrer"
          onError={() => setFullLogoImgError(true)}
          style={{ height: `${logo.fullLogoHeightPx}px` }}
          className="w-auto object-contain shrink-0"
        />
      ) : (
        <>
          {canRenderIconImg && (
            <img
              src={logo.iconSrc}
              alt={logo.iconAlt}
              referrerPolicy="no-referrer"
              onError={() => setIconImgError(true)}
              style={{
                width: `${logo.iconSizePx}px`,
                height: `${logo.iconSizePx}px`,
              }}
              className="object-contain shrink-0"
            />
          )}

          {canRenderIconSvg && (
            <svg
              viewBox={logo.iconSvgViewBox}
              style={{
                width: `${logo.iconSizePx}px`,
                height: `${logo.iconSizePx}px`,
              }}
              className="fill-current shrink-0"
              aria-hidden="true"
            >
              <path d={logo.iconSvgPath} />
            </svg>
          )}

          {logo.showWordmark && logo.wordmark && (
            <span className={cn("text-xl font-bold tracking-tight", caseClass)}>
              {logo.wordmark}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
