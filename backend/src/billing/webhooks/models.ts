import { SubscriptionState } from '../subscriptions/models';

export type BillingWebhookEvent = {
  id: string;
  provider: 'stripe' | 'paypal';
  type: 'subscription.updated' | 'invoice.payment_failed' | 'invoice.paid';
  subscriptionId: string;
  status?: SubscriptionState;
  occurredAt: string;
  payload: unknown;
};
