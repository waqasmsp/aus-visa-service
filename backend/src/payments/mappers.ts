import { PaymentProvider, WebhookEvent } from './models';

const eventMap: Record<string, WebhookEvent['type']> = {
  'payment_intent.succeeded': 'payment_intent.updated',
  'payment_intent.payment_failed': 'payment_intent.updated',
  'charge.succeeded': 'charge.updated',
  'charge.refunded': 'refund.updated',
  'customer.subscription.updated': 'subscription.updated',
  'invoice.paid': 'invoice.updated',
  'customer.dispute.updated': 'dispute.updated',
  'payout.paid': 'payout.updated'
};

const statusMap: Record<string, string> = {
  succeeded: 'succeeded',
  failed: 'failed',
  pending: 'processing',
  requires_capture: 'requires_capture',
  canceled: 'canceled'
};

export const mapProviderStatus = (status: string | undefined): string => {
  if (!status) {
    return 'unknown';
  }

  return statusMap[status.toLowerCase()] ?? 'unknown';
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
    type: eventMap[type] ?? 'unknown',
    occurredAt: String(payload.created ?? new Date().toISOString()),
    resourceId: object?.id ?? '',
    status: mapProviderStatus(object?.status),
    correlationId,
    raw: payload
  };
};
