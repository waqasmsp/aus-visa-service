import { useEffect, useState } from 'react';
import { listPosts } from '../services/blogService';
import type { BlogPost } from '../types/blog';
import type { BlogPublicFilters } from './useBlogFilters';

type UseBlogPostsState = {
  posts: BlogPost[];
  total: number;
  hasNextPage: boolean;
  loading: boolean;
  error: string | null;
};

export function useBlogPosts(filters: BlogPublicFilters, pageSize = 6): UseBlogPostsState {
  const [state, setState] = useState<UseBlogPostsState>({
    posts: [],
    total: 0,
    hasNextPage: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    let active = true;

    setState((current) => ({ ...current, loading: true, error: null }));

    listPosts({
      q: filters.q,
      category: filters.category,
      tag: filters.tag,
      page: filters.page,
      pageSize
    })
      .then((result) => {
        if (!active) return;
        setState({
          posts: result.items,
          total: result.total,
          hasNextPage: result.hasNextPage,
          loading: false,
          error: null
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unable to load blog posts.';
        setState({
          posts: [],
          total: 0,
          hasNextPage: false,
          loading: false,
          error: message
        });
      });

    return () => {
      active = false;
    };
  }, [filters.category, filters.page, filters.q, filters.tag, pageSize]);

  return state;
}
