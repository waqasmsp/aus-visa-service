import { useCallback, useEffect, useMemo, useState } from 'react';
import { archivePost, listPosts, publishPost, schedulePost } from '../services/blogService';
import type { BlogPost, BlogPostStatus } from '../types/blog';

type AdminFilters = {
  q: string;
  status: 'all' | BlogPostStatus;
};

export function useBlogAdminTable() {
  const [filters, setFilters] = useState<AdminFilters>({ q: '', status: 'all' });
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listPosts({
        q: filters.q,
        includeUnpublished: true,
        pageSize: 50
      });

      const nextPosts = filters.status === 'all' ? result.items : result.items.filter((post) => post.status === filters.status);
      setPosts(nextPosts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard posts.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [filters.q, filters.status]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const onPublish = useCallback(async (postId: string) => {
    await publishPost(postId);
    await loadPosts();
  }, [loadPosts]);

  const onSchedule = useCallback(async (postId: string, scheduledAt: string) => {
    await schedulePost(postId, scheduledAt);
    await loadPosts();
  }, [loadPosts]);

  const onArchive = useCallback(async (postId: string) => {
    await archivePost(postId);
    await loadPosts();
  }, [loadPosts]);

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
      onArchive
    }),
    [error, filters, loadPosts, loading, onArchive, onPublish, onSchedule, posts]
  );
}
