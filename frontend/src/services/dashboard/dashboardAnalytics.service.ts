export type AdminAnalyticsEventName =
  | 'applications_created'
  | 'applications_updated'
  | 'applications_deleted'
  | 'applications_restored'
  | 'users_created'
  | 'users_updated'
  | 'users_deleted'
  | 'users_imported'
  | 'pages_created'
  | 'pages_updated'
  | 'pages_deleted'
  | 'pages_published'
  | 'webhooks_endpoint_created'
  | 'webhooks_endpoint_updated'
  | 'webhooks_endpoint_deleted'
  | 'webhooks_test_sent'
  | 'webhooks_delivery_replayed';

export type AdminAnalyticsEvent = {
  id: string;
  name: AdminAnalyticsEventName;
  timestamp: string;
  actorRole?: string;
  module: 'applications' | 'users' | 'pages' | 'blogs' | 'settings' | 'webhooks';
  entityId?: string;
  status?: 'success' | 'error';
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

type DashboardAnalyticsStore = {
  events: AdminAnalyticsEvent[];
};

export type WebhookHealthSnapshot = {
  totalDeliveries: number;
  successRate: number;
  averageLatencyMs: number;
  failingEndpoints: string[];
  p95LatencyMs: number;
};

const STORAGE_KEY = 'aus-visa-dashboard-admin-analytics-v1';

const isBrowser = (): boolean => typeof window !== 'undefined';

const emptyStore = (): DashboardAnalyticsStore => ({ events: [] });

const readStore = (): DashboardAnalyticsStore => {
  if (!isBrowser()) return emptyStore();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as DashboardAnalyticsStore;
    return Array.isArray(parsed.events) ? parsed : emptyStore();
  } catch {
    return emptyStore();
  }
};

const writeStore = (value: DashboardAnalyticsStore): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const trackAdminEvent = (event: Omit<AdminAnalyticsEvent, 'id' | 'timestamp'>): void => {
  const store = readStore();
  store.events = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...event
    },
    ...store.events
  ].slice(0, 4000);

  writeStore(store);
};

export type WebhookDeliverySample = {
  endpointId: string;
  endpointName: string;
  statusCode: number;
  latencyMs: number;
};

export const computeWebhookHealthSnapshot = (deliveries: WebhookDeliverySample[]): WebhookHealthSnapshot => {
  if (!deliveries.length) {
    return {
      totalDeliveries: 0,
      successRate: 0,
      averageLatencyMs: 0,
      failingEndpoints: [],
      p95LatencyMs: 0
    };
  }

  const successful = deliveries.filter((entry) => entry.statusCode >= 200 && entry.statusCode < 400);
  const successRate = (successful.length / deliveries.length) * 100;

  const totalLatency = deliveries.reduce((accumulator, delivery) => accumulator + delivery.latencyMs, 0);
  const averageLatencyMs = totalLatency / deliveries.length;

  const sortedLatencies = [...deliveries].map((entry) => entry.latencyMs).sort((a, b) => a - b);
  const p95Index = Math.max(0, Math.ceil(sortedLatencies.length * 0.95) - 1);
  const p95LatencyMs = sortedLatencies[p95Index];

  const endpointFailures = new Map<string, { endpointName: string; failures: number }>();
  for (const delivery of deliveries) {
    if (delivery.statusCode < 400) continue;
    const current = endpointFailures.get(delivery.endpointId) ?? { endpointName: delivery.endpointName, failures: 0 };
    endpointFailures.set(delivery.endpointId, { ...current, failures: current.failures + 1 });
  }

  const failingEndpoints = Array.from(endpointFailures.values())
    .sort((a, b) => b.failures - a.failures)
    .map((entry) => entry.endpointName);

  return {
    totalDeliveries: deliveries.length,
    successRate,
    averageLatencyMs,
    p95LatencyMs,
    failingEndpoints
  };
};
