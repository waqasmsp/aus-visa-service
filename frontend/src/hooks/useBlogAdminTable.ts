import { useCallback, useEffect, useMemo, useState } from 'react';
import { archivePost, listPosts, publishPost, schedulePost, updatePost } from '../services/blogService';
import type { BlogPost, BlogPostStatus } from '../types/blog';
import { DashboardUserRole } from '../types/dashboard/applications';
import { assertPermission } from '../services/dashboard/authPolicy';
import { writeAuditEvent } from '../services/dashboard/audit.service';

type AdminFilters = {
  q: string;
  status: 'all' | BlogPostStatus;
  author: string;
  category: string;
  tag: string;
  publishDateFrom: string;
  publishDateTo: string;
  seoScoreMin: string;
  seoScoreMax: string;
};

const getSeoScore = (post: BlogPost): number => {
  const hasMeta = post.seoTitle && post.seoDescription ? 20 : 0;
  const hasKeyword = post.focusKeyword ? 15 : 0;
  const hasCanonical = post.canonicalUrl ? 10 : 0;
  const hasImage = post.ogImageUrl ? 10 : 0;
  const wordScore = Math.min(30, Math.round((post.wordCount ?? 0) / 35));
  const structureScore = post.categoryIds.length > 0 && post.tagIds.length > 0 ? 15 : 5;
  return Math.min(100, hasMeta + hasKeyword + hasCanonical + hasImage + wordScore + structureScore);
};

export function useBlogAdminTable(role: DashboardUserRole) {
  const [filters, setFilters] = useState<AdminFilters>({
    q: '',
    status: 'all',
    author: '',
    category: '',
    tag: '',
    publishDateFrom: '',
    publishDateTo: '',
    seoScoreMin: '',
    seoScoreMax: ''
  });
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listPosts({
        q: filters.q,
        category: filters.category || undefined,
        tag: filters.tag || undefined,
        includeUnpublished: true,
        pageSize: 100
      });

      const minSeo = filters.seoScoreMin ? Number.parseInt(filters.seoScoreMin, 10) : null;
      const maxSeo = filters.seoScoreMax ? Number.parseInt(filters.seoScoreMax, 10) : null;
      const fromDate = filters.publishDateFrom ? new Date(filters.publishDateFrom).getTime() : null;
      const toDate = filters.publishDateTo ? new Date(filters.publishDateTo).getTime() : null;

      const nextPosts = result.items.filter((post) => {
        if (filters.status !== 'all' && post.status !== filters.status) return false;
        if (filters.author && post.authorName !== filters.author) return false;

        const publishTime = new Date(post.publishedAt ?? post.updatedAt).getTime();
        if (fromDate && !Number.isNaN(publishTime) && publishTime < fromDate) return false;
        if (toDate && !Number.isNaN(publishTime) && publishTime > toDate + (24 * 60 * 60 * 1000 - 1)) return false;

        const seoScore = getSeoScore(post);
        if (minSeo !== null && seoScore < minSeo) return false;
        if (maxSeo !== null && seoScore > maxSeo) return false;

        return true;
      });
      setPosts(nextPosts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard posts.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const onPublish = useCallback(async (postId: string) => {
    assertPermission(role, 'blogs', 'publish');
    await publishPost(postId);
    writeAuditEvent({ actor: role, action: 'publish', entityType: 'blogs', entityId: postId, before: null, after: { status: 'published' } });
    await loadPosts();
  }, [loadPosts, role]);

  const onSchedule = useCallback(async (postId: string, scheduledAt: string) => {
    assertPermission(role, 'blogs', 'edit');
    await schedulePost(postId, scheduledAt);
    writeAuditEvent({ actor: role, action: 'schedule', entityType: 'blogs', entityId: postId, before: null, after: { scheduledAt } });
    await loadPosts();
  }, [loadPosts, role]);

  const onArchive = useCallback(async (postId: string) => {
    assertPermission(role, 'blogs', 'edit');
    await archivePost(postId);
    writeAuditEvent({ actor: role, action: 'archive', entityType: 'blogs', entityId: postId, before: null, after: { status: 'archived' } });
    await loadPosts();
  }, [loadPosts, role]);

  const onBatchUpdate = useCallback(async (entries: Array<{ postId: string; updates: Partial<BlogPost> }>) => {
    assertPermission(role, 'blogs', 'edit');
    await Promise.all(entries.map((entry) => updatePost(entry.postId, entry.updates)));
    writeAuditEvent({ actor: role, action: 'batch_edit', entityType: 'blogs', entityId: entries.map((item) => item.postId).join(','), before: null, after: { count: entries.length } });
    await loadPosts();
  }, [loadPosts, role]);

  const filterOptions = useMemo(() => {
    const authors = Array.from(new Set(posts.map((post) => post.authorName))).sort();
    const categories = Array.from(new Set(posts.flatMap((post) => post.categoryIds))).sort();
    const tags = Array.from(new Set(posts.flatMap((post) => post.tagIds))).sort();
    return { authors, categories, tags };
  }, [posts]);

  return useMemo(
    () => ({
      filters,
      setFilters,
      posts,
      loading,
      error,
      refresh: loadPosts,
      onPublish,
      onSchedule,
      onArchive,
      onBatchUpdate,
      getSeoScore,
      filterOptions
    }),
    [error, filterOptions, filters, loadPosts, loading, onArchive, onBatchUpdate, onPublish, onSchedule, posts]
  );
}
