import { PaymentProvider, PaymentStatus, WebhookEvent } from '../../types/payments';

const providerStatusMap: Record<string, PaymentStatus> = {
  requires_payment_method: 'requires_payment_method',
  requires_confirmation: 'requires_confirmation',
  requires_capture: 'requires_capture',
  processing: 'processing',
  succeeded: 'succeeded',
  partially_refunded: 'partially_refunded',
  refunded: 'refunded',
  failed: 'failed',
  canceled: 'canceled'
};

export const mapProviderStatus = (status: string | undefined): PaymentStatus => {
  if (!status) {
    return 'unknown';
  }

  return providerStatusMap[status.toLowerCase()] ?? 'unknown';
};

const providerEventMap: Record<string, WebhookEvent['type']> = {
  'payment_intent.succeeded': 'payment_intent.updated',
  'payment_intent.payment_failed': 'payment_intent.updated',
  'charge.succeeded': 'charge.updated',
  'charge.failed': 'charge.updated',
  'refund.created': 'refund.updated',
  'customer.subscription.updated': 'subscription.updated',
  'invoice.paid': 'invoice.updated',
  'charge.dispute.created': 'dispute.updated',
  'payout.paid': 'payout.updated'
};

export const mapProviderWebhookEvent = (
  payload: Record<string, unknown>,
  provider: PaymentProvider,
  correlationId?: string
): WebhookEvent => {
  const eventType = (payload.type as string | undefined)?.toLowerCase() ?? 'unknown';
  const data = (payload.data as { object?: { id?: string; status?: string } } | undefined)?.object;

  return {
    id: String(payload.id ?? ''),
    provider,
    type: providerEventMap[eventType] ?? 'unknown',
    occurredAt: String(payload.created ?? new Date().toISOString()),
    resourceId: data?.id ?? '',
    status: mapProviderStatus(data?.status),
    correlationId,
    raw: payload
  };
};
