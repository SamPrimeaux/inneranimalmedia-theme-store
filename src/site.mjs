// Theme Store site document: bundled defaults + an optional published override.
// The override is plain data (copy + color tokens). It can never add keys,
// change shapes, or inject markup/CSS: every value is validated against the
// default document, and anything invalid falls back to the default.
const MAX_TEXT = 600;
const COLOR = /^#[0-9a-fA-F]{6}$/;
const HREF = /^(https:\/\/[^\s"'<>]+|\/[^\s"'<>]*)$/;

function cleanString(path, value, fallback) {
  if (typeof value !== 'string') return fallback;
  const text = value.trim();
  if (!text || text.length > MAX_TEXT) return fallback;
  const key = path.at(-1);
  if (path[0] === 'tokens') return COLOR.test(text) ? text : fallback;
  if (typeof key === 'string' && /href$/i.test(key)) return HREF.test(text) ? text : fallback;
  return text;
}

function merge(path, base, over) {
  if (typeof base === 'string') return cleanString(path, over, base);
  if (Array.isArray(base)) {
    return base.map((item, i) => merge([...path, i], item, Array.isArray(over) ? over[i] : undefined));
  }
  if (base && typeof base === 'object') {
    const src = over && typeof over === 'object' && !Array.isArray(over) ? over : {};
    return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, k === 'schema' ? v : merge([...path, k], v, src[k])]));
  }
  return base;
}

/** Merge a published override onto the defaults. Never throws. */
export function resolveSite(defaults, override) {
  return merge([], defaults, override);
}
