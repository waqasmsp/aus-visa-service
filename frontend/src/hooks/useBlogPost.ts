import { useEffect, useState } from 'react';
import { getPostBySlug } from '../services/blogService';
import type { BlogPost } from '../types/blog';

type UseBlogPostState = {
  post: BlogPost | null;
  loading: boolean;
  error: string | null;
};

export function useBlogPost(slug: string): UseBlogPostState {
  const [state, setState] = useState<UseBlogPostState>({
    post: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!slug) {
      setState({ post: null, loading: false, error: 'Missing blog slug.' });
      return;
    }

    let active = true;
    setState({ post: null, loading: true, error: null });

    getPostBySlug(slug)
      .then((post) => {
        if (!active) return;
        if (!post) {
          setState({ post: null, loading: false, error: 'Post not found.' });
          return;
        }

        setState({ post, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unable to load this post.';
        setState({ post: null, loading: false, error: message });
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return state;
}
