import { PlanCatalogService } from '../plans/service';
import { BillingInterval } from '../plans/models';
import { EntitlementSink } from '../entitlements/service';
import {
  CancelSubscriptionDto,
  createDefaultCoupons,
  CreateSubscriptionDto,
  PreviewUpcomingInvoiceDto,
  ResumeSubscriptionDto,
  SubscriptionRequestContext,
  UpdateSubscriptionPlanDto,
  ValidateCouponDto
} from './dtos';
import { SubscriptionRepository } from './repository';
import { DunningPolicy, InvoicePreview, SubscriptionRecord, SubscriptionState } from './models';

const dayMs = 24 * 60 * 60 * 1000;
const randomId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export class BillingSubscriptionService {
  private readonly dunningPolicy: DunningPolicy = {
    maxRetries: 3,
    retryIntervalsHours: [6, 24, 72],
    gracePeriodDays: 7
  };

  constructor(
    private readonly plans: PlanCatalogService,
    private readonly repository = new SubscriptionRepository(createDefaultCoupons()),
    private readonly entitlementSink?: EntitlementSink
  ) {}

  async createSubscription(input: CreateSubscriptionDto, _context: SubscriptionRequestContext): Promise<SubscriptionRecord> {
    const plan = this.plans.getPlan(input.planId);
    const price = this.plans.getPrice(plan.id, input.interval, input.region);
    const now = new Date();
    const currentPeriodStart = now.toISOString();
    const currentPeriodEnd = this.computePeriodEnd(now, input.interval).toISOString();

    const coupon = input.couponCode ? this.validateCoupon({ couponCode: input.couponCode, customerId: input.customerId, planCode: plan.code, now: now.toISOString() }) : undefined;

    const subscription: SubscriptionRecord = {
      id: randomId('sub'),
      customerId: input.customerId,
      planId: plan.id,
      planCode: plan.code,
      interval: input.interval,
      region: input.region,
      currency: price.currency,
      unitAmount: price.unitAmount,
      status: input.trialRequested && plan.trial.enabled ? 'trialing' : 'active',
      entitlements: plan.entitlements,
      paymentMethodId: input.paymentMethodId,
      currentPeriodStart,
      currentPeriodEnd,
      nextBillingDate: input.trialRequested && plan.trial.enabled
        ? new Date(now.getTime() + plan.trial.trialDays * dayMs).toISOString()
        : currentPeriodEnd,
      trialEndsAt: input.trialRequested && plan.trial.enabled
        ? new Date(now.getTime() + plan.trial.trialDays * dayMs).toISOString()
        : undefined,
      cancelAtPeriodEnd: false,
      retryAttemptCount: 0,
      couponCode: coupon?.code,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    this.repository.save(subscription);
    if (coupon) this.repository.incrementCouponRedemption(coupon.code);
    return subscription;
  }

  async updatePlan(input: UpdateSubscriptionPlanDto, context: SubscriptionRequestContext): Promise<{ subscription: SubscriptionRecord; preview: InvoicePreview }> {
    const existing = this.repository.get(input.subscriptionId);
    if (existing.status === 'canceled') {
      throw new Error('Canceled subscriptions cannot change plans. Resume first.');
    }

    const plan = this.plans.getPlan(input.nextPlanId);
    const price = this.plans.getPrice(plan.id, input.nextInterval, existing.region);
    const preview = this.buildInvoicePreview(existing, { requestedInterval: input.nextInterval, requestedPlanId: plan.id });

    const updated: SubscriptionRecord = {
      ...existing,
      planId: plan.id,
      planCode: plan.code,
      interval: input.nextInterval,
      unitAmount: price.unitAmount,
      currency: price.currency,
      entitlements: plan.entitlements,
      updatedAt: new Date().toISOString()
    };
    this.repository.save(updated);

    await this.emitTransition(existing, updated.status, 'api', context);
    return { subscription: updated, preview };
  }

  async cancel(input: CancelSubscriptionDto, context: SubscriptionRequestContext): Promise<SubscriptionRecord> {
    const existing = this.repository.get(input.subscriptionId);
    const now = new Date().toISOString();

    const updated: SubscriptionRecord = {
      ...existing,
      status: input.mode === 'immediate' ? 'canceled' : existing.status,
      cancelAtPeriodEnd: input.mode === 'end_of_term',
      canceledAt: input.mode === 'immediate' ? now : undefined,
      updatedAt: now
    };

    this.repository.save(updated);
    await this.emitTransition(existing, updated.status, 'api', context);
    return updated;
  }

  async resume(input: ResumeSubscriptionDto, context: SubscriptionRequestContext): Promise<SubscriptionRecord> {
    const existing = this.repository.get(input.subscriptionId);
    const nextStatus: SubscriptionState = existing.status === 'canceled' ? 'active' : existing.status;

    const updated: SubscriptionRecord = {
      ...existing,
      status: nextStatus,
      cancelAtPeriodEnd: false,
      canceledAt: undefined,
      retryAttemptCount: 0,
      gracePeriodEndsAt: undefined,
      updatedAt: new Date().toISOString()
    };
    this.repository.save(updated);

    await this.emitTransition(existing, updated.status, 'api', context);
    return updated;
  }

  previewUpcomingInvoice(input: PreviewUpcomingInvoiceDto): InvoicePreview {
    const existing = this.repository.get(input.subscriptionId);
    return this.buildInvoicePreview(existing, {
      requestedInterval: input.requestedInterval,
      requestedPlanId: input.requestedPlanId
    });
  }

  validateCoupon(input: ValidateCouponDto) {
    const coupon = this.repository.findCoupon(input.couponCode);
    if (!coupon || !coupon.active) throw new Error('Coupon is invalid or inactive.');
    const now = new Date(input.now ?? new Date().toISOString());
    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo)) throw new Error('Coupon is outside of the validity window.');
    if (coupon.redemptions >= coupon.maxRedemptions) throw new Error('Coupon usage limit exceeded.');
    if (coupon.eligiblePlanCodes?.length && !coupon.eligiblePlanCodes.includes(input.planCode)) throw new Error('Coupon is not eligible for selected plan.');
    if (coupon.firstPurchaseOnly && this.repository.listByCustomer(input.customerId).length > 0) {
      throw new Error('Coupon is restricted to first purchase.');
    }
    return coupon;
  }

  async processRenewalPaymentFailure(subscriptionId: string, context: SubscriptionRequestContext): Promise<SubscriptionRecord> {
    const existing = this.repository.get(subscriptionId);
    const nextAttemptCount = existing.retryAttemptCount + 1;
    const exhaustedRetries = nextAttemptCount > this.dunningPolicy.maxRetries;

    const now = new Date();
    const status: SubscriptionState = exhaustedRetries ? 'canceled' : 'past_due';
    const gracePeriodEndsAt = exhaustedRetries ? undefined : new Date(now.getTime() + this.dunningPolicy.gracePeriodDays * dayMs).toISOString();

    const updated: SubscriptionRecord = {
      ...existing,
      status,
      retryAttemptCount: nextAttemptCount,
      gracePeriodEndsAt,
      updatedAt: now.toISOString(),
      canceledAt: exhaustedRetries ? now.toISOString() : existing.canceledAt
    };

    this.repository.save(updated);
    await this.emitTransition(existing, status, 'renewal', context);
    return updated;
  }

  async syncWebhookState(subscriptionId: string, nextState: SubscriptionState, context: SubscriptionRequestContext): Promise<SubscriptionRecord> {
    const existing = this.repository.get(subscriptionId);
    const updated: SubscriptionRecord = {
      ...existing,
      status: nextState,
      updatedAt: new Date().toISOString(),
      canceledAt: nextState === 'canceled' ? new Date().toISOString() : existing.canceledAt
    };
    this.repository.save(updated);
    await this.emitTransition(existing, nextState, 'webhook', context);
    return updated;
  }

  getDunningPolicy(): DunningPolicy {
    return this.dunningPolicy;
  }

  private computePeriodEnd(start: Date, interval: BillingInterval): Date {
    const result = new Date(start.getTime());
    if (interval === 'monthly') result.setUTCMonth(result.getUTCMonth() + 1);
    else result.setUTCFullYear(result.getUTCFullYear() + 1);
    return result;
  }

  private buildInvoicePreview(
    subscription: SubscriptionRecord,
    options: { requestedPlanId?: string; requestedInterval?: BillingInterval }
  ): InvoicePreview {
    const requestedPlan = options.requestedPlanId ? this.plans.getPlan(options.requestedPlanId) : this.plans.getPlan(subscription.planId);
    const requestedInterval = options.requestedInterval ?? subscription.interval;
    const price = this.plans.getPrice(requestedPlan.id, requestedInterval, subscription.region);

    const now = Date.now();
    const periodStart = new Date(subscription.currentPeriodStart).getTime();
    const periodEnd = new Date(subscription.currentPeriodEnd).getTime();
    const elapsedRatio = periodEnd > periodStart ? Math.min(1, Math.max(0, (now - periodStart) / (periodEnd - periodStart))) : 1;

    const currentUnusedCredit = Number(((1 - elapsedRatio) * subscription.unitAmount).toFixed(2));
    const targetRemainingCharge = Number(((1 - elapsedRatio) * price.unitAmount).toFixed(2));
    const prorationAdjustment = Number((targetRemainingCharge - currentUnusedCredit).toFixed(2));

    const subtotal = price.unitAmount;
    const discount = subscription.couponCode ? Number((subtotal * 0.1).toFixed(2)) : 0;
    const total = Number((subtotal - discount + prorationAdjustment).toFixed(2));

    return {
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      lineItems: [
        { description: `${requestedPlan.name} (${requestedInterval})`, amount: subtotal, currency: price.currency },
        { description: 'Proration adjustment', amount: prorationAdjustment, currency: price.currency }
      ],
      subtotal,
      discount,
      prorationAdjustment,
      total,
      currency: price.currency,
      nextBillingDate: subscription.nextBillingDate
    };
  }

  private async emitTransition(
    existing: SubscriptionRecord,
    nextState: SubscriptionState,
    source: 'api' | 'webhook' | 'renewal',
    _context: SubscriptionRequestContext
  ) {
    if (!this.entitlementSink || existing.status === nextState) return;
    await this.entitlementSink.publish({
      subscriptionId: existing.id,
      customerId: existing.customerId,
      previousState: existing.status,
      nextState,
      occurredAt: new Date().toISOString(),
      source
    });
  }
}
