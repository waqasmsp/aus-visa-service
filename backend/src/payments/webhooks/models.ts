import { PaymentProvider, WebhookEvent } from '../models';

export type InternalPaymentDomainEventType =
  | 'payment_succeeded'
  | 'payment_failed'
  | 'refund_completed'
  | 'dispute_opened'
  | 'subscription_updated';

export type WebhookEndpoint = '/api/webhooks/stripe' | '/api/webhooks/paypal' | '/api/webhooks/payments/googlepay';

export type WebhookVerificationResult = {
  isValid: boolean;
  reason?: string;
  signaturePresent: boolean;
  timestamp?: number;
  timestampAgeSeconds?: number;
  algorithm?: string;
};

export type WebhookAuditRecord = {
  id: string;
  provider: PaymentProvider;
  endpoint: WebhookEndpoint;
  receivedAt: string;
  rawPayload: string;
  headers: Record<string, string>;
  verification: WebhookVerificationResult;
  eventId?: string;
  eventType?: string;
  internalEventType?: InternalPaymentDomainEventType;
  processingStatus: 'rejected' | 'queued' | 'processed' | 'dead_lettered';
  processingError?: string;
};

export type QueuedWebhookEvent = {
  queueId: string;
  eventId: string;
  provider: PaymentProvider;
  internalEventType: InternalPaymentDomainEventType;
  webhookEvent: WebhookEvent;
  auditRecordId: string;
  attempts: number;
  queuedAt: string;
};

export type DeadLetterWebhookEvent = QueuedWebhookEvent & {
  failedAt: string;
  error: string;
};

export type DomainEventPayload = {
  eventId: string;
  provider: PaymentProvider;
  type: InternalPaymentDomainEventType;
  resourceId: string;
  status?: string;
  occurredAt: string;
  correlationId?: string;
  raw?: unknown;
};

export type DomainEventHandler = (event: DomainEventPayload) => Promise<void>;
