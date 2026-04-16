import { SubscriptionRecord, CouponRule } from './models';

export class SubscriptionRepository {
  private readonly subscriptions = new Map<string, SubscriptionRecord>();
  private readonly coupons = new Map<string, CouponRule>();

  constructor(seedCoupons: CouponRule[]) {
    seedCoupons.forEach((coupon) => this.coupons.set(coupon.code.toUpperCase(), { ...coupon }));
  }

  listByCustomer(customerId: string): SubscriptionRecord[] {
    return [...this.subscriptions.values()].filter((row) => row.customerId === customerId);
  }

  get(subscriptionId: string): SubscriptionRecord {
    const row = this.subscriptions.get(subscriptionId);
    if (!row) throw new Error(`Subscription ${subscriptionId} not found.`);
    return row;
  }

  save(subscription: SubscriptionRecord): SubscriptionRecord {
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  findCoupon(code: string): CouponRule | undefined {
    return this.coupons.get(code.toUpperCase());
  }

  incrementCouponRedemption(code: string): void {
    const existing = this.findCoupon(code);
    if (!existing) return;
    this.coupons.set(code.toUpperCase(), { ...existing, redemptions: existing.redemptions + 1 });
  }
}
