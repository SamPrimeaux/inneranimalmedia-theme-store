export interface ThemeReleaseRef {slug:string; version:string; release:{status:string;sha256:string|null;storageKey:string|null}}
export interface InstallIndexEntry {slug:string;version:string;sha256:string;project_sha256:string;project_key:string;page_count:number;manifest_page_count:number;project_url:string}
export function verifiedInstallEntries(raw: unknown, themes: ThemeReleaseRef[]): InstallIndexEntry[];

export function hasEditableInstallProject(theme: ThemeReleaseRef, entries: InstallIndexEntry[] | null): boolean;
