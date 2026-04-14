import type { BlogPost, BlogPostStatus } from '../types/blog';

export type BlogTrackingEventName = 'blog_list_impression' | 'article_open' | 'scroll_depth' | 'cta_click';
export type BlogCtaType = 'apply' | 'newsletter' | 'contact';

type BlogTrackingEvent = {
  id: string;
  name: BlogTrackingEventName;
  timestamp: string;
  slug?: string;
  depth?: number;
  ctaType?: BlogCtaType;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

type BlogAnalyticsStore = {
  events: BlogTrackingEvent[];
};

export type BlogPostPerformance = {
  slug: string;
  title: string;
  views: number;
  ctaClicks: number;
  ctr: number;
};

export type BlogPerformanceSnapshot = {
  postsByStatus: Record<BlogPostStatus, number>;
  publishFrequencyLast30Days: number;
  topPerformingPosts: BlogPostPerformance[];
  staleContentCandidates: Array<{ slug: string; title: string; daysSinceUpdate: number }>;
};

const STORAGE_KEY = 'aus-visa-blog-analytics';

const emptyStore = (): BlogAnalyticsStore => ({ events: [] });

const isBrowser = (): boolean => typeof window !== 'undefined';

const readStore = (): BlogAnalyticsStore => {
  if (!isBrowser()) return emptyStore();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as BlogAnalyticsStore;
    return Array.isArray(parsed.events) ? parsed : emptyStore();
  } catch {
    return emptyStore();
  }
};

const writeStore = (value: BlogAnalyticsStore): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const trackBlogEvent = (
  name: BlogTrackingEventName,
  payload: Omit<BlogTrackingEvent, 'id' | 'name' | 'timestamp'> = {}
): void => {
  const store = readStore();
  store.events = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      timestamp: new Date().toISOString(),
      ...payload
    },
    ...store.events
  ].slice(0, 3000);
  writeStore(store);
};

export const getBlogPerformanceSnapshot = (
  posts: BlogPost[],
  options: { staleThresholdDays?: number } = {}
): BlogPerformanceSnapshot => {
  const staleThresholdDays = options.staleThresholdDays ?? 45;
  const store = readStore();
  const now = Date.now();

  const postsByStatus: Record<BlogPostStatus, number> = {
    draft: 0,
    in_review: 0,
    scheduled: 0,
    published: 0,
    archived: 0
  };

  for (const post of posts) {
    postsByStatus[post.status] += 1;
  }

  const publishedLast30Days = posts.filter((post) => {
    if (!post.publishedAt) return false;
    const publishedAt = new Date(post.publishedAt).getTime();
    return !Number.isNaN(publishedAt) && now - publishedAt <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const metrics = new Map<string, { views: number; ctaClicks: number }>();
  for (const event of store.events) {
    if (!event.slug) continue;
    const current = metrics.get(event.slug) ?? { views: 0, ctaClicks: 0 };
    if (event.name === 'article_open') current.views += 1;
    if (event.name === 'cta_click') current.ctaClicks += 1;
    metrics.set(event.slug, current);
  }

  const topPerformingPosts = posts
    .map<BlogPostPerformance>((post) => {
      const values = metrics.get(post.slug) ?? { views: 0, ctaClicks: 0 };
      const ctr = values.views > 0 ? values.ctaClicks / values.views : 0;
      return {
        slug: post.slug,
        title: post.title,
        views: values.views,
        ctaClicks: values.ctaClicks,
        ctr
      };
    })
    .sort((a, b) => {
      if (b.views !== a.views) return b.views - a.views;
      return b.ctr - a.ctr;
    })
    .slice(0, 5);

  const staleContentCandidates = posts
    .map((post) => {
      const updated = new Date(post.updatedAt).getTime();
      const daysSinceUpdate = Number.isNaN(updated) ? 0 : Math.floor((now - updated) / (24 * 60 * 60 * 1000));
      return {
        slug: post.slug,
        title: post.title,
        daysSinceUpdate
      };
    })
    .filter((post) => post.daysSinceUpdate >= staleThresholdDays)
    .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)
    .slice(0, 5);

  return {
    postsByStatus,
    publishFrequencyLast30Days: publishedLast30Days,
    topPerformingPosts,
    staleContentCandidates
  };
};
