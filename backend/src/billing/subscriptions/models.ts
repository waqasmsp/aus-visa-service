import { BillingInterval, PlanEntitlement, RegionCode } from '../plans/models';

export type SubscriptionState = 'trialing' | 'active' | 'past_due' | 'canceled';
export type CancellationMode = 'immediate' | 'end_of_term';

export type CouponRule = {
  id: string;
  code: string;
  active: boolean;
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  validFrom: string;
  validTo: string;
  maxRedemptions: number;
  redemptions: number;
  eligiblePlanCodes?: string[];
  firstPurchaseOnly?: boolean;
};

export type DunningPolicy = {
  maxRetries: number;
  retryIntervalsHours: number[];
  gracePeriodDays: number;
};

export type SubscriptionRecord = {
  id: string;
  customerId: string;
  planId: string;
  planCode: string;
  interval: BillingInterval;
  region: RegionCode;
  currency: string;
  unitAmount: number;
  status: SubscriptionState;
  entitlements: PlanEntitlement[];
  paymentMethodId?: string;
  nextBillingDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  gracePeriodEndsAt?: string;
  retryAttemptCount: number;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoicePreview = {
  subscriptionId?: string;
  customerId: string;
  lineItems: Array<{ description: string; amount: number; currency: string }>;
  subtotal: number;
  discount: number;
  prorationAdjustment: number;
  total: number;
  currency: string;
  nextBillingDate: string;
};

export type EntitlementTransitionEvent = {
  subscriptionId: string;
  customerId: string;
  previousState: SubscriptionState;
  nextState: SubscriptionState;
  occurredAt: string;
  source: 'api' | 'webhook' | 'renewal';
};
