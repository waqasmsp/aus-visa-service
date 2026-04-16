export function DashboardLoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="dashboard-panel" aria-busy="true">
      <p>Loading data…</p>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="dashboard-skeleton-row" />
      ))}
    </div>
  );
}

export function DashboardEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="dashboard-panel">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function DashboardErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="dashboard-panel">
      <h3>Couldn’t load data</h3>
      <p>{message}</p>
      <button type="button" className="dashboard-primary-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}


export function DashboardNoResultsState({ title = 'No matching results', description, onReset }: { title?: string; description: string; onReset: () => void }) {
  return (
    <div className="dashboard-panel">
      <h3>{title}</h3>
      <p>{description}</p>
      <button type="button" className="dashboard-primary-button" onClick={onReset}>
        Reset filters
      </button>
    </div>
  );
}
