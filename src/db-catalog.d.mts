import type { ThemeRecord } from './catalog';
type Source = Omit<ThemeRecord,'previewUrl'>;
export function loadThemeCatalog(db: D1Database | undefined, descriptors?: Source[]): Promise<{themes:Source[];releases:{slug:string;version:string;sha256:string}[]}>;
