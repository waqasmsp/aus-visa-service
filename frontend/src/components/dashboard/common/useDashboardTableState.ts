import { useEffect, useMemo, useState } from 'react';
import { DashboardQueryState, DashboardSort, SortDirection } from '../../../types/dashboard/query';

type Params = {
  basePath: string;
  defaultState: DashboardQueryState;
  syncToUrl?: boolean;
};

const parseNumber = (value: string | null, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

const parseSortDirection = (value: string | null, fallback: SortDirection): SortDirection => {
  if (value === 'asc' || value === 'desc') {
    return value;
  }
  return fallback;
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
      if (current !== null) {
        filters[key as keyof TFilters] = current as TFilters[keyof TFilters];
      }
    });

    const defaultSort = defaultState.sort ?? { field: 'id', direction: 'desc' as SortDirection };

    return {
      ...defaultState,
      search: searchParams.get('search') ?? defaultState.search,
      pagination: {
        page: parseNumber(searchParams.get('page'), defaultState.pagination.page),
        pageSize: parseNumber(searchParams.get('pageSize'), defaultState.pagination.pageSize)
      },
      sort: {
        field: searchParams.get('sortField') ?? defaultSort.field,
        direction: parseSortDirection(searchParams.get('sortDirection'), defaultSort.direction)
      },
      filters
    } as DashboardQueryState<TFilters>;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !syncToUrl) {
      return;
    }
    const params = new URLSearchParams();
    if (state.pagination.page > 1) params.set('page', String(state.pagination.page));
    if (state.pagination.pageSize !== defaultState.pagination.pageSize) params.set('pageSize', String(state.pagination.pageSize));
    if (state.search) params.set('search', state.search);

    if (state.sort) {
      if (state.sort.field !== (defaultState.sort?.field ?? 'id')) params.set('sortField', state.sort.field);
      if (state.sort.direction !== (defaultState.sort?.direction ?? 'desc')) params.set('sortDirection', state.sort.direction);
    }

    Object.entries(state.filters).forEach(([key, value]) => {
      if (value && value !== 'All' && value !== 'false') {
        params.set(key, value);
      }
    });
    const nextUrl = `${basePath}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, [basePath, defaultState.pagination.pageSize, defaultState.sort?.direction, defaultState.sort?.field, state, syncToUrl]);

  const setSearch = (search: string) => setState((prev) => ({ ...prev, search, pagination: { ...prev.pagination, page: 1 } }));
  const setFilter = <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) =>
    setState((prev) => ({ ...prev, filters: { ...prev.filters, [key]: value }, pagination: { ...prev.pagination, page: 1 } }));

  const tableControls = useMemo(
    () => ({
      setSearch,
      setFilter,
      setPage: (page: number) => setState((prev) => ({ ...prev, pagination: { ...prev.pagination, page } })),
      setPageSize: (pageSize: number) => setState((prev) => ({ ...prev, pagination: { page: 1, pageSize } })),
      setSort: (sort: DashboardSort) => setState((prev) => ({ ...prev, sort, pagination: { ...prev.pagination, page: 1 } }))
    }),
    []
  );

  return { state, setState, ...tableControls };
}
