import { createHmac, timingSafeEqual } from 'crypto';
import { PaymentProvider } from '../models';
import { WebhookHttpRequest, WebhookSecretConfig, WebhookValidationConfig } from './dtos';
import { WebhookVerificationResult } from './models';

const toCanonicalHeaders = (headers: Record<string, string | undefined>): Record<string, string> =>
  Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key.toLowerCase()] = value;
    }
    return acc;
  }, {});

const hmacSha256 = (secret: string, payload: string): string => createHmac('sha256', secret).update(payload).digest('hex');

const safeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

const ageSecondsFromNow = (timestamp: number): number => Math.abs(Math.floor(Date.now() / 1000) - timestamp);

const reject = (reason: string, signaturePresent = false): WebhookVerificationResult => ({
  isValid: false,
  reason,
  signaturePresent
});

const validateStripeSignature = (
  request: WebhookHttpRequest,
  secret: WebhookSecretConfig,
  config: WebhookValidationConfig
): WebhookVerificationResult => {
  const headers = toCanonicalHeaders(request.headers);
  const signatureHeader = headers['stripe-signature'];

  if (!signatureHeader) {
    return reject('Missing Stripe signature header.', false);
  }

  const parts = Object.fromEntries(signatureHeader.split(',').map((part) => part.split('=').map((value) => value.trim())));
  const timestamp = Number(parts.t);
  const expectedSignature = parts.v1;

  if (!timestamp || !expectedSignature) {
    return reject('Malformed Stripe signature header.', true);
  }

  const timestampAgeSeconds = ageSecondsFromNow(timestamp);
  if (timestampAgeSeconds > config.timestampToleranceSeconds) {
    return {
      isValid: false,
      reason: 'Stripe signature timestamp outside tolerance window.',
      signaturePresent: true,
      timestamp,
      timestampAgeSeconds,
      algorithm: 'hmac-sha256'
    };
  }

  const computed = hmacSha256(secret.stripeSigningSecret, `${timestamp}.${request.rawBody}`);
  if (!safeEqual(computed, expectedSignature)) {
    return {
      isValid: false,
      reason: 'Stripe signature mismatch.',
      signaturePresent: true,
      timestamp,
      timestampAgeSeconds,
      algorithm: 'hmac-sha256'
    };
  }

  return {
    isValid: true,
    signaturePresent: true,
    timestamp,
    timestampAgeSeconds,
    algorithm: 'hmac-sha256'
  };
};

const validatePayPalSignature = (
  request: WebhookHttpRequest,
  secret: WebhookSecretConfig,
  config: WebhookValidationConfig
): WebhookVerificationResult => {
  const headers = toCanonicalHeaders(request.headers);
  const signature = headers['paypal-transmission-sig'];
  const transmissionTimeRaw = headers['paypal-transmission-time'];

  if (!signature || !transmissionTimeRaw) {
    return reject('Missing PayPal signature headers.', Boolean(signature));
  }

  const transmissionTimestamp = Math.floor(Date.parse(transmissionTimeRaw) / 1000);
  if (!transmissionTimestamp) {
    return reject('Malformed PayPal transmission timestamp.', true);
  }

  const timestampAgeSeconds = ageSecondsFromNow(transmissionTimestamp);
  if (timestampAgeSeconds > config.timestampToleranceSeconds) {
    return {
      isValid: false,
      reason: 'PayPal signature timestamp outside tolerance window.',
      signaturePresent: true,
      timestamp: transmissionTimestamp,
      timestampAgeSeconds,
      algorithm: 'hmac-sha256'
    };
  }

  const computed = hmacSha256(secret.paypalTransmissionSecret, `${transmissionTimestamp}.${request.rawBody}`);
  if (!safeEqual(computed, signature)) {
    return {
      isValid: false,
      reason: 'PayPal signature mismatch.',
      signaturePresent: true,
      timestamp: transmissionTimestamp,
      timestampAgeSeconds,
      algorithm: 'hmac-sha256'
    };
  }

  return {
    isValid: true,
    signaturePresent: true,
    timestamp: transmissionTimestamp,
    timestampAgeSeconds,
    algorithm: 'hmac-sha256'
  };
};

const validateGooglePaySignature = (
  request: WebhookHttpRequest,
  secret: WebhookSecretConfig,
  config: WebhookValidationConfig
): WebhookVerificationResult => {
  if (!secret.googlePaySigningSecret) {
    return reject('Google Pay direct webhook secret is not configured.', false);
  }

  const headers = toCanonicalHeaders(request.headers);
  const signature = headers['x-googlepay-signature'];
  const timestampRaw = headers['x-googlepay-timestamp'];

  if (!signature || !timestampRaw) {
    return reject('Missing Google Pay signature headers.', Boolean(signature));
  }

  const timestamp = Number(timestampRaw);
  if (!timestamp) {
    return reject('Malformed Google Pay timestamp header.', true);
  }

  const timestampAgeSeconds = ageSecondsFromNow(timestamp);
  if (timestampAgeSeconds > config.timestampToleranceSeconds) {
    return {
      isValid: false,
      reason: 'Google Pay signature timestamp outside tolerance window.',
      signaturePresent: true,
      timestamp,
      timestampAgeSeconds,
      algorithm: 'hmac-sha256'
    };
  }

  const computed = hmacSha256(secret.googlePaySigningSecret, `${timestamp}.${request.rawBody}`);
  if (!safeEqual(computed, signature)) {
    return {
      isValid: false,
      reason: 'Google Pay signature mismatch.',
      signaturePresent: true,
      timestamp,
      timestampAgeSeconds,
      algorithm: 'hmac-sha256'
    };
  }

  return {
    isValid: true,
    signaturePresent: true,
    timestamp,
    timestampAgeSeconds,
    algorithm: 'hmac-sha256'
  };
};

export const validateWebhookSignature = (
  provider: PaymentProvider,
  request: WebhookHttpRequest,
  secret: WebhookSecretConfig,
  config: WebhookValidationConfig
): WebhookVerificationResult => {
  if (provider === 'stripe') {
    return validateStripeSignature(request, secret, config);
  }

  if (provider === 'paypal') {
    return validatePayPalSignature(request, secret, config);
  }

  return validateGooglePaySignature(request, secret, config);
};
