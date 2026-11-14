/**
 * Plain Jane Journal preview-only article seed.
 *
 * These drafts are distributable demonstration content, not published platform
 * content_items. The two Growth & Performance identities and SEO descriptions
 * are derived from the approved editorial intake; body copy is sample copy for
 * preview and must be reviewed before publication.
 */
import type { CMSPage, CMSBlock } from "./cms";

export type PreviewEditorial = {
  slug: string;
  title: string;
  excerpt: string;
  seoDescription: string;
  coverAssetId: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  paragraphs: string[];
};

export const previewEditorial: PreviewEditorial[] = [
  {
    slug: "how-to-measure-business-growth-key-performance-metrics",
    title: "How to Measure Business Growth: Key Performance Metrics",
    excerpt: "Learn how to measure business growth with meaningful performance metrics, track changes over time, and use data to guide better decisions.",
    seoDescription: "Learn how to measure business growth with meaningful performance metrics, track changes over time, and use data to guide better decisions.",
    coverAssetId: "asset-growth-metrics-navy",
    category: "Growth & Performance",
    date: "November 14, 2026",
    readTime: "4 min read",
    author: "InnerAnimalMedia Editorial",
    paragraphs: [
      "Business growth has more than one dimension. Revenue matters, but an isolated increase does not show whether that growth is repeatable, profitable, or helpful to customers. Begin by agreeing on the business outcome you want to improve, then select a small number of metrics that explain progress toward it.",
      "Revenue growth compares performance across consistent periods. For a more useful view, separate new customers, repeat purchases, and changes in average order value. Track gross margin alongside revenue so a rise in sales is not mistaken for stronger economics.",
      "Acquisition metrics answer how people find you and what it costs to convert interest into a customer. Conversion rates should be understood in context: measure the steps in the journey, not just the final purchase or sign-up.",
      "Retention and repeat engagement indicate whether the experience keeps creating value after the initial transaction. An expanding customer base with weak retention can obscure a product problem, so measure both acquisition and returning-customer activity.",
      "Use the same metric definitions and time windows each reporting period. Annotate unusual promotions, launches, and seasonal effects. A useful dashboard makes tradeoffs visible and helps a team decide what to change next.",
      "Start with a baseline, set a review cadence, and identify who owns each metric. Healthy measurement is not about displaying the most impressive chart: it is about making better decisions with evidence."
    ]
  },
  {
    slug: "sustainable-business-growth-strategies-lasting-momentum",
    title: "Sustainable Business Growth: Strategies for Lasting Momentum",
    excerpt: "Explore sustainable business growth strategies that build lasting momentum through clear priorities, scalable systems, and consistent execution.",
    seoDescription: "Explore sustainable business growth strategies that build lasting momentum through clear priorities, scalable systems, and consistent execution.",
    coverAssetId: "asset-growth-strategy-green",
    category: "Growth & Performance",
    date: "November 14, 2026",
    readTime: "4 min read",
    author: "InnerAnimalMedia Editorial",
    paragraphs: [
      "Lasting growth is built through a sequence of deliberate improvements rather than a single dramatic campaign. The goal is to expand what works without creating a level of complexity that the business cannot support.",
      "Begin with clear priorities. Pick the customer problem, offer, and channel that deserve attention now. Keeping the number of active initiatives small makes progress easier to measure and frees teams to finish work rather than constantly start new work.",
      "Build reusable systems around the tasks that recur: content production, customer support, fulfillment, reporting, and quality checks. Document decisions and automate carefully, preserving a way for people to inspect and correct the result.",
      "Treat customer experience as part of the growth model. Understand the reasons customers return, where they encounter friction, and which improvements produce real value. Retention gives acquisition efforts a stronger foundation.",
      "Protect the fundamentals as you scale. Capacity, cash flow, quality, and team focus matter as much as the next opportunity. Growth that depends on constant emergency effort is difficult to sustain.",
      "Review results on a consistent cadence, keep what works, and retire what does not. Momentum becomes durable when strategy, operations, and customer value reinforce one another."
    ]
  },
  {
    slug: "morning-rituals",
    title: "Morning Rituals That Actually Work",
    excerpt: "Beyond the 5 AM club: finding a morning routine that respects your natural rhythms rather than fighting them.",
    seoDescription: "A gentle introduction to morning rituals and building a routine that fits your life.",
    coverAssetId: "asset-cover-morning",
    category: "Lifestyle",
    date: "September 15, 2023",
    readTime: "2 min read",
    author: "Jane Doe",
    paragraphs: [
      "The most useful morning ritual is one that works with the life you actually live. Start by noticing what helps you feel ready for the day, rather than copying an idealized schedule.",
      "A short routine can be enough: a calm moment, a clear priority, and space to begin without rushing. Keep it simple so you can adjust it over time.",
      "This is a sample article supplied with the theme preview. Replace it with your own writing before publishing."
    ]
  },
  {
    slug: "architecture-of-silence",
    title: "The Architecture of Silence",
    excerpt: "Exploring spaces designed specifically to cultivate quiet and reflection in modern cities.",
    seoDescription: "A short editorial preview about quiet spaces and thoughtful architectural design.",
    coverAssetId: "asset-cover-silence",
    category: "Design",
    date: "August 30, 2023",
    readTime: "2 min read",
    author: "Jane Doe",
    paragraphs: [
      "Quiet is not merely the absence of sound. Materials, proportions, light, and the distance between spaces can influence how a place feels.",
      "A thoughtful interior offers places to pause without demanding attention. The simplest spaces can leave the deepest impressions when each design choice serves a purpose.",
      "This is a sample article supplied with the theme preview. Replace it with your own writing before publishing."
    ]
  },
  {
    slug: "taste-of-memory",
    title: "The Taste of Memory",
    excerpt: "How a simple bowl of broth transported me back to a rainy afternoon in Kyoto.",
    seoDescription: "A short food-and-memory editorial preview for the Plain Jane Journal starter.",
    coverAssetId: "asset-cover-memory",
    category: "Food",
    date: "August 12, 2023",
    readTime: "2 min read",
    author: "Jane Doe",
    paragraphs: [
      "A familiar aroma can make a distant moment feel close again. Food often keeps a record of places, people, and small details that photographs cannot fully capture.",
      "The meaning of a meal is not always in its ingredients. It may be in the weather, the conversation, or simply having enough time to notice.",
      "This is a sample article supplied with the theme preview. Replace it with your own writing before publishing."
    ]
  }
];

