import { randomUUID } from 'crypto';
import { HandleWebhookDto, RequestContext } from '../dtos';
import { PaymentService } from '../interfaces';
import { PaymentProvider, WebhookEvent } from '../models';
import { mapWebhookToDomainEventType } from '../mappers';
import { EnqueueWebhookRequest, ReplayDeadLetterDto, WebhookSecretConfig, WebhookValidationConfig } from './dtos';
import {
  DeadLetterRepository,
  ProcessedEventRepository,
  WebhookAuditRepository,
  WebhookQueueRepository
} from './repository';
import { DomainEventHandler, DomainEventPayload, QueuedWebhookEvent, WebhookAuditRecord } from './models';
import { validateWebhookSignature } from './signatures';

export class WebhookRejectedError extends Error {
  constructor(message: string, readonly statusCode = 401) {
    super(message);
  }
}

const normalizeHeaders = (headers: Record<string, string | undefined>): Record<string, string> =>
  Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key.toLowerCase()] = value;
    }
    return acc;
  }, {});

const parsePayload = (rawBody: string): Record<string, unknown> => {
  if (!rawBody.trim()) {
    return {};
  }

  return JSON.parse(rawBody) as Record<string, unknown>;
};

export class WebhookIngestionService {
  constructor(
    private readonly payments: PaymentService,
    private readonly auditRepository: WebhookAuditRepository,
    private readonly queueRepository: WebhookQueueRepository,
    private readonly secrets: WebhookSecretConfig,
    private readonly config: WebhookValidationConfig
  ) {}

  async ingest(input: EnqueueWebhookRequest): Promise<{ accepted: true; eventId: string; auditRecordId: string }> {
    const verification = validateWebhookSignature(input.provider, input.request, this.secrets, this.config);
    const auditRecordId = randomUUID();
    const payload = input.request.payload ?? parsePayload(input.request.rawBody);

    const baseAuditRecord: WebhookAuditRecord = {
      id: auditRecordId,
      provider: input.provider,
      endpoint: input.endpoint,
      receivedAt: new Date().toISOString(),
      rawPayload: input.request.rawBody,
      headers: normalizeHeaders(input.request.headers),
      verification,
      processingStatus: verification.isValid ? 'queued' : 'rejected'
    };

    if (!verification.isValid) {
      await this.auditRepository.save(baseAuditRecord);
      throw new WebhookRejectedError(verification.reason ?? 'Webhook signature validation failed.', 401);
    }

    const event = await this.payments.handleWebhook(
      {
        provider: input.provider,
        payload,
        signature: undefined
      },
      { correlationId: input.correlationId }
    );

    if (!event.id) {
      await this.auditRepository.save({
        ...baseAuditRecord,
        processingStatus: 'rejected',
        processingError: 'Webhook payload missing provider event id.',
        eventType: event.type
      });
      throw new WebhookRejectedError('Webhook payload missing provider event id.', 400);
    }

    const internalEventType = mapWebhookToDomainEventType(event.type, input.provider);
    if (!internalEventType) {
      await this.auditRepository.save({
        ...baseAuditRecord,
        processingStatus: 'rejected',
        eventId: event.id,
        eventType: event.type,
        processingError: `Unsupported webhook event type: ${event.type}`
      });
      throw new WebhookRejectedError(`Unsupported webhook event type: ${event.type}`, 400);
    }

    const queued: QueuedWebhookEvent = {
      queueId: randomUUID(),
      eventId: event.id,
      provider: input.provider,
      internalEventType,
      webhookEvent: event,
      auditRecordId,
      attempts: 0,
      queuedAt: new Date().toISOString()
    };

    await this.auditRepository.save({
      ...baseAuditRecord,
      eventId: event.id,
      eventType: event.type,
      internalEventType,
      processingStatus: 'queued'
    });
    await this.queueRepository.enqueue(queued);

    return { accepted: true, eventId: event.id, auditRecordId };
  }
}

export class WebhookQueueWorker {
  constructor(
    private readonly queueRepository: WebhookQueueRepository,
    private readonly deadLetterRepository: DeadLetterRepository,
    private readonly processedEventRepository: ProcessedEventRepository,
    private readonly auditRepository: WebhookAuditRepository,
    private readonly handlers: Record<string, DomainEventHandler>,
    private readonly config: Pick<WebhookValidationConfig, 'maxProcessingAttempts'>
  ) {}

