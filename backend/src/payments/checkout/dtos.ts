import { PaymentProvider } from '../models';
import { CheckoutPaymentMethod } from './models';

export type CreateCheckoutSessionDto = {
  userId: string;
  applicationId: string;
  orderId: string;
  amount: number;
  currency: string;
  method: CheckoutPaymentMethod;
  provider?: PaymentProvider;
  returnUrl: string;
  metadata?: Record<string, string>;
};

export type FinalizeCheckoutSessionDto = {
  checkoutSessionId: string;
  provider: PaymentProvider;
  processorPayload: Record<string, unknown>;
};

export type ResumeCheckoutDto = {
  checkoutSessionId: string;
  provider: PaymentProvider;
  redirectStatus?: string;
};
