import defaults from './footer.default.json' with { type: 'json' };

// This is a delivery projection of cms_page_sections + cms_section_blocks.
// The persisted CMS rows are the editable authority; the Worker serves only
// validated, explicitly published R2 snapshots.
const TYPES = new Set(['cta', 'contact', 'group', 'link', 'social-group', 'social-link', 'utilities', 'copyright', 'attribution']);
const SIMPLE = /^[a-z0-9][a-z0-9_-]{0,95}$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;
const TARGET = /^(https:\/\/[^\s"'<>]+|\/[^\s"'<>]*|#[a-zA-Z0-9_-]+|mailto:[^\s"'<>@]+@[^\s"'<>@]+|tel:\+?[0-9-]+)$/;
const URL = /^https:\/\/[^\s"'<>]+$/;
const SECTION_FIELDS = {
  background: 'color', foreground: 'color', muted: 'color', divider: 'color',
  width: 'width', glb_enabled: 'bool', glb_url: 'url',
  glb_opacity: 'opacity', glb_tint: 'color', glb_rotation: 'bool',
};
const TEXT_FIELDS = new Set(['eyebrow','heading','description','primary_label','secondary_label',
  'logo_alt','brand_label','email','phone','label','icon','text']);
const HREF_FIELDS = new Set(['href','primary_href','secondary_href','phone_href']);
const IMAGE_FIELDS = new Set(['logo_url','icon_url']);
const BOOL_FIELDS = new Set(['enabled']);

function str(value, fallback = '', max = 300) {
  return typeof value === 'string' && value.trim().length <= max ? value.trim() : fallback;
}
function cleanField(key, value, fallback = '') {
  if (BOOL_FIELDS.has(key)) return typeof value === 'boolean' ? value : fallback;
  if (HREF_FIELDS.has(key)) {
    const s = str(value, fallback, 600);
    return s === '' || TARGET.test(s) ? s : fallback;
  }
  if (IMAGE_FIELDS.has(key)) {
    const s = str(value, fallback, 600);
    return s === '' || URL.test(s) ? s : fallback;
  }
  if (TEXT_FIELDS.has(key)) return str(value, fallback, key === 'description' ? 1000 : 350);
  return fallback;
}
function sectionSettings(source) {
  const input = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
  return Object.fromEntries(Object.entries(SECTION_FIELDS).map(([key,kind]) => {
    const fallback = defaults.section.settings[key];
    const value = input[key];
    let normalized = fallback;
    if (kind === 'bool' && typeof value === 'boolean') normalized = value;
    else if (kind === 'color' && typeof value === 'string' && COLOR.test(value)) normalized = value;
    else if (kind === 'url' && typeof value === 'string' && (value === '' || URL.test(value))) normalized = value;
    else if (kind === 'width' && typeof value === 'string' && /^(?:[5-9][0-9]{2}|1[0-9]{3})px$/.test(value)) normalized = value;
    else if (kind === 'opacity' && typeof value === 'number' && Number.isFinite(value)) normalized = Math.min(0.25, Math.max(0, value));
    return [key, normalized];
  }));
}
function blockSettings(type, input) {
  const obj = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const result = {};
  for (const [key,value] of Object.entries(obj)) {
    if (TEXT_FIELDS.has(key) || HREF_FIELDS.has(key) || IMAGE_FIELDS.has(key) || BOOL_FIELDS.has(key)) {
      result[key] = cleanField(key,value, typeof value === 'boolean' ? false : '');
    }
  }
  if (type === 'social-link' && !['facebook','instagram','youtube'].includes(result.icon)) result.icon = 'facebook';
  return result;
}
function cleanBlocks(input) {
  if (!Array.isArray(input)) return defaults.blocks;
  const keys = new Set();
  const blocks = [];
  for (const source of input.slice(0,110)) {
    if (!source || typeof source !== 'object' || !SIMPLE.test(source.key) || !TYPES.has(source.type) || keys.has(source.key)) continue;
    keys.add(source.key);
    blocks.push({
      key:source.key, type:source.type,
      parent: typeof source.parent === 'string' && SIMPLE.test(source.parent) ? source.parent : null,
      order: Number.isInteger(source.order) ? Math.max(0,Math.min(10000,source.order)) : 100,
      settings:blockSettings(source.type,source.settings)
    });
  }
  // Only permit one level of child nesting: navigation / social / utility group blocks.
  const parents = new Map(blocks.filter(b=>['group','social-group','utilities'].includes(b.type) && b.parent === null).map(b=>[b.key,b]));
  return blocks.filter(b=>b.parent === null || (parents.has(b.parent) && b.parent !== b.key));
}
export function normalizeFooter(input) {
  if (!input || typeof input !== 'object' || input.schema !== defaults.schema) return structuredClone(defaults);
  return {
    schema: defaults.schema,
    section: { id: defaults.section.id, type:'global-footer', settings:sectionSettings(input.section?.settings) },
    blocks:cleanBlocks(input.blocks)
  };
}
export function footerFromCmsRows(section, rows) {
  if (!section || section.section_type !== 'global-footer') throw new Error('global-footer CMS section missing');
  const settings = JSON.parse(section.section_data || '{}');
  const blocks = rows.map(row => ({
    key:row.block_key,
    type:row.block_type,
    parent:row.parent_block_key || null,
    order:row.sort_order,
    settings:JSON.parse(row.settings_json || '{}')
  })).filter(b => b.type && b.key && (!b.parent || rows.some(r=>r.block_key===b.parent)));
  return normalizeFooter({schema:defaults.schema,section:{settings},blocks});
}
export const defaultFooter = normalizeFooter(defaults);
