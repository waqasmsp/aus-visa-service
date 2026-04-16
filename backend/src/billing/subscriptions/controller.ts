import {
  CancelSubscriptionDto,
  CreateSubscriptionDto,
  PreviewUpcomingInvoiceDto,
  ResumeSubscriptionDto,
  SubscriptionRequestContext,
  UpdateSubscriptionPlanDto,
  ValidateCouponDto
} from './dtos';
import { BillingSubscriptionService } from './service';
import { SubscriptionState } from './models';

export class BillingSubscriptionController {
  constructor(private readonly service: BillingSubscriptionService) {}

  async createSubscription(req: { body: CreateSubscriptionDto; context: SubscriptionRequestContext }) {
    return this.service.createSubscription(req.body, req.context);
  }

  async updatePlan(req: { body: UpdateSubscriptionPlanDto; context: SubscriptionRequestContext }) {
    return this.service.updatePlan(req.body, req.context);
  }

  async cancel(req: { body: CancelSubscriptionDto; context: SubscriptionRequestContext }) {
    return this.service.cancel(req.body, req.context);
  }

  async resume(req: { body: ResumeSubscriptionDto; context: SubscriptionRequestContext }) {
    return this.service.resume(req.body, req.context);
  }

  async previewUpcomingInvoice(req: { body: PreviewUpcomingInvoiceDto }) {
    return this.service.previewUpcomingInvoice(req.body);
  }

  async validateCoupon(req: { body: ValidateCouponDto }) {
    return this.service.validateCoupon(req.body);
  }

  async webhookTransition(req: { body: { subscriptionId: string; status: SubscriptionState }; context: SubscriptionRequestContext }) {
    return this.service.syncWebhookState(req.body.subscriptionId, req.body.status, req.context);
  }

  async markRenewalFailure(req: { body: { subscriptionId: string }; context: SubscriptionRequestContext }) {
    return this.service.processRenewalPaymentFailure(req.body.subscriptionId, req.context);
  }
}
