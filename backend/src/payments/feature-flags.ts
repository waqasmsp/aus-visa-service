export type Provider = 'stripe' | 'paypal' | 'googlepay';
export type Wallet = 'gpay' | 'paypal';

export type PaymentFeatureFlags = {
  providersByRegion: Record<string, Record<Provider, boolean>>;
  wallets: Record<Wallet, boolean>;
  subscriptionRolloutPercent: number;
  subscriptionCohorts: string[];
};

export const defaultPaymentFeatureFlags: PaymentFeatureFlags = {
  providersByRegion: {
    US: { stripe: true, paypal: true, googlepay: true },
    AU: { stripe: true, paypal: true, googlepay: false },
    IN: { stripe: true, paypal: false, googlepay: true }
  },
  wallets: {
    gpay: true,
    paypal: true
  },
  subscriptionRolloutPercent: 0,
  subscriptionCohorts: ['internal-users']
};

const clampPercent = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

export class PaymentFeatureFlagService {
  constructor(private readonly flags: PaymentFeatureFlags = defaultPaymentFeatureFlags) {}

  isProviderEnabled(region: string, provider: Provider): boolean {
    const regionFlags = this.flags.providersByRegion[region.toUpperCase()];
    return Boolean(regionFlags?.[provider]);
  }

  isWalletEnabled(wallet: Wallet): boolean {
    return Boolean(this.flags.wallets[wallet]);
  }

  isSubscriptionEnabledForCohort(cohort: string, sampledPercent: number): boolean {
    const normalized = cohort.trim().toLowerCase();
    const allowed = this.flags.subscriptionCohorts.some((entry) => entry.trim().toLowerCase() === normalized);
    return allowed && sampledPercent <= clampPercent(this.flags.subscriptionRolloutPercent);
  }
}
