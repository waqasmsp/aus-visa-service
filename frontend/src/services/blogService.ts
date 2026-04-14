import { blogPosts } from '../config/blog';
import {
  mapBlogPostDomainToDto,
  mapBlogPostDtoToDomain,
  mapDtosToCategorySummary,
  type BlogPostDto
} from '../mappers/blogMappers';
import type { BlogCategory, BlogPost } from '../types/blog';

type ListPostsFilters = {
  q?: string;
  category?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
  includeUnpublished?: boolean;
};

type SearchPostsFilters = Omit<ListPostsFilters, 'q'>;

type ListPostsResult = {
  items: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
};

let store: BlogPostDto[] = blogPosts.map((post, index) => ({
  id: `post-${index + 1}`,
  ...post,
  contentHtml: `<p>${post.excerpt}</p>`
}));

const wait = (ms = 120): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const normalize = (value: string): string => value.trim().toLowerCase();

const applyFilters = (items: BlogPostDto[], filters: ListPostsFilters): BlogPostDto[] => {
  const now = Date.now();
  const q = normalize(filters.q ?? '');
  const category = normalize(filters.category ?? '');
  const tag = normalize(filters.tag ?? '');

  return items.filter((item) => {
    const isPublished = item.status === 'published' && item.visibility === 'public' && new Date(item.publishedAt).getTime() <= now;
    if (!filters.includeUnpublished && !isPublished) {
      return false;
    }

    if (category && normalize(item.category) !== category) {
      return false;
    }

    if (tag && !item.tags.some((itemTag) => normalize(itemTag) === tag)) {
      return false;
    }

    if (!q) {
      return true;
    }

    return [item.title, item.excerpt, item.category, item.tags.join(' ')].some((field) => normalize(field).includes(q));
  });
};

const paginate = (items: BlogPostDto[], page = 1, pageSize = 6): ListPostsResult => {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safePageSize;
  const paged = items.slice(start, start + safePageSize);

  return {
    items: paged.map(mapBlogPostDtoToDomain),
    total: items.length,
    page: safePage,
    pageSize: safePageSize,
    hasNextPage: start + safePageSize < items.length
  };
};

export async function listPosts(filters: ListPostsFilters = {}): Promise<ListPostsResult> {
  await wait();
  const filtered = applyFilters(store, filters).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return paginate(filtered, filters.page, filters.pageSize);
}

export async function getPostBySlug(slug: string, includeUnpublished = false): Promise<BlogPost | null> {
  await wait();
  const item = applyFilters(store, { includeUnpublished }).find((post) => post.slug === slug);
  return item ? mapBlogPostDtoToDomain(item) : null;
}

export async function listCategories(includeUnpublished = false): Promise<BlogCategory[]> {
  await wait();
  const filtered = applyFilters(store, { includeUnpublished });
  return mapDtosToCategorySummary(filtered);
}

export async function searchPosts(query: string, filters: SearchPostsFilters = {}): Promise<ListPostsResult> {
  return listPosts({ ...filters, q: query });
}

export async function createPost(post: BlogPost): Promise<BlogPost> {
  await wait();
  const next = mapBlogPostDomainToDto(post);
  store = [next, ...store];
  return mapBlogPostDtoToDomain(next);
}

export async function updatePost(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
  await wait();
  let updatedPost: BlogPostDto | null = null;

  store = store.map((item) => {
    if (item.id !== id) {
      return item;
    }

    const current = mapBlogPostDtoToDomain(item);
    const merged = {
      ...current,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };
    updatedPost = mapBlogPostDomainToDto(merged);
    return updatedPost;
  });

  if (!updatedPost) {
    throw new Error('Post not found.');
  }

  return mapBlogPostDtoToDomain(updatedPost);
}

export async function publishPost(id: string): Promise<BlogPost> {
  return updatePost(id, {
    status: 'published',
    publishedAt: new Date().toISOString(),
    visibility: 'public'
  });
}

export async function schedulePost(id: string, scheduledAt: string): Promise<BlogPost> {
  return updatePost(id, {
    status: 'scheduled',
    scheduledAt,
    visibility: 'public'
  });
}

export async function archivePost(id: string): Promise<BlogPost> {
  return updatePost(id, {
    status: 'archived'
  });
}
