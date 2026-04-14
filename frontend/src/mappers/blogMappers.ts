import type { BlogCategory, BlogPost, BlogPostStatus } from '../types/blog';

export type BlogPostDto = {
  id: string;
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
  contentHtml?: string;
};

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

const parseReadingMinutes = (readingTime: string): number | undefined => {
  const match = readingTime.match(/(\d+)/);
  if (!match) return undefined;
  return Number(match[1]);
};

const parseWordCount = (excerpt: string, readingTime: string): number => {
  const readingMinutes = parseReadingMinutes(readingTime) ?? 5;
  const excerptWords = excerpt.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(excerptWords, readingMinutes * 200);
};

export const mapBlogPostDtoToDomain = (dto: BlogPostDto): BlogPost => {
  const categoryId = toSlug(dto.category);
  const tagIds = dto.tags.map((tag) => toSlug(tag));
  const authorId = toSlug(dto.author);

  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    excerpt: dto.excerpt,
    contentHtml: dto.contentHtml,
    seoTitle: dto.title,
    seoDescription: dto.excerpt,
    canonicalUrl: `/blog/${dto.slug}`,
    ogImageUrl: dto.featuredImage,
    status: dto.status,
    publishedAt: dto.publishedAt,
    visibility: dto.visibility,
    authorId,
    authorName: dto.author,
    createdAt: dto.publishedAt,
    updatedAt: dto.updatedAt,
    version: 1,
    categoryIds: [categoryId],
    tagIds,
    featuredImage: dto.featuredImage,
    imageAlt: dto.imageAlt,
    readingTimeMinutes: parseReadingMinutes(dto.readingTime),
    wordCount: parseWordCount(dto.excerpt, dto.readingTime)
  };
};

export const mapBlogPostDomainToDto = (post: BlogPost): BlogPostDto => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  category: post.categoryIds[0] ?? 'general',
  tags: post.tagIds,
  publishedAt: post.publishedAt ?? post.createdAt,
  updatedAt: post.updatedAt,
  readingTime: `${post.readingTimeMinutes ?? 5} min read`,
  author: post.authorName,
  status: post.status,
  visibility: post.visibility,
  featuredImage: post.featuredImage,
  imageAlt: post.imageAlt,
  contentHtml: post.contentHtml
});

export const mapDtosToCategorySummary = (dtos: BlogPostDto[]): BlogCategory[] => {
  const aggregate = dtos.reduce<Map<string, BlogCategory>>((acc, dto) => {
    const slug = toSlug(dto.category);
    const current = acc.get(slug);

    if (!current) {
      acc.set(slug, {
        id: slug,
        slug,
        name: dto.category,
        postCount: 1
      });
      return acc;
    }

    acc.set(slug, {
      ...current,
      postCount: (current.postCount ?? 0) + 1
    });

    return acc;
  }, new Map());

  return Array.from(aggregate.values()).sort((a, b) => (b.postCount ?? 0) - (a.postCount ?? 0));
};
