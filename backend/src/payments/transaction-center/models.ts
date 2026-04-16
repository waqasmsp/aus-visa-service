import { Money, PaymentProvider } from '../models';

export type LedgerEventType =
  | 'charge.captured'
  | 'refund.issued'
  | 'invoice.resent'
  | 'receipt.resent'
  | 'transaction.annotated'
  | 'dispute.escalated'
  | 'subscription.canceled'
  | 'reconciliation.mismatch';

export type TransactionKind = 'charge' | 'refund' | 'invoice' | 'dispute' | 'subscription';

export type TransactionPermissionAction = 'issue_refund' | 'escalate_dispute' | 'resend_receipt_invoice' | 'cancel_subscription';

export type TransactionCenterRole = 'admin' | 'manager' | 'user';

export type LedgerReferences = {
  provider: PaymentProvider;
  providerReference: string;
  orderReference: string;
  applicationReference: string;
};

export type ImmutableLedgerRecord = {
  id: string;
  eventType: LedgerEventType;
  transactionType: TransactionKind;
  amount?: Money;
  reason?: string;
  notes?: string;
  actor: string;
  references: LedgerReferences;
  metadata?: Record<string, string>;
  createdAt: string;
};

export type TransactionView = {
  id: string;
  type: TransactionKind;
  status: string;
  amount: Money;
  customerLabel: string;
  references: LedgerReferences;
  createdAt: string;
  notes: string[];
};

export type ProviderSettlementLine = {
  providerReference: string;
  amount: Money;
};

export type ReconciliationMismatch = {
  id: string;
  providerReference: string;
  expected: Money;
  actual: Money;
  reason: string;
};
