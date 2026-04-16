import { ReactNode, useEffect, useMemo, useState } from 'react';
import { DashboardSort } from '../../../types/dashboard/query';

export type DataTableColumn = {
  id: string;
  label: string;
  sortable?: boolean;
};

export function DataTableHeader({
  columns,
  sort,
  onSort,
  sticky = true
}: {
  columns: DataTableColumn[];
  sort?: DashboardSort;
  onSort?: (sort: DashboardSort) => void;
  sticky?: boolean;
}) {
  return (
    <thead className={sticky ? 'dashboard-table__thead--sticky' : undefined}>
      <tr>
        {columns.map((column) => {
          const isActive = sort?.field === column.id;
          const nextDirection = isActive && sort?.direction === 'asc' ? 'desc' : 'asc';
          return (
            <th
              key={column.id}
              scope="col"
              aria-sort={column.sortable && isActive ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              {column.sortable && onSort ? (
                <button
                  type="button"
                  className="dashboard-table-sort"
                  aria-label={`Sort by ${column.label}`}
                  onClick={() => onSort({ field: column.id, direction: nextDirection })}
                >
                  {column.label}
                  <span>{isActive ? (sort?.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </button>
              ) : (
                column.label
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export function DataTableRowActions({ label = 'Actions', children }: { label?: string; children: ReactNode }) {
  return (
    <details className="dashboard-row-actions-menu">
      <summary>{label}</summary>
      <div className="dashboard-row-actions-menu__content">{children}</div>
    </details>
  );
}

export function DataTablePaginationFooter({
  page,
  pageSize,
  total,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange
}: {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="dashboard-table-pagination">
      <small>
        Page {Math.min(page, totalPages)} of {totalPages} · {total} total
      </small>
      <div className="dashboard-actions-inline">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </button>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function useDataTablePreferences(storageKey: string, defaultVisibleColumnIds: string[]) {
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(defaultVisibleColumnIds);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { visibleColumnIds?: string[] };
      if (Array.isArray(parsed.visibleColumnIds) && parsed.visibleColumnIds.length > 0) {
        setVisibleColumnIds(parsed.visibleColumnIds);
      }
    } catch {
      setVisibleColumnIds(defaultVisibleColumnIds);
    }
  }, [defaultVisibleColumnIds, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify({ visibleColumnIds }));
  }, [storageKey, visibleColumnIds]);

  const toggleColumn = (columnId: string) => {
    setVisibleColumnIds((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]));
  };

  return {
    visibleColumnIds,
    toggleColumn,
    resetColumns: () => setVisibleColumnIds(defaultVisibleColumnIds)
  };
}

export function DataTableColumnVisibility({
  columns,
  visibleColumnIds,
  onToggle,
  onReset
}: {
  columns: DataTableColumn[];
  visibleColumnIds: string[];
  onToggle: (columnId: string) => void;
  onReset: () => void;
}) {
  const selected = useMemo(() => new Set(visibleColumnIds), [visibleColumnIds]);

  return (
    <details className="dashboard-column-visibility">
      <summary>Columns</summary>
      <div className="dashboard-column-visibility__menu">
        {columns.map((column) => (
          <label key={column.id}>
            <input type="checkbox" checked={selected.has(column.id)} onChange={() => onToggle(column.id)} />
            {column.label}
          </label>
        ))}
        <button type="button" onClick={onReset}>
          Reset columns
        </button>
      </div>
    </details>
  );
}
