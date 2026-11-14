export interface Author {
  name: string;
  avatar: string;
  bio: string;
  twitter?: string;
  instagram?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  date: string;
  readTime: string;
  author: Author;
  tags: string[];
  content?: string; // We'll use components for the actual content rendering in the Post view, but this could hold markdown
}

const localImage = (name: string) => import.meta.env.BASE_URL.replace(/\/?$/, "/") + "images/" + name + ".svg";

export const defaultAuthor: Author = {
  name: "Jane Doe",
  avatar: localImage("author-avatar"),
  bio: "Documenting the quiet moments between the noise. A journal of travel, photography, and finding meaning in the everyday.",
  twitter: "@janedoe",
  instagram: "@jane.captures"
};

export const articles: Article[] = [
  {
    id: "growth-metrics",
    slug: "how-to-measure-business-growth-key-performance-metrics",
    title: "How to Measure Business Growth: Key Performance Metrics",
    excerpt: "Learn how to measure business growth with meaningful performance metrics, track changes over time, and use data to guide better decisions.",
    coverImage: localImage("how-to-measure-business-growth-key-performance-metrics-navy-chart"),
    date: "November 14, 2026", readTime: "4 min read",
    author: { ...defaultAuthor, name: "InnerAnimalMedia Editorial" },
    tags: ["Growth & Performance", "Analytics"]
  },
  {
    id: "growth-sustainable",
    slug: "sustainable-business-growth-strategies-lasting-momentum",
    title: "Sustainable Business Growth: Strategies for Lasting Momentum",
    excerpt: "Explore sustainable business growth strategies that build lasting momentum through clear priorities, scalable systems, and consistent execution.",
    coverImage: localImage("sustainable-business-growth-strategies-lasting-momentum-green-chart"),
    date: "November 14, 2026", readTime: "4 min read",
    author: { ...defaultAuthor, name: "InnerAnimalMedia Editorial" },
    tags: ["Growth & Performance", "Strategy"]
  },
  {
    id: "1",
    slug: "the-art-of-slow-travel",
    title: "The Art of Slow Travel: Finding Meaning in the In-Between",
    excerpt: "Why rushing from landmark to landmark is ruining our ability to truly experience the world around us.",
    coverImage: localImage("cover-slow-travel"),
    date: "October 12, 2023",
    readTime: "8 min read",
    author: defaultAuthor,
    tags: ["Travel", "Mindfulness", "Photography"]
  },
  {
    id: "2",
    slug: "analog-photography-digital-age",
    title: "Embracing Analog in a Hyper-Digital Age",
    excerpt: "There is something profoundly grounding about the mechanical click of a shutter and the anticipation of developing film.",
    coverImage: localImage("cover-analog"),
    date: "September 28, 2023",
    readTime: "5 min read",
    author: defaultAuthor,
    tags: ["Photography", "Culture"]
  },
  {
    id: "3",
    slug: "morning-rituals",
    title: "Morning Rituals That Actually Work",
    excerpt: "Beyond the 5 AM club: finding a morning routine that respects your natural rhythms rather than fighting them.",
    coverImage: localImage("cover-morning"),
    date: "September 15, 2023",
    readTime: "6 min read",
    author: defaultAuthor,
    tags: ["Lifestyle", "Wellness"]
  },
  {
    id: "4",
    slug: "architecture-of-silence",
    title: "The Architecture of Silence",
    excerpt: "Exploring spaces designed specifically to cultivate quiet and reflection in modern cities.",
    coverImage: localImage("cover-silence"),
    date: "August 30, 2023",
    readTime: "10 min read",
    author: defaultAuthor,
    tags: ["Design", "Architecture", "Essays"]
  },
  {
    id: "5",
    slug: "taste-of-memory",
    title: "The Taste of Memory",
    excerpt: "How a simple bowl of broth transported me back to a rainy afternoon in Kyoto.",
    coverImage: localImage("cover-memory"),
    date: "August 12, 2023",
    readTime: "4 min read",
    author: defaultAuthor,
    tags: ["Food", "Memoir"]
  }
];
