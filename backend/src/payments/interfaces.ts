import {
  CapturePaymentIntentDto,
  CreatePaymentIntentDto,
  CreateRefundDto,
  CreateSubscriptionDto,
  HandleWebhookDto,
  RequestContext
} from './dtos';
import { Charge, Dispute, PaymentIntent, Refund, Subscription, WebhookEvent } from './models';

export interface PaymentsAdapter {
  readonly provider: 'stripe' | 'paypal' | 'googlepay';
  createIntent(input: CreatePaymentIntentDto, context: RequestContext): Promise<PaymentIntent>;
  captureIntent(input: CapturePaymentIntentDto, context: RequestContext): Promise<Charge>;
  createRefund(input: CreateRefundDto, context: RequestContext): Promise<Refund>;
  createSubscription(input: CreateSubscriptionDto, context: RequestContext): Promise<Subscription>;
  listDisputes(context: RequestContext): Promise<Dispute[]>;
  parseWebhook(input: HandleWebhookDto, context: RequestContext): Promise<WebhookEvent>;
}

export interface PaymentService {
  createIntent(input: CreatePaymentIntentDto, context: RequestContext): Promise<PaymentIntent>;
  captureIntent(input: CapturePaymentIntentDto, context: RequestContext): Promise<Charge>;
  createRefund(input: CreateRefundDto, context: RequestContext): Promise<Refund>;
  createSubscription(input: CreateSubscriptionDto, context: RequestContext): Promise<Subscription>;
  listDisputes(context: RequestContext): Promise<Dispute[]>;
  handleWebhook(input: HandleWebhookDto, context: RequestContext): Promise<WebhookEvent>;
}
