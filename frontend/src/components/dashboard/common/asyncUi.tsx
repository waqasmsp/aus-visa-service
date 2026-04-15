import { useEffect, useState } from 'react';

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

type ToastLevel = 'success' | 'error' | 'warning';
export type DashboardToast = { id: string; message: string; level: ToastLevel };

export function MutationToastRegion({ toasts, onDismiss }: { toasts: DashboardToast[]; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => onDismiss(toast.id), 2600));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onDismiss, toasts]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 40, display: 'grid', gap: 8 }}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`dashboard-auth__message is-${toast.level}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function useMutationToasts() {
  const [toasts, setToasts] = useState<DashboardToast[]>([]);

  const push = (message: string, level: ToastLevel) => {
    setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, message, level }]);
  };

  return {
    toasts,
    dismissToast: (id: string) => setToasts((prev) => prev.filter((toast) => toast.id !== id)),
    notifySuccess: (message: string) => push(message, 'success'),
    notifyError: (message: string) => push(message, 'error'),
    notifyWarning: (message: string) => push(message, 'warning')
  };
}
