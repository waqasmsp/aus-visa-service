export type BillingInterval = 'monthly' | 'annual';
export type RegionCode = 'US' | 'EU' | 'UK' | 'AU' | 'CA' | 'APAC';

export type TrialOption = {
  enabled: boolean;
  trialDays: number;
  eligibilityRule?: 'new_customer_only' | 'no_active_subscription' | 'promo_required';
};

export type RegionalPrice = {
  region: RegionCode;
  currency: string;
  unitAmount: number;
  taxBehavior: 'inclusive' | 'exclusive';
};

export type PlanEntitlement = {
  key: string;
  limit?: number;
  enabled: boolean;
  description: string;
};

export type PlanIntervalCatalog = {
  interval: BillingInterval;
  prices: RegionalPrice[];
};

export type PlanCatalogModel = {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
  intervals: PlanIntervalCatalog[];
  trial: TrialOption;
  entitlements: PlanEntitlement[];
  createdAt: string;
  updatedAt: string;
};
