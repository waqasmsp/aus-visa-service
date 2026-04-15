import {
  CapturePaymentIntentDto,
  CreatePaymentIntentDto,
  CreateRefundDto,
  CreateSubscriptionDto,
  HandleWebhookDto,
  RequestContext,
  assertIdempotentRequest,
  assertTraceableRequest
} from '../dtos';
import { PaymentsAdapter } from '../interfaces';
import { Charge, Dispute, PaymentIntent, Refund, Subscription, WebhookEvent } from '../models';
import { mapProviderEvent } from '../mappers';

export class StripeAdapter implements PaymentsAdapter {
  readonly provider = 'stripe' as const;

  async createIntent(input: CreatePaymentIntentDto, context: RequestContext): Promise<PaymentIntent> {
    assertIdempotentRequest(context);
    return {
      id: `pi_${Date.now()}`,
      provider: this.provider,
      status: 'requires_confirmation',
      amount: { value: input.amount, currency: input.currency },
      paymentMethodId: input.paymentMethodId,
      customerId: input.customerId,
      metadata: input.metadata,
      createdAt: new Date().toISOString()
    };
  }

  async captureIntent(input: CapturePaymentIntentDto, context: RequestContext): Promise<Charge> {
    assertIdempotentRequest(context);
    return {
      id: `ch_${Date.now()}`,
      intentId: input.paymentIntentId,
      provider: this.provider,
      status: 'succeeded',
      amount: { value: input.amountToCapture ?? 0, currency: 'USD' },
      paidAt: new Date().toISOString()
    };
  }

  async createRefund(input: CreateRefundDto, context: RequestContext): Promise<Refund> {
    assertIdempotentRequest(context);
    return {
      id: `re_${Date.now()}`,
      chargeId: input.chargeId,
      provider: this.provider,
      status: 'pending',
      amount: { value: input.amount ?? 0, currency: 'USD' },
      reason: input.reason,
      createdAt: new Date().toISOString()
    };
  }

  async createSubscription(input: CreateSubscriptionDto, context: RequestContext): Promise<Subscription> {
    assertTraceableRequest(context);
    const now = new Date();
    return {
      id: `sub_${Date.now()}`,
      provider: this.provider,
      status: 'active',
      customerId: input.customerId,
      planId: input.planId,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString()
    };
  }

  async listDisputes(context: RequestContext): Promise<Dispute[]> {
    assertTraceableRequest(context);
    return [];
  }

  async parseWebhook(input: HandleWebhookDto, context: RequestContext): Promise<WebhookEvent> {
    assertTraceableRequest(context);
    return mapProviderEvent(input.payload, this.provider, context.correlationId);
  }
}
