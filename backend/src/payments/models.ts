export type CurrencyCode = string;
export type PaymentProvider = 'stripe' | 'paypal' | 'googlepay';

export type Money = {
  value: number;
  currency: CurrencyCode;
};

export type PaymentIntent = {
  id: string;
  provider: PaymentProvider;
  status: string;
  amount: Money;
  paymentMethodId?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
};

export type PaymentMethod = {
  id: string;
  provider: PaymentProvider;
  type: 'card' | 'bank_account' | 'wallet' | 'unknown';
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
};

export type Charge = {
  id: string;
  intentId: string;
  provider: PaymentProvider;
  status: string;
  amount: Money;
  receiptUrl?: string;
  paidAt?: string;
};

export type Refund = {
  id: string;
  chargeId: string;
  provider: PaymentProvider;
  status: string;
  amount: Money;
  reason?: string;
  createdAt: string;
};

export type Subscription = {
  id: string;
  provider: PaymentProvider;
  status: string;
  customerId: string;
  planId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
};

export type Invoice = {
  id: string;
  provider: PaymentProvider;
  subscriptionId?: string;
  status: string;
  amountDue: Money;
  amountPaid: Money;
  dueDate?: string;
};

export type Payout = {
  id: string;
  provider: PaymentProvider;
  status: string;
  amount: Money;
  arrivalDate?: string;
};

export type WebhookEvent = {
  id: string;
  provider: PaymentProvider;
  type: string;
  occurredAt: string;
  resourceId: string;
  status?: string;
  correlationId?: string;
  raw?: unknown;
};

export type Dispute = {
  id: string;
  provider: PaymentProvider;
  chargeId: string;
  status: string;
  reason?: string;
  amount?: Money;
};
