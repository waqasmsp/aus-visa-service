import { DeadLetterWebhookEvent, QueuedWebhookEvent, WebhookAuditRecord } from './models';

export interface WebhookAuditRepository {
  save(record: WebhookAuditRecord): Promise<void>;
  update(recordId: string, patch: Partial<WebhookAuditRecord>): Promise<void>;
  get(recordId: string): Promise<WebhookAuditRecord | undefined>;
  list(): Promise<WebhookAuditRecord[]>;
}

export interface WebhookQueueRepository {
  enqueue(event: QueuedWebhookEvent): Promise<void>;
  dequeue(): Promise<QueuedWebhookEvent | undefined>;
  size(): Promise<number>;
}

export interface DeadLetterRepository {
  add(event: DeadLetterWebhookEvent): Promise<void>;
  remove(eventId: string): Promise<void>;
  find(eventId: string): Promise<DeadLetterWebhookEvent | undefined>;
  list(limit?: number): Promise<DeadLetterWebhookEvent[]>;
}

export interface ProcessedEventRepository {
  has(eventId: string): Promise<boolean>;
  markProcessed(eventId: string): Promise<void>;
}

export class InMemoryWebhookAuditRepository implements WebhookAuditRepository {
  private readonly records = new Map<string, WebhookAuditRecord>();

  async save(record: WebhookAuditRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  async update(recordId: string, patch: Partial<WebhookAuditRecord>): Promise<void> {
    const current = this.records.get(recordId);
    if (!current) {
      return;
    }

    this.records.set(recordId, { ...current, ...patch });
  }

  async get(recordId: string): Promise<WebhookAuditRecord | undefined> {
    return this.records.get(recordId);
  }

  async list(): Promise<WebhookAuditRecord[]> {
    return [...this.records.values()];
  }
}

export class InMemoryWebhookQueueRepository implements WebhookQueueRepository {
  private readonly queue: QueuedWebhookEvent[] = [];

  async enqueue(event: QueuedWebhookEvent): Promise<void> {
    this.queue.push(event);
  }

  async dequeue(): Promise<QueuedWebhookEvent | undefined> {
    return this.queue.shift();
  }

  async size(): Promise<number> {
    return this.queue.length;
  }
}

export class InMemoryDeadLetterRepository implements DeadLetterRepository {
  private readonly deadLetterByEventId = new Map<string, DeadLetterWebhookEvent>();

  async add(event: DeadLetterWebhookEvent): Promise<void> {
    this.deadLetterByEventId.set(event.eventId, event);
  }

  async remove(eventId: string): Promise<void> {
    this.deadLetterByEventId.delete(eventId);
  }

  async find(eventId: string): Promise<DeadLetterWebhookEvent | undefined> {
    return this.deadLetterByEventId.get(eventId);
  }

  async list(limit?: number): Promise<DeadLetterWebhookEvent[]> {
    const all = [...this.deadLetterByEventId.values()];
    return typeof limit === 'number' ? all.slice(0, limit) : all;
  }
}

export class InMemoryProcessedEventRepository implements ProcessedEventRepository {
  private readonly ids = new Set<string>();

  async has(eventId: string): Promise<boolean> {
    return this.ids.has(eventId);
  }

  async markProcessed(eventId: string): Promise<void> {
    this.ids.add(eventId);
  }
}
