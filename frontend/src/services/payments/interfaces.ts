import {
  Charge,
  NormalizedPaymentError,
  PaymentIntent,
  Refund,
  Subscription,
  WebhookEvent
} from '../../types/payments';

export type RequestMeta = {
  correlationId: string;
  idempotencyKey?: string;
  permissions?: string[];
};

export type CreatePaymentIntentInput = {
  amount: number;
  currency: string;
  paymentMethodId?: string;
  customerId?: string;
  metadata?: Record<string, string>;
};

export type CapturePaymentInput = {
  paymentIntentId: string;
  amountToCapture?: number;
};

export type RefundPaymentInput = {
  chargeId: string;
  amount?: number;
  reason: string;
  stepUpToken: string;
};

export type CreateSubscriptionInput = {
  customerId: string;
  planId: string;
  trialEnd?: string;
};

export type CancelSubscriptionInput = {
  subscriptionId: string;
  reason: string;
  stepUpToken: string;
};

export type DisputeSummary = {
  id: string;
  provider: string;
  chargeId: string;
  status: 'needs_response' | 'under_review' | 'won' | 'lost' | 'closed';
};

export type PaymentServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: NormalizedPaymentError };

export interface PaymentsService {
  createIntent(input: CreatePaymentIntentInput, meta: RequestMeta): Promise<PaymentServiceResult<PaymentIntent>>;
  captureIntent(input: CapturePaymentInput, meta: RequestMeta): Promise<PaymentServiceResult<Charge>>;
  createRefund(input: RefundPaymentInput, meta: RequestMeta): Promise<PaymentServiceResult<Refund>>;
  createSubscription(input: CreateSubscriptionInput, meta: RequestMeta): Promise<PaymentServiceResult<Subscription>>;
  cancelSubscription(input: CancelSubscriptionInput, meta: RequestMeta): Promise<PaymentServiceResult<{ ok: true }>>;
  listDisputes(meta: RequestMeta): Promise<PaymentServiceResult<DisputeSummary[]>>;
  mapWebhookToEvent(payload: unknown, provider: string, meta: RequestMeta): PaymentServiceResult<WebhookEvent>;
}
