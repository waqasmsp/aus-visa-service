import { normalizePaymentError } from './errors';
import { CheckoutSession, PaymentTransaction, ResumePaymentState } from '../../types/payments';
import { RequestMeta } from './interfaces';

export type CreateCheckoutSessionInput = {
  userId: string;
  applicationId: string;
  orderId: string;
  amount: number;
  currency: string;
  method: 'card' | 'paypal' | 'google_pay';
  provider?: 'stripe' | 'paypal' | 'googlepay';
  returnUrl: string;
  paymentMethodToken: string;
  ipAddress?: string;
  billingCountry?: string;
};

const requestHeaders = (meta: RequestMeta): HeadersInit => ({
  'Content-Type': 'application/json',
  'x-correlation-id': meta.correlationId,
  ...(meta.idempotencyKey ? { 'Idempotency-Key': meta.idempotencyKey } : {})
});

export class CheckoutApiClient {
  constructor(private readonly baseUrl = '/api/payments/checkout') {}

  async createSession(input: CreateCheckoutSessionInput, meta: RequestMeta): Promise<CheckoutSession> {
    const response = await fetch(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: requestHeaders(meta),
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      throw normalizePaymentError(await response.json());
    }

    return (await response.json()) as CheckoutSession;
  }

  async finalize(
    checkoutSessionId: string,
    provider: 'stripe' | 'paypal' | 'googlepay',
    processorPayload: Record<string, unknown>,
    avsResult?: 'match' | 'mismatch' | 'unavailable',
    cvvResult?: 'match' | 'mismatch' | 'unavailable'
  ): Promise<PaymentTransaction> {
    const response = await fetch(`${this.baseUrl}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkoutSessionId, provider, processorPayload, avsResult, cvvResult })
    });

    if (!response.ok) {
      throw normalizePaymentError(await response.json());
    }

    return (await response.json()) as PaymentTransaction;
  }

  async resume(checkoutSessionId: string, provider: 'stripe' | 'paypal' | 'googlepay', redirectStatus?: string) {
    const params = new URLSearchParams({
      checkoutSessionId,
      provider,
      ...(redirectStatus ? { redirectStatus } : {})
    });
    const response = await fetch(`${this.baseUrl}/resume?${params.toString()}`);

    if (!response.ok) {
      throw normalizePaymentError(await response.json());
    }

    return (await response.json()) as ResumePaymentState;
  }
}
