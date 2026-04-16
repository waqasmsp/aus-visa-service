import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type NotificationLevel = 'success' | 'error' | 'info';

type DashboardNotification = {
  id: string;
  message: string;
  level: NotificationLevel;
};

type NotificationPayload = {
  entity: string;
  action: string;
  result: string;
  id?: string;
};

type DashboardNotificationsContextValue = {
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  notifyInfo: (message: string) => void;
  formatNotificationMessage: (payload: NotificationPayload, detail?: string) => string;
};

const DashboardNotificationsContext = createContext<DashboardNotificationsContextValue | null>(null);

const levelToClassName: Record<NotificationLevel, string> = {
  success: '',
  error: 'is-error',
  info: 'is-warning'
};

function NotificationRegion({ toasts, onDismiss }: { toasts: DashboardNotification[]; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => onDismiss(toast.id), 3200));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onDismiss, toasts]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 40, display: 'grid', gap: 8 }}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`dashboard-auth__message ${levelToClassName[toast.level]}`.trim()}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function DashboardNotificationsProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<DashboardNotification[]>([]);

  const push = useCallback((message: string, level: NotificationLevel) => {
    setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, message, level }]);
  }, []);

  const value = useMemo<DashboardNotificationsContextValue>(
    () => ({
      notifySuccess: (message: string) => push(message, 'success'),
      notifyError: (message: string) => push(message, 'error'),
      notifyInfo: (message: string) => push(message, 'info'),
      formatNotificationMessage: (payload: NotificationPayload, detail?: string) =>
        `${JSON.stringify(payload)}${detail ? ` · ${detail}` : ''}`
    }),
    [push]
  );

  return (
    <DashboardNotificationsContext.Provider value={value}>
      {children}
      <NotificationRegion toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))} />
    </DashboardNotificationsContext.Provider>
  );
}

export function useDashboardNotifications() {
  const context = useContext(DashboardNotificationsContext);
  if (!context) {
    throw new Error('useDashboardNotifications must be used within DashboardNotificationsProvider.');
  }

  return context;
}
