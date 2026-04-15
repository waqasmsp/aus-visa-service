export type PaymentErrorCode =
  | 'PAYMENT_DECLINED'
  | 'PAYMENT_AUTHENTICATION_REQUIRED'
  | 'PAYMENT_NOT_FOUND'
  | 'PAYMENT_ALREADY_CAPTURED'
  | 'PAYMENT_IDEMPOTENCY_CONFLICT'
  | 'PAYMENT_INVALID_REQUEST'
  | 'PAYMENT_PROVIDER_UNAVAILABLE'
  | 'PAYMENT_WEBHOOK_INVALID_SIGNATURE'
  | 'PAYMENT_UNKNOWN_ERROR';

export type NormalizedPaymentError = {
  code: PaymentErrorCode;
  message: string;
  retryable: boolean;
  correlationId?: string;
  provider?: string;
  details?: Record<string, unknown>;
};
