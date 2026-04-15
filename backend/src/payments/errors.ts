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

const providerCodeMap: Record<string, PaymentErrorCode> = {
  card_declined: 'PAYMENT_DECLINED',
  authentication_required: 'PAYMENT_AUTHENTICATION_REQUIRED',
  resource_missing: 'PAYMENT_NOT_FOUND',
  payment_intent_unexpected_state: 'PAYMENT_ALREADY_CAPTURED',
  idempotency_key_in_use: 'PAYMENT_IDEMPOTENCY_CONFLICT',
  invalid_request_error: 'PAYMENT_INVALID_REQUEST',
  service_unavailable: 'PAYMENT_PROVIDER_UNAVAILABLE',
  invalid_signature: 'PAYMENT_WEBHOOK_INVALID_SIGNATURE'
};

export const normalizeProviderError = (
  error: unknown,
  opts: { correlationId?: string; provider?: string } = {}
): NormalizedPaymentError => {
  if (error && typeof error === 'object') {
    const obj = error as { code?: string; message?: string; details?: Record<string, unknown>; retryable?: boolean };
    const code = providerCodeMap[obj.code ?? ''] ?? 'PAYMENT_UNKNOWN_ERROR';

    return {
      code,
      message: obj.message ?? 'Payment provider returned an error.',
      retryable: obj.retryable ?? code === 'PAYMENT_PROVIDER_UNAVAILABLE' || code === 'PAYMENT_UNKNOWN_ERROR',
      correlationId: opts.correlationId,
      provider: opts.provider,
      details: obj.details
    };
  }

  return {
    code: 'PAYMENT_UNKNOWN_ERROR',
    message: typeof error === 'string' ? error : 'Payment provider returned an unknown error.',
    retryable: true,
    correlationId: opts.correlationId,
    provider: opts.provider
  };
};
