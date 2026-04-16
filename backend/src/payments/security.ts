import { createHash } from 'crypto';
import { TransactionCenterRole } from './transaction-center/models';

const SENSITIVE_FIELD_PATTERN = /(pan|card(number)?|cvv|cvc|security.?code|expiry|exp_month|exp_year|iban|account_number|routing_number|tokenized_pan)/i;
const PAN_PATTERN = /\b(?:\d[ -]*?){13,19}\b/;

const maskString = (value: string): string => {
  if (PAN_PATTERN.test(value)) {
    return value.replace(/\d(?=\d{4})/g, '*');
  }

  return value;
};

export const maskSensitiveValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => maskSensitiveValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, entry]) => {
      if (SENSITIVE_FIELD_PATTERN.test(key)) {
        acc[key] = '[REDACTED]';
        return acc;
      }

      acc[key] = maskSensitiveValue(entry);
      return acc;
    }, {});
  }

  if (typeof value === 'string') {
    return maskString(value);
  }

  return value;
};

export const sanitizeAnalyticsEvent = (
  eventName: string,
  payload: Record<string, unknown>
): { eventName: string; payload: Record<string, unknown> } => ({
  eventName,
  payload: maskSensitiveValue(payload) as Record<string, unknown>
});

export const assertTokenizedPaymentOnly = (input: {
  paymentMethodToken?: string;
  metadata?: Record<string, string>;
  processorPayload?: Record<string, unknown>;
}): void => {
  if (!input.paymentMethodToken?.trim()) {
    throw new Error('A tokenized payment method is required. Raw PAN/CVV must never be sent to app systems.');
  }

  const serialized = JSON.stringify({ metadata: input.metadata, processorPayload: input.processorPayload });
  if (/("pan"|"cardNumber"|"cvv"|"cvc")/i.test(serialized)) {
    throw new Error('Raw cardholder data fields detected in request payload. Use tokenized provider payloads only.');
  }
};

export const maskPaymentAdminReference = (reference: string, role: TransactionCenterRole): string => {
  if (role === 'admin' || role === 'manager') {
    return reference;
  }

  const hash = createHash('sha256').update(reference).digest('hex').slice(0, 12);
  return `restricted_${hash}`;
};

export type ProviderSecretConfig = {
  managerKey: string;
  env: 'dev' | 'staging' | 'prod';
  rotatedAt: string;
};

export const assertSecretManagerConfig = (configByProvider: Record<string, ProviderSecretConfig>): void => {
  for (const [provider, config] of Object.entries(configByProvider)) {
    if (!config.managerKey.startsWith('sm://')) {
      throw new Error(`Provider ${provider} must source secrets from secure secret manager URI (sm://...).`);
    }

    if (!config.rotatedAt) {
      throw new Error(`Provider ${provider} must declare last secret rotation timestamp.`);
    }
  }

  const envs = new Set(Object.values(configByProvider).map((entry) => entry.env));
  if (envs.size !== 1) {
    throw new Error('Secret configuration must be environment-separated; do not mix environments in one deployment config.');
  }
};
