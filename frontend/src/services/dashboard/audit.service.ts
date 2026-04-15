import { PolicyModule } from './authPolicy';

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  entityType: PolicyModule | string;
  entityId: string;
  before: unknown;
  after: unknown;
  diff: Record<string, { before: unknown; after: unknown }>;
  timestamp: string;
  requestMetadata: {
    ip: string | null;
    sessionId: string | null;
    userAgent: string | null;
  };
};

export type AuditFilters = {
  actor?: string;
  action?: string;
  entityType?: string;
  search?: string;
  from?: string;
  to?: string;
};

const AUDIT_STORAGE_KEY = 'aus-visa-dashboard-audit-events-v1';
const SESSION_KEY = 'aus-visa-dashboard-session-id';

const getSessionId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  window.sessionStorage.setItem(SESSION_KEY, created);
  return created;
};

const toRecord = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});

const diffObjects = (before: unknown, after: unknown): Record<string, { before: unknown; after: unknown }> => {
  const left = toRecord(before);
  const right = toRecord(after);
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  keys.forEach((key) => {
    if (JSON.stringify(left[key]) !== JSON.stringify(right[key])) {
      diff[key] = { before: left[key], after: right[key] };
    }
  });
  return diff;
};

const readEvents = (): AuditEvent[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuditEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeEvents = (events: AuditEvent[]): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(events.slice(0, 1000)));
};

export const writeAuditEvent = (input: Omit<AuditEvent, 'id' | 'timestamp' | 'diff' | 'requestMetadata'> & { timestamp?: string }): AuditEvent => {
  const event: AuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: input.timestamp ?? new Date().toISOString(),
    diff: diffObjects(input.before, input.after),
    requestMetadata: {
      ip: null,
      sessionId: getSessionId(),
      userAgent: typeof window === 'undefined' ? null : window.navigator.userAgent
    },
    ...input
  };

  const events = [event, ...readEvents()];
  writeEvents(events);
  return event;
};

export const listAuditEvents = (filters: AuditFilters = {}): AuditEvent[] => {
  const search = filters.search?.trim().toLowerCase();
  return readEvents().filter((event) => {
    if (filters.actor && !event.actor.toLowerCase().includes(filters.actor.toLowerCase())) return false;
    if (filters.action && !event.action.toLowerCase().includes(filters.action.toLowerCase())) return false;
    if (filters.entityType && event.entityType !== filters.entityType) return false;
    if (filters.from && event.timestamp < filters.from) return false;
    if (filters.to && event.timestamp > filters.to) return false;
    if (search) {
      const haystack = `${event.actor} ${event.action} ${event.entityType} ${event.entityId} ${JSON.stringify(event.diff)}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
};

export const exportAuditEventsCsv = (events: AuditEvent[]): string => {
  const header = 'timestamp,actor,action,entity_type,entity_id,reason,session_id,ip,diff\n';
  const rows = events
    .map((event) =>
      [
        event.timestamp,
        event.actor,
        event.action,
        event.entityType,
        event.entityId,
        String((toRecord(event.after).reason as string | undefined) ?? ''),
        event.requestMetadata.sessionId ?? '',
        event.requestMetadata.ip ?? '',
        JSON.stringify(event.diff)
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
  return `${header}${rows}`;
};
