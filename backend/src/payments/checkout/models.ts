import { PaymentProvider } from '../models';

export type CheckoutPaymentMethod = 'card' | 'paypal' | 'google_pay';

export type CheckoutState =
  | 'created'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'authorized'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export type CheckoutOrder = {
  id: string;
  userId: string;
  applicationId: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
};

export type CheckoutSession = {
  checkoutSessionId: string;
  orderId: string;
  applicationId: string;
  userId: string;
  provider: PaymentProvider;
  method: CheckoutPaymentMethod;
  state: CheckoutState;
  paymentIntentId: string;
  clientSecret?: string;
  approvalUrl?: string;
  requiresActionRedirectUrl?: string;
  returnUrl: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
};

export type TransactionRecord = {
  id: string;
  checkoutSessionId: string;
  provider: PaymentProvider;
  method: CheckoutPaymentMethod;
  userId: string;
  applicationId: string;
  orderId: string;
  amount: number;
  currency: string;
  state: 'succeeded' | 'failed' | 'processing';
  failureCode?: string;
  failureReason?: string;
  processorReference: string;
  createdAt: string;
  updatedAt: string;
};

export type ResumeCheckoutState = {
  checkoutSessionId: string;
  orderId: string;
  status: CheckoutState;
  message: string;
  provider: PaymentProvider;
  method: CheckoutPaymentMethod;
  shouldRetry: boolean;
  canSwitchMethod: boolean;
  requiresActionRedirectUrl?: string;
};
