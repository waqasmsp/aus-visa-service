import {
  Charge,
  PaymentIntent,
  Refund,
  Subscription,
  WebhookEvent
} from '../../types/payments';
import { normalizePaymentError } from './errors';
import { mapProviderWebhookEvent } from './mappers';
import {
  CapturePaymentInput,
  CreatePaymentIntentInput,
  CreateSubscriptionInput,
  DisputeSummary,
  PaymentsService,
  PaymentServiceResult,
  RefundPaymentInput,
  RequestMeta,
  CancelSubscriptionInput
} from './interfaces';

const withRequiredHeaders = (meta: RequestMeta, requireIdempotency = false): HeadersInit => {
  if (!meta.correlationId) {
    throw normalizePaymentError({
      code: 'PAYMENT_INVALID_REQUEST',
      message: 'x-correlation-id is required for all payment requests.',
      retryable: false
    });
  }

  if (requireIdempotency && !meta.idempotencyKey) {
    throw normalizePaymentError({
      code: 'PAYMENT_INVALID_REQUEST',
      message: 'Idempotency-Key is required for create/capture/refund payment requests.',
      retryable: false
    });
  }

  return {
    'Content-Type': 'application/json',
    'x-correlation-id': meta.correlationId,
    ...(meta.idempotencyKey ? { 'Idempotency-Key': meta.idempotencyKey } : {}),
    ...(meta.permissions?.length ? { 'x-permissions': meta.permissions.join(',') } : {})
  };
};

const toResult = async <T>(response: Response): Promise<PaymentServiceResult<T>> => {
  if (response.ok) {
    return { ok: true, data: (await response.json()) as T };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = await response.text();
  }

  return {
    ok: false,
    error: normalizePaymentError(payload)
  };
};

export class ApiPaymentsService implements PaymentsService {
  constructor(private readonly baseUrl = '/api/payments') {}

  async createIntent(input: CreatePaymentIntentInput, meta: RequestMeta): Promise<PaymentServiceResult<PaymentIntent>> {
    const response = await fetch(`${this.baseUrl}/intents`, {
      method: 'POST',
      headers: withRequiredHeaders(meta, true),
      body: JSON.stringify(input)
    });

    return toResult<PaymentIntent>(response);
  }

  async captureIntent(input: CapturePaymentInput, meta: RequestMeta): Promise<PaymentServiceResult<Charge>> {
    const response = await fetch(`${this.baseUrl}/intents/${input.paymentIntentId}/capture`, {
      method: 'POST',
      headers: withRequiredHeaders(meta, true),
      body: JSON.stringify(input)
    });

    return toResult<Charge>(response);
  }

  async createRefund(input: RefundPaymentInput, meta: RequestMeta): Promise<PaymentServiceResult<Refund>> {
    const response = await fetch(`${this.baseUrl}/refunds`, {
      method: 'POST',
      headers: withRequiredHeaders(meta, true),
      body: JSON.stringify(input)
    });

    return toResult<Refund>(response);
  }

  async createSubscription(
    input: CreateSubscriptionInput,
    meta: RequestMeta
  ): Promise<PaymentServiceResult<Subscription>> {
    const response = await fetch(`${this.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: withRequiredHeaders(meta),
      body: JSON.stringify(input)
    });

    return toResult<Subscription>(response);
  }


  async cancelSubscription(input: CancelSubscriptionInput, meta: RequestMeta): Promise<PaymentServiceResult<{ ok: true }>> {
    const response = await fetch(`${this.baseUrl}/subscriptions/${input.subscriptionId}/cancel`, {
      method: 'POST',
      headers: withRequiredHeaders(meta),
      body: JSON.stringify(input)
    });

    return toResult<{ ok: true }>(response);
  }

  async listDisputes(meta: RequestMeta): Promise<PaymentServiceResult<DisputeSummary[]>> {
    const response = await fetch(`${this.baseUrl}/disputes`, {
      method: 'GET',
      headers: withRequiredHeaders(meta)
    });

    return toResult<DisputeSummary[]>(response);
  }

  mapWebhookToEvent(payload: unknown, provider: string, meta: RequestMeta): PaymentServiceResult<WebhookEvent> {
    if (!payload || typeof payload !== 'object') {
      return {
        ok: false,
        error: normalizePaymentError(
          { code: 'PAYMENT_INVALID_REQUEST', message: 'Webhook payload must be an object.', retryable: false },
          { correlationId: meta.correlationId, provider }
        )
      };
    }

    const webhookPayload = payload as Record<string, unknown>;
    return {
      ok: true,
      data: mapProviderWebhookEvent(
        webhookPayload,
        provider as WebhookEvent['provider'],
        meta.correlationId
      )
    };
  }
}