  async processNext(): Promise<{ processed: number; deadLettered: number; skipped: number }> {
    const next = await this.queueRepository.dequeue();
    if (!next) {
      return { processed: 0, deadLettered: 0, skipped: 0 };
    }

    if (await this.processedEventRepository.has(next.eventId)) {
      await this.auditRepository.update(next.auditRecordId, { processingStatus: 'processed' });
      return { processed: 0, deadLettered: 0, skipped: 1 };
    }

    try {
      const handler = this.handlers[next.internalEventType];
      if (!handler) {
        throw new Error(`No handler configured for ${next.internalEventType}`);
      }

      await handler(this.toDomainEvent(next.provider, next.internalEventType, next.webhookEvent));
      await this.processedEventRepository.markProcessed(next.eventId);
      await this.auditRepository.update(next.auditRecordId, { processingStatus: 'processed' });
      return { processed: 1, deadLettered: 0, skipped: 0 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown queue processing error.';
      const attempts = next.attempts + 1;

      if (attempts >= this.config.maxProcessingAttempts) {
        await this.deadLetterRepository.add({
          ...next,
          attempts,
          failedAt: new Date().toISOString(),
          error: errorMessage
        });
        await this.auditRepository.update(next.auditRecordId, {
          processingStatus: 'dead_lettered',
          processingError: errorMessage
        });
        return { processed: 0, deadLettered: 1, skipped: 0 };
      }

      await this.queueRepository.enqueue({ ...next, attempts });
      await this.auditRepository.update(next.auditRecordId, {
        processingStatus: 'queued',
        processingError: errorMessage
      });
      return { processed: 0, deadLettered: 0, skipped: 0 };
    }
  }

  async processBatch(limit = 25): Promise<{ processed: number; deadLettered: number; skipped: number }> {
    let processed = 0;
    let deadLettered = 0;
    let skipped = 0;

    for (let index = 0; index < limit; index += 1) {
      const result = await this.processNext();
      if (result.processed === 0 && result.deadLettered === 0 && result.skipped === 0) {
        break;
      }

      processed += result.processed;
      deadLettered += result.deadLettered;
      skipped += result.skipped;
    }

    return { processed, deadLettered, skipped };
  }

  private toDomainEvent(provider: PaymentProvider, type: string, event: WebhookEvent): DomainEventPayload {
    return {
      eventId: event.id,
      provider,
      type: type as DomainEventPayload['type'],
      resourceId: event.resourceId,
      status: event.status,
      occurredAt: event.occurredAt,
      correlationId: event.correlationId,
      raw: event.raw
    };
  }
}

export class WebhookReplayService {
  constructor(
    private readonly deadLetterRepository: DeadLetterRepository,
    private readonly queueRepository: WebhookQueueRepository,
    private readonly auditRepository: WebhookAuditRepository
  ) {}

  async replay(input: ReplayDeadLetterDto = {}): Promise<{ requeued: number }> {
    if (input.eventId) {
      const event = await this.deadLetterRepository.find(input.eventId);
      if (!event) {
        return { requeued: 0 };
      }

      await this.queueRepository.enqueue({ ...event, attempts: 0, queueId: randomUUID(), queuedAt: new Date().toISOString() });
      await this.deadLetterRepository.remove(event.eventId);
      await this.auditRepository.update(event.auditRecordId, {
        processingStatus: 'queued',
        processingError: undefined
      });
      return { requeued: 1 };
    }

    const deadLetters = await this.deadLetterRepository.list(input.maxCount);
    for (const event of deadLetters) {
      await this.queueRepository.enqueue({ ...event, attempts: 0, queueId: randomUUID(), queuedAt: new Date().toISOString() });
      await this.deadLetterRepository.remove(event.eventId);
      await this.auditRepository.update(event.auditRecordId, {
        processingStatus: 'queued',
        processingError: undefined
      });
    }

    return { requeued: deadLetters.length };
  }
}

export const buildDefaultDomainHandlers = (): Record<string, DomainEventHandler> => ({
  payment_succeeded: async () => undefined,
  payment_failed: async () => undefined,
  refund_completed: async () => undefined,
  dispute_opened: async () => undefined,
  subscription_updated: async () => undefined
});

export const toHandleWebhookDto = (provider: PaymentProvider, payload: Record<string, unknown>): HandleWebhookDto => ({
  provider,
  payload
});

export const toRequestContext = (correlationId: string): RequestContext => ({
  correlationId
});
