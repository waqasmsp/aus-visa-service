import { PaymentProvider } from './models';

export type RequestContext = {
  correlationId: string;
  idempotencyKey?: string;
};

export type CreatePaymentIntentDto = {
  amount: number;
  currency: string;
  paymentMethodId?: string;
  customerId?: string;
  metadata?: Record<string, string>;
};

export type CapturePaymentIntentDto = {
  paymentIntentId: string;
  amountToCapture?: number;
};

export type CreateRefundDto = {
  chargeId: string;
  amount?: number;
  reason?: string;
};

export type CreateSubscriptionDto = {
  customerId: string;
  planId: string;
  trialEnd?: string;
};

export type HandleWebhookDto = {
  provider: PaymentProvider;
  payload: Record<string, unknown>;
  signature?: string;
};

export const assertIdempotentRequest = (context: RequestContext): void => {
  if (!context.idempotencyKey) {
    throw new Error('Idempotency-Key header is required for create/capture/refund operations.');
  }

  if (!context.correlationId) {
    throw new Error('x-correlation-id header is required for payment operations.');
  }
};

export const assertTraceableRequest = (context: RequestContext): void => {
  if (!context.correlationId) {
    throw new Error('x-correlation-id header is required for payment operations.');
  }
};
