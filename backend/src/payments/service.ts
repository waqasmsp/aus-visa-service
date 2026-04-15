import {
  CapturePaymentIntentDto,
  CreatePaymentIntentDto,
  CreateRefundDto,
  CreateSubscriptionDto,
  HandleWebhookDto,
  RequestContext,
  assertIdempotentRequest,
  assertTraceableRequest
} from './dtos';
import { PaymentService, PaymentsAdapter } from './interfaces';
import { Charge, Dispute, PaymentIntent, Refund, Subscription, WebhookEvent } from './models';

export class DefaultPaymentService implements PaymentService {
  constructor(private readonly adapters: Record<string, PaymentsAdapter>, private readonly defaultProvider = 'stripe') {}

  private resolveAdapter(provider?: string): PaymentsAdapter {
    return this.adapters[provider ?? this.defaultProvider] ?? this.adapters[this.defaultProvider];
  }

  async createIntent(input: CreatePaymentIntentDto, context: RequestContext): Promise<PaymentIntent> {
    assertIdempotentRequest(context);
    return this.resolveAdapter().createIntent(input, context);
  }

  async captureIntent(input: CapturePaymentIntentDto, context: RequestContext): Promise<Charge> {
    assertIdempotentRequest(context);
    return this.resolveAdapter().captureIntent(input, context);
  }

  async createRefund(input: CreateRefundDto, context: RequestContext): Promise<Refund> {
    assertIdempotentRequest(context);
    return this.resolveAdapter().createRefund(input, context);
  }

  async createSubscription(input: CreateSubscriptionDto, context: RequestContext): Promise<Subscription> {
    assertTraceableRequest(context);
    return this.resolveAdapter().createSubscription(input, context);
  }

  async listDisputes(context: RequestContext): Promise<Dispute[]> {
    assertTraceableRequest(context);
    return this.resolveAdapter().listDisputes(context);
  }

  async handleWebhook(input: HandleWebhookDto, context: RequestContext): Promise<WebhookEvent> {
    assertTraceableRequest(context);
    return this.resolveAdapter(input.provider).parseWebhook(input, context);
  }
}
