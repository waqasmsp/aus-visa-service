import { BillingInterval, RegionCode } from '../plans/models';
import { CancellationMode, CouponRule } from './models';

export type SubscriptionRequestContext = {
  actor: string;
  requestId: string;
  correlationId?: string;
};

export type CreateSubscriptionDto = {
  customerId: string;
  planId: string;
  interval: BillingInterval;
  region: RegionCode;
  paymentMethodId?: string;
  trialRequested?: boolean;
  couponCode?: string;
};

export type UpdateSubscriptionPlanDto = {
  subscriptionId: string;
  nextPlanId: string;
  nextInterval: BillingInterval;
};

export type CancelSubscriptionDto = {
  subscriptionId: string;
  mode: CancellationMode;
  reason: string;
};

export type ResumeSubscriptionDto = {
  subscriptionId: string;
};

export type PreviewUpcomingInvoiceDto = {
  subscriptionId: string;
  requestedPlanId?: string;
  requestedInterval?: BillingInterval;
};

export type ValidateCouponDto = {
  couponCode: string;
  customerId: string;
  planCode: string;
  now?: string;
};

export const createDefaultCoupons = (): CouponRule[] => [
  {
    id: 'coupon_launch_20',
    code: 'LAUNCH20',
    active: true,
    percentOff: 20,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2026-12-31T23:59:59.999Z',
    maxRedemptions: 200,
    redemptions: 9,
    eligiblePlanCodes: ['starter', 'growth'],
    firstPurchaseOnly: true
  },
  {
    id: 'coupon_growth_100',
    code: 'GROWTH100',
    active: true,
    amountOff: 100,
    currency: 'USD',
    validFrom: '2026-03-01T00:00:00.000Z',
    validTo: '2026-08-31T23:59:59.999Z',
    maxRedemptions: 50,
    redemptions: 3,
    eligiblePlanCodes: ['growth']
  }
];
