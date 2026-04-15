export type CurrencyCode = string;

export type PaymentProvider = 'stripe' | 'paypal' | 'googlepay' | 'unknown';

export type PaymentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_capture'
  | 'processing'
  | 'succeeded'
  | 'partially_refunded'
  | 'refunded'
  | 'failed'
  | 'canceled'
  | 'unknown';

export type CanonicalAmount = {
  value: number;
  currency: CurrencyCode;
};

export type BillingAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type PaymentMethod = {
  id: string;
  provider: PaymentProvider;
  type: 'card' | 'bank_account' | 'wallet' | 'unknown';
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  billingAddress?: BillingAddress;
};

export type PaymentIntent = {
  id: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: CanonicalAmount;
  amountCapturable?: CanonicalAmount;
  amountReceived?: CanonicalAmount;
  paymentMethodId?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
};

export type Charge = {
  id: string;
  intentId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: CanonicalAmount;
  paidAt?: string;
  receiptUrl?: string;
  failureCode?: string;
  failureMessage?: string;
};

export type Refund = {
  id: string;
  chargeId: string;
  provider: PaymentProvider;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  amount: CanonicalAmount;
  reason?: string;
  createdAt: string;
};

export type Subscription = {
  id: string;
  provider: PaymentProvider;
  status: 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled' | 'incomplete';
  customerId: string;
  planId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
};

export type Invoice = {
  id: string;
  provider: PaymentProvider;
  subscriptionId?: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  amountDue: CanonicalAmount;
  amountPaid: CanonicalAmount;
  dueDate?: string;
  hostedInvoiceUrl?: string;
};

export type Payout = {
  id: string;
  provider: PaymentProvider;
  status: 'pending' | 'in_transit' | 'paid' | 'canceled' | 'failed';
  amount: CanonicalAmount;
  arrivalDate?: string;
};

export type WebhookEvent = {
  id: string;
  provider: PaymentProvider;
  type:
    | 'payment_intent.updated'
    | 'charge.updated'
    | 'refund.updated'
    | 'subscription.updated'
    | 'invoice.updated'
    | 'dispute.updated'
    | 'payout.updated'
    | 'unknown';
  occurredAt: string;
  resourceId: string;
  status?: string;
  correlationId?: string;
  raw?: unknown;
};
