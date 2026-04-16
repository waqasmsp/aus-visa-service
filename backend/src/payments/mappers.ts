import { PaymentProvider, WebhookEvent } from './models';
import { InternalPaymentDomainEventType } from './webhooks/models';

const statusMap: Record<string, string> = {
  succeeded: 'succeeded',
  failed: 'failed',
  pending: 'processing',
  requires_capture: 'requires_capture',
  canceled: 'canceled'
};

const providerEventToDomainEventMap: Record<PaymentProvider, Record<string, InternalPaymentDomainEventType>> = {
  stripe: {
    'payment_intent.succeeded': 'payment_succeeded',
    'payment_intent.payment_failed': 'payment_failed',
    'charge.refunded': 'refund_completed',
    'charge.dispute.created': 'dispute_opened',
    'customer.subscription.updated': 'subscription_updated'
  },
  paypal: {
    'payment.capture.completed': 'payment_succeeded',
    'payment.capture.denied': 'payment_failed',
    'payment.capture.refunded': 'refund_completed',
    'customer.dispute.created': 'dispute_opened',
    'billing.subscription.updated': 'subscription_updated'
  },
  googlepay: {
    'payment.succeeded': 'payment_succeeded',
    'payment.failed': 'payment_failed',
    'refund.completed': 'refund_completed',
    'dispute.opened': 'dispute_opened',
    'subscription.updated': 'subscription_updated'
  }
};

export const mapProviderStatus = (status: string | undefined): string => {
  if (!status) {
    return 'unknown';
  }

  return statusMap[status.toLowerCase()] ?? 'unknown';
};

export const mapWebhookToDomainEventType = (
  providerEventType: string,
  provider: PaymentProvider
): InternalPaymentDomainEventType | null => {
  const normalizedType = providerEventType.toLowerCase();
  return providerEventToDomainEventMap[provider][normalizedType] ?? null;
};

export const mapProviderEvent = (
  payload: Record<string, unknown>,
  provider: PaymentProvider,
  correlationId?: string
): WebhookEvent => {
  const type = String(payload.type ?? 'unknown').toLowerCase();
  const object = (payload.data as { object?: { id?: string; status?: string } } | undefined)?.object;

  return {
    id: String(payload.id ?? ''),
    provider,
    type,
    occurredAt: String(payload.created ?? new Date().toISOString()),
    resourceId: object?.id ?? '',
    status: mapProviderStatus(object?.status),
    correlationId,
    raw: payload
  };
};
