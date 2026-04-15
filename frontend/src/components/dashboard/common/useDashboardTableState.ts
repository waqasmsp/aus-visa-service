import { useEffect, useMemo, useState } from 'react';
import { DashboardQueryState } from '../../../types/dashboard/query';

type Params = {
  basePath: string;
  defaultState: DashboardQueryState;
  syncToUrl?: boolean;
};

const parseNumber = (value: string | null, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

export function useDashboardTableState<TFilters extends Record<string, string>>({ basePath, defaultState, syncToUrl = true }: Params) {
  const [state, setState] = useState<DashboardQueryState<TFilters>>(() => {
    if (typeof window === 'undefined' || !syncToUrl) {
      return defaultState as DashboardQueryState<TFilters>;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const filters = { ...defaultState.filters } as TFilters;

    Object.keys(filters).forEach((key) => {
      const current = searchParams.get(key);
      if (current) {
        filters[key as keyof TFilters] = current as TFilters[keyof TFilters];
      }
    });

    return {
      ...defaultState,
      search: searchParams.get('search') ?? defaultState.search,
      pagination: {
        page: parseNumber(searchParams.get('page'), defaultState.pagination.page),
        pageSize: parseNumber(searchParams.get('pageSize'), defaultState.pagination.pageSize)
      },
      filters
    } as DashboardQueryState<TFilters>;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !syncToUrl) {
      return;
    }
    const params = new URLSearchParams();
    if (state.pagination.page > 1) {
      params.set('page', String(state.pagination.page));
    }
    if (state.search) {
      params.set('search', state.search);
    }
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value && value !== 'All') {
        params.set(key, value);
      }
    });
    const nextUrl = `${basePath}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, [basePath, state, syncToUrl]);

  const setSearch = (search: string) => setState((prev) => ({ ...prev, search, pagination: { ...prev.pagination, page: 1 } }));
  const setFilter = <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) =>
    setState((prev) => ({ ...prev, filters: { ...prev.filters, [key]: value }, pagination: { ...prev.pagination, page: 1 } }));

  const tableControls = useMemo(
    () => ({
      setSearch,
      setFilter,
      setPage: (page: number) => setState((prev) => ({ ...prev, pagination: { ...prev.pagination, page } }))
    }),
    []
  );

  return { state, setState, ...tableControls };
}
