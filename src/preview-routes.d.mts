export function resolveDemoAlias(pathname: string, themes: {slug: string;version: string}[]): string | null;
export function publicDemoUrl(origin: string, slug: string): string;

export function normalizeReleaseAssetRelative(relative: string, slug: string, version: string): string;
