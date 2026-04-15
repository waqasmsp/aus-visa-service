import { NormalizedPaymentError, PaymentErrorCode } from '../../types/payments';

const isRetryable = (code: PaymentErrorCode): boolean => {
  return code === 'PAYMENT_PROVIDER_UNAVAILABLE' || code === 'PAYMENT_UNKNOWN_ERROR';
};

export const normalizePaymentError = (
  input: unknown,
  defaults: { code?: PaymentErrorCode; correlationId?: string; provider?: string } = {}
): NormalizedPaymentError => {
  if (input && typeof input === 'object') {
    const candidate = input as Partial<NormalizedPaymentError>;
    const code = (candidate.code as PaymentErrorCode | undefined) ?? defaults.code ?? 'PAYMENT_UNKNOWN_ERROR';

    return {
      code,
      message: candidate.message ?? 'Unable to process payment request.',
      retryable: candidate.retryable ?? isRetryable(code),
      correlationId: candidate.correlationId ?? defaults.correlationId,
      provider: candidate.provider ?? defaults.provider,
      details: candidate.details
    };
  }

  return {
    code: defaults.code ?? 'PAYMENT_UNKNOWN_ERROR',
    message: typeof input === 'string' ? input : 'Unable to process payment request.',
    retryable: true,
    correlationId: defaults.correlationId,
    provider: defaults.provider
  };
};
