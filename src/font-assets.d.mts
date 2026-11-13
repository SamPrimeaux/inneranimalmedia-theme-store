export function serveFontAssets(
  request: Request,
  env: { THEME_PACKAGES: R2Bucket },
): Promise<Response>;
