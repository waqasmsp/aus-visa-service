export type SortDirection = 'asc' | 'desc';

export type DashboardSort = {
  field: string;
  direction: SortDirection;
};

export type DashboardPagination = {
  page: number;
  pageSize: number;
};

export type DashboardQueryState<TFilters extends Record<string, string> = Record<string, string>> = {
  search: string;
  pagination: DashboardPagination;
  sort?: DashboardSort;
  filters: TFilters;
};

export type DashboardListMeta = {
  total: number;
  page: number;
  pageSize: number;
};

export type DashboardListResponse<TItem> = {
  items: TItem[];
  meta: DashboardListMeta;
};
