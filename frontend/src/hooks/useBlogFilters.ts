import { useCallback, useEffect, useMemo, useState } from 'react';

export type BlogPublicFilters = {
  q: string;
  category: string;
  tag: string;
  page: number;
};

const DEFAULT_FILTERS: BlogPublicFilters = {
  q: '',
  category: '',
  tag: '',
  page: 1
};

const parseFiltersFromUrl = (): BlogPublicFilters => {
  if (typeof window === 'undefined') {
    return DEFAULT_FILTERS;
  }

  const params = new URLSearchParams(window.location.search);
  const nextPage = Number(params.get('page') ?? '1');

  return {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    tag: params.get('tag') ?? '',
    page: Number.isFinite(nextPage) && nextPage > 0 ? Math.floor(nextPage) : 1
  };
};

const buildQuery = (filters: BlogPublicFilters): string => {
  const params = new URLSearchParams();

  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.page > 1) params.set('page', String(filters.page));

  const query = params.toString();
  return query ? `?${query}` : '';
};

export function useBlogFilters() {
  const [filters, setFilters] = useState<BlogPublicFilters>(parseFiltersFromUrl);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextQuery = buildQuery(filters);
    const nextUrl = `${window.location.pathname}${nextQuery}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [filters]);

  useEffect(() => {
    const syncFromPopState = () => {
      setFilters(parseFiltersFromUrl());
    };

    window.addEventListener('popstate', syncFromPopState);
    return () => window.removeEventListener('popstate', syncFromPopState);
  }, []);

  const setFilter = useCallback(<K extends keyof BlogPublicFilters>(key: K, value: BlogPublicFilters[K]) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? (value as number) : 1
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return useMemo(
    () => ({
      filters,
      setFilter,
      resetFilters
    }),
    [filters, resetFilters, setFilter]
  );
}
