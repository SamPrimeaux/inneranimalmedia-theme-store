export function normalizePreviewHtml(html: string, slug: string, version: string, options?: { spaFallback?: boolean }): string;
export function normalizePreviewManifest(
  manifest: { schema: string; slug: string; version: string; files: Array<{ path: string; sha256: string }> },
  htmlByPath: Record<string, string>,
  slug: string,
  version: string
): Promise<{ schema: string; slug: string; version: string; files: Array<{ path: string; sha256: string }> }>;
