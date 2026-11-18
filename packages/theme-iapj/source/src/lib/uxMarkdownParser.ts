import type { Author, CategorySlug } from "../data/articles";

export type MarkdownBlock =
  | { type: "heading"; level: 2 | 3; text: string; id: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; language: string; label?: string; content: string }
  | { type: "mermaid"; chart: string }
  | { type: "blockquote"; lines: string[] }
  | { type: "media"; mediaKey: string; alt: string; caption?: string; ratio?: string };

export interface UxGuideEntry {
  slug: string;
  canonicalPath: string;
  title: string;
  excerpt: string;
  coverKey: string;
  coverAlt: string;
  guideCardKey?: string;
  chapterNumber: number;
  date: string;
  updatedDate: string;
  year: string;
  readTime: string;
  category: CategorySlug;
  categoryLabel: string;
  isGuide: boolean;
  tags: string[];
  relatedSlugs: string[];
  topicGroup: "process" | "research" | "craft" | "reference";
  blocks: MarkdownBlock[];
}

const rawModules = import.meta.glob<string>("/src/content/ux-guide/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return "Nov 14, 2026";
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const year = match[1];
  const monthIdx = Math.max(0, Math.min(11, parseInt(match[2], 10) - 1));
  const day = parseInt(match[3], 10);
  return `${months[monthIdx]} ${day}, ${year}`;
}

interface ParsedFrontmatter {
  meta: Record<string, string>;
  nested: Record<string, Record<string, string>>;
  related: string[];
  body: string;
}

function parseFrontmatter(raw: string): ParsedFrontmatter {
  const normalized = raw.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { meta: {}, nested: {}, related: [], body: normalized };
  }
  const endIdx = normalized.indexOf("\n---\n", 4);
  if (endIdx === -1) {
    return { meta: {}, nested: {}, related: [], body: normalized };
  }

  const headerLines = normalized.slice(4, endIdx).split("\n");
  const body = normalized.slice(endIdx + 5).trim();

  const meta: Record<string, string> = {};
  const nested: Record<string, Record<string, string>> = {};
  let related: string[] = [];
  let activeParent: string | null = null;

  for (const line of headerLines) {
    if (!line.trim()) continue;
    if (line.startsWith("  ") && activeParent) {
      const subMatch = line.trim().match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (subMatch) {
        if (!nested[activeParent]) nested[activeParent] = {};
        nested[activeParent][subMatch[1]] = unquote(subMatch[2]);
      }
      continue;
    }

    activeParent = null;
    const topMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!topMatch) continue;
    const key = topMatch[1];
    const val = topMatch[2].trim();

    if (!val) {
      activeParent = key;
      nested[key] = {};
    } else if (key === "related" && val.startsWith("[") && val.endsWith("]")) {
      related = val
        .slice(1, -1)
        .split(",")
        .map((s) => unquote(s))
        .filter(Boolean);
    } else {
      meta[key] = unquote(val);
    }
  }

  return { meta, nested, related, body };
}

function parseMediaDirective(line: string): MarkdownBlock | null {
  const match = line.trim().match(/^::media\{(.+)\}$/);
  if (!match) return null;
  const attrsStr = match[1];
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(attrsStr)) !== null) {
    attrs[m[1]] = m[2];
  }
  return {
    type: "media",
    mediaKey: attrs.key || "",
    alt: attrs.alt || "",
    caption: attrs.caption,
    ratio: attrs.ratio,
  };
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseMarkdownBlocks(body: string): MarkdownBlock[] {
  const lines = body.split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code or mermaid block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      if (lang === "mermaid") {
        blocks.push({ type: "mermaid", chart: codeLines.join("\n") });
      } else {
        blocks.push({ type: "code", language: lang, content: codeLines.join("\n") });
      }
      continue;
    }

    // ::media{...} directive
    if (trimmed.startsWith("::media{")) {
      const mediaBlock = parseMediaDirective(trimmed);
      if (mediaBlock) blocks.push(mediaBlock);
      i++;
      continue;
    }

    // Headings (## or ###)
    if (trimmed.startsWith("### ")) {
      const text = trimmed.slice(4).trim();
      blocks.push({ type: "heading", level: 3, text, id: slugifyHeading(text) });
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      const text = trimmed.slice(3).trim();
      blocks.push({ type: "heading", level: 2, text, id: slugifyHeading(text) });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", lines: quoteLines });
      continue;
    }

    // Markdown table
    if (
      trimmed.startsWith("|") &&
      i + 1 < lines.length &&
      /^\|?[\s:-]+\|/.test(lines[i + 1].trim())
    ) {
      const headers = splitTableRow(trimmed);
      i += 2; // skip header and separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Paragraph (gather until blank line or structural delimiter)
    const paraLines: string[] = [trimmed];
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        !next ||
        next.startsWith("#") ||
        next.startsWith("```") ||
        next.startsWith("::media{") ||
        next.startsWith(">") ||
        next.startsWith("|") ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next)
      ) {
        break;
      }
      paraLines.push(next);
      i++;
    }
    blocks.push({ type: "paragraph", text: paraLines.join(" ") });
  }

  return blocks;
}