function makeBlock(sectionId: string, slug: string, definitionKey: string, order: number, content: Record<string, unknown>): CMSBlock {
  return {
    id: ["blk", slug, String(order)].join("-"),
    section_id: sectionId,
    definition_key: definitionKey,
    version: "1.0.0",
    template_sku: "tpl-" + definitionKey + "-default",
    block_order: order,
    content_json: content,
    status: "active"
  };
}

export function previewEditorialPages(siteSlug: string): CMSPage[] {
  return previewEditorial.map(entry => {
    const pageId = "page-journal-post-" + entry.slug;
    const bodyId = "sec-" + entry.slug + "-body";
    return {
      id: pageId,
      site_id: "site-plain-jane",
      project_slug: siteSlug,
      page_type: "post",
      slug: entry.slug,
      title: entry.title,
      status: "draft",
      created_at: 1794614400,
      updated_at: 1794614400,
      published_at: null,
      seo_json: {
        title: entry.title + " — Plain Jane Journal",
        description: entry.seoDescription,
        og_image_asset_id: entry.coverAssetId
      },
      og_image_asset_id: entry.coverAssetId,
      metadata: {
        date: entry.date,
        category: entry.category,
        read_time: entry.readTime,
        cover_asset_id: entry.coverAssetId,
        editorial_status: "preview-draft",
        source: "theme-package-seed"
      },
      sections: [
        {
          id: "sec-" + entry.slug + "-hero",
          page_id: pageId,
          definition_key: "journal-post-hero",
          version: "1.0.0",
          template_sku: "tpl-journal-post-hero-default",
          section_order: 1,
          section_data: {},
          status: "active",
          blocks: []
        },
        {
          id: bodyId,
          page_id: pageId,
          definition_key: "journal-post-body",
          version: "1.0.0",
          template_sku: "tpl-journal-post-body-default",
          section_order: 2,
          section_data: { prose_width: "max-w-3xl" },
          status: "active",
          blocks: [
            makeBlock(bodyId, entry.slug, "journal-lead-paragraph", 1, { text: entry.excerpt }),
            ...entry.paragraphs.map((text, index) => makeBlock(bodyId, entry.slug, "journal-text-block", index + 2, { text }))
          ]
        }
      ]
    };
  });
}

export function previewEditorialCards(sectionId: string): CMSBlock[] {
  return previewEditorial.slice(0, 2).map((entry, index) => ({
    id: "blk-home-growth-" + (index + 1),
    section_id: sectionId,
    definition_key: "journal-article-card",
    version: "1.0.0",
    template_sku: "tpl-journal-article-card-standard",
    block_order: index + 1,
    status: "active",
    content_json: {
      slug: entry.slug,
      title: entry.title,
      excerpt: entry.excerpt,
      date: entry.date,
      read_time: entry.readTime,
      category: entry.category,
      cover_asset_id: entry.coverAssetId,
      author_name: entry.author,
      author_avatar_asset_id: "asset-author-avatar",
      featured: false
    }
  }));
}
