export interface FooterBlock {
  key: string;
  type: 'cta'|'contact'|'group'|'link'|'social-group'|'social-link'|'utilities'|'copyright'|'attribution';
  parent: string | null;
  order: number;
  settings: Record<string, string | boolean>;
}
export interface FooterData {
  schema: string;
  section: {
    id: string;
    type: 'global-footer';
    settings: {
      background: string; foreground: string; muted: string; divider: string; width: string;
      glb_enabled: boolean; glb_url: string; glb_opacity: number; glb_tint: string; glb_rotation: boolean;
    };
  };
  blocks: FooterBlock[];
}
export function normalizeFooter(input: unknown): FooterData;
export function footerFromCmsRows(section: Record<string, unknown>, rows: Record<string, unknown>[]): FooterData;
export const defaultFooter: FooterData;