function getTopicGroup(chapter: number): "process" | "research" | "craft" | "reference" {
  if ([0, 2, 6, 7].includes(chapter)) return "process";
  if ([1, 3, 4, 5].includes(chapter)) return "research";
  if ([8, 9, 10, 13].includes(chapter)) return "craft";
  return "reference";
}

function getChapterTags(chapter: number, group: string): string[] {
  const base = ["UI/UX Guides"];
  if (group === "process") base.push("UX Strategy");
  if (group === "research") base.push("UX Research");
  if (group === "craft") base.push("Product Craft");
  if (group === "reference") base.push("UX Reference");
  if (chapter === 0) base.push("2026 Working Guide");
  if (chapter === 2) base.push("Agentic UI");
  if (chapter === 4) base.push("Journey Mapping");
  return base;
}

export const uxGuideEntries: UxGuideEntry[] = Object.values(rawModules)
  .map((raw) => {
    const { meta, nested, related, body } = parseFrontmatter(raw);
    const slug = meta.slug || "ux-guide";
    const chapter = parseInt(meta.chapter ?? "0", 10);
    const blocks = parseMarkdownBlocks(body);
    const words = body.split(/\s+/).filter(Boolean).length;
    const readMinutes = Math.max(4, Math.round(words / 215));
    const group = getTopicGroup(chapter);

    return {
      slug,
      canonicalPath: meta.route || (slug === "ux-guide" ? "/blog/ux-guide" : `/blog/ux-guide/${slug}`),
      title: meta.title || slug,
      excerpt: meta.dek || "",
      coverKey: nested.cover?.key || `ux-guide/${slug}-cover`,
      coverAlt: nested.cover?.alt || meta.title || slug,
      guideCardKey: nested.guideCard?.key,
      chapterNumber: Number.isNaN(chapter) ? 0 : chapter,
      date: formatDisplayDate(meta.created),
      updatedDate: formatDisplayDate(meta.updated),
      year: (meta.created || "2026").slice(0, 4),
      readTime: `${readMinutes} min read`,
      category: "ui-ux" as CategorySlug,
      categoryLabel: "UI/UX Guides",
      isGuide: chapter === 0,
      tags: getChapterTags(chapter, group),
      relatedSlugs: related,
      topicGroup: group,
      blocks,
    };
  })
  .sort((a, b) => a.chapterNumber - b.chapterNumber);

export function buildUxGuideArticles(defaultAuthor: Author) {
  return uxGuideEntries.map((entry) => ({
    id: `ux-${entry.chapterNumber}-${entry.slug}`,
    slug: entry.slug,
    canonicalPath: entry.canonicalPath,
    title: entry.title,
    excerpt: entry.excerpt,
    coverImageRef: entry.coverKey,
    date: entry.date,
    updatedDate: entry.updatedDate,
    year: entry.year,
    readTime: entry.readTime,
    category: entry.category,
    categoryLabel: entry.categoryLabel,
    isGuide: entry.isGuide,
    chapterNumber: entry.chapterNumber,
    guideSeries: "ux-guide" as const,
    topicGroup: entry.topicGroup,
    relatedSlugs: entry.relatedSlugs,
    author: defaultAuthor,
    tags: entry.tags,
    sections: [],
    markdownBlocks: entry.blocks,
  }));
}
