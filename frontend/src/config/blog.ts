import type { BlogPostStatus, BlogTwitterCardType } from '../types/blog';

export type BlogSeoPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  author: string;
  status: BlogPostStatus;
  visibility: 'public' | 'private';
  featuredImage?: string;
  imageAlt?: string;
  twitterCardType?: BlogTwitterCardType;
};

export const blogPosts: BlogSeoPost[] = [
  {
    slug: 'australia-visitor-visa-subclass-600-document-checklist',
    title: 'Australia Visitor Visa (Subclass 600): Document Checklist for Faster Review',
    excerpt: 'A practical checklist to help you submit complete, consistent, and compliant visitor visa documentation.',
    category: 'Visitor Visa',
    tags: ['Subclass 600', 'Checklist'],
    publishedAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-04-09T00:00:00.000Z',
    readingTime: '7 min read',
    author: 'Global Visas Editorial Team',
    status: 'published',
    visibility: 'public',
    featuredImage: '/og-image.svg',
    imageAlt: 'Organized documentation helps reduce avoidable review delays.',
    twitterCardType: 'summary_large_image'
  },
  {
    slug: 'eta-601-vs-evisitor-651-which-one-to-choose',
    title: 'ETA 601 vs eVisitor 651: Which Australian Travel Visa Should You Choose?',
    excerpt: 'Understand eligibility, validity, and travel use-cases so you can choose the right short-stay pathway.',
    category: 'Travel Planning',
    tags: ['ETA 601', 'eVisitor 651'],
    publishedAt: '2026-03-12T00:00:00.000Z',
    updatedAt: '2026-03-12T00:00:00.000Z',
    readingTime: '6 min read',
    author: 'Global Visas Editorial Team',
    status: 'published',
    visibility: 'public',
    twitterCardType: 'summary_large_image'
  },
  {
    slug: 'how-to-write-a-strong-genuine-temporary-entrant-statement',
    title: 'How to Write a Strong Genuine Temporary Entrant Statement',
    excerpt: 'Clear writing framework and common pitfalls to avoid when preparing your application narrative.',
    category: 'Application Tips',
    tags: ['GTE', 'Best Practices'],
    publishedAt: '2026-03-04T00:00:00.000Z',
    updatedAt: '2026-03-04T00:00:00.000Z',
    readingTime: '8 min read',
    author: 'Global Visas Editorial Team',
    status: 'scheduled',
    visibility: 'public',
    twitterCardType: 'summary'
  },
  {
    slug: 'common-reasons-visitor-visas-are-delayed',
    title: '5 Common Reasons Visitor Visa Applications Are Delayed',
    excerpt: 'Learn the most frequent causes of processing delays and proactive steps that reduce rework.',
    category: 'Policy & Process',
    tags: ['Processing', 'Avoid Delays'],
    publishedAt: '2026-02-27T00:00:00.000Z',
    updatedAt: '2026-02-27T00:00:00.000Z',
    readingTime: '5 min read',
    author: 'Global Visas Editorial Team',
    status: 'archived',
    visibility: 'public',
    twitterCardType: 'summary'
  }
];

export const isPublishedPost = (post: BlogSeoPost, now = new Date()): boolean =>
  post.status === 'published' && post.visibility === 'public' && new Date(post.publishedAt).getTime() <= now.getTime();

export const getBlogPostBySlug = (slug: string): BlogSeoPost | undefined => blogPosts.find((post) => post.slug === slug);
