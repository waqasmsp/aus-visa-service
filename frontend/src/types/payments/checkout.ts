import { PaymentProvider } from './models';

export type CheckoutMethod = 'card' | 'paypal' | 'google_pay';

export type CheckoutStatus =
  | 'created'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'authorized'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export type CheckoutSession = {
  checkoutSessionId: string;
  orderId: string;
  applicationId: string;
  userId: string;
  provider: PaymentProvider;
  method: CheckoutMethod;
  state: CheckoutStatus;
  paymentIntentId: string;
  clientSecret?: string;
  approvalUrl?: string;
  requiresActionRedirectUrl?: string;
  returnUrl: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentTransaction = {
  id: string;
  checkoutSessionId: string;
  provider: PaymentProvider;
  method: CheckoutMethod;
  orderId: string;
  userId: string;
  applicationId: string;
  amount: number;
  currency: string;
  state: 'succeeded' | 'failed' | 'processing';
  failureCode?: string;
  failureReason?: string;
  processorReference: string;
  createdAt: string;
  updatedAt: string;
};

export type ResumePaymentState = {
  checkoutSessionId: string;
  orderId: string;
  status: CheckoutStatus;
  message: string;
  provider: PaymentProvider;
  method: CheckoutMethod;
  shouldRetry: boolean;
  canSwitchMethod: boolean;
  requiresActionRedirectUrl?: string;
};
