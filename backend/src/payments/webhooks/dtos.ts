import { PaymentProvider } from '../models';
import { WebhookEndpoint } from './models';

export type WebhookHttpRequest = {
  rawBody: string;
  headers: Record<string, string | undefined>;
  payload?: Record<string, unknown>;
};

export type EnqueueWebhookRequest = {
  provider: PaymentProvider;
  endpoint: WebhookEndpoint;
  request: WebhookHttpRequest;
  correlationId: string;
};

export type ReplayDeadLetterDto = {
  eventId?: string;
  maxCount?: number;
};

export type WebhookSecretConfig = {
  stripeSigningSecret: string;
  paypalTransmissionSecret: string;
  googlePaySigningSecret?: string;
};

export type WebhookValidationConfig = {
  timestampToleranceSeconds: number;
  enableGooglePayDirectEvents: boolean;
  maxProcessingAttempts: number;
};
