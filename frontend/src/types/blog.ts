export type BlogPostStatus =
  | 'draft'
  | 'in_review'
  | 'scheduled'
  | 'published'
  | 'archived';

export type BlogVisibility = 'public' | 'private';

export type BlogAuthorRole = 'admin' | 'manager';

export type BlogTwitterCardType = 'summary' | 'summary_large_image';

export type BlogSchemaType = 'Article' | 'BlogPosting' | 'NewsArticle';

export type BlogContentBlock = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};

export interface BlogImageAsset {
  url: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface BlogPost {
  // identity
  id: string;
  slug: string;
  title: string;
  excerpt: string;

  // content
  contentHtml?: string;
  contentBlocks?: BlogContentBlock[];

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  twitterCardType?: BlogTwitterCardType;
  schemaType?: BlogSchemaType;

  // publishing
  status: BlogPostStatus;
  publishedAt?: string;
  scheduledAt?: string;
  visibility: BlogVisibility;

  // governance
  authorId: string;
  authorName: string;
  lastEditedBy?: string;
  createdAt: string;
  updatedAt: string;
  version: number;

  // taxonomy
  categoryIds: string[];
  tagIds: string[];

  // media
  featuredImage?: string;
  imageAlt?: string;

  // metrics
  readingTimeMinutes?: number;
  wordCount?: number;
}

export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  postCount?: number;
}

export interface BlogTag {
  id: string;
  slug: string;
  name: string;
  postCount?: number;
}

export interface BlogRevision {
  id: string;
  postId: string;
  version: number;
  editedBy: string;
  editedByRole: BlogAuthorRole;
  editedAt: string;
  changeSummary?: string;
}

export interface BlogSearchQuery {
  query?: string;
  status?: BlogPostStatus[];
  visibility?: BlogVisibility;
  categoryIds?: string[];
  tagIds?: string[];
  authorIds?: string[];
  fromDate?: string;
  toDate?: string;
  sortBy?: 'publishedAt' | 'updatedAt' | 'createdAt' | 'title';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const BLOG_ROUTES = {
  listing: '/blog',
  detail: '/blog/:slug',
  category: '/blog/category/:categorySlug',
  tag: '/blog/tag/:tagSlug',
} as const;

export interface BlogListPostsRequest {
  filters?: BlogSearchQuery;
  page?: number;
  pageSize?: number;
}

export interface BlogListPostsResponse {
  items: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface BlogGetPostBySlugRequest {
  slug: string;
}

export interface BlogGetPostBySlugResponse {
  item: BlogPost;
}

export interface BlogCreatePostRequest {
  post: Omit<
    BlogPost,
    'id' | 'createdAt' | 'updatedAt' | 'version' | 'publishedAt' | 'scheduledAt'
  > & {
    publishedAt?: string;
    scheduledAt?: string;
  };
}

export interface BlogCreatePostResponse {
  item: BlogPost;
}

export interface BlogUpdatePostRequest {
  id: string;
  updates: Partial<Omit<BlogPost, 'id' | 'createdAt' | 'authorId' | 'authorName'>>;
  expectedVersion: number;
}

export interface BlogUpdatePostResponse {
  item: BlogPost;
}

export type BlogPublishAction = 'publish' | 'schedule' | 'unpublish' | 'archive';

export interface BlogPublishPostRequest {
  id: string;
  action: BlogPublishAction;
  scheduledAt?: string;
}

export interface BlogPublishPostResponse {
  item: BlogPost;
}

export interface BlogRevisionHistoryRequest {
  postId: string;
  page?: number;
  pageSize?: number;
}

export interface BlogRevisionHistoryResponse {
  items: BlogRevision[];
  total: number;
  page: number;
  pageSize: number;
}

export const BLOG_STATUS_TRANSITIONS: Record<BlogPostStatus, BlogPostStatus[]> = {
  draft: ['in_review', 'archived'],
  in_review: ['draft', 'scheduled', 'published', 'archived'],
  scheduled: ['draft', 'published', 'archived'],
  published: ['draft', 'archived'],
  archived: ['draft'],
};

export const canTransitionBlogPostStatus = (
  from: BlogPostStatus,
  to: BlogPostStatus,
): boolean => BLOG_STATUS_TRANSITIONS[from].includes(to);
