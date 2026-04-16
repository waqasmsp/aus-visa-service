import { PaymentPermission } from '../permissions';
import { CurrencyCode, Money } from '../models';
import { ProviderSettlementLine, TransactionCenterRole, TransactionKind } from './models';

export type TransactionQueryDto = {
  type?: TransactionKind;
  search?: string;
};

export type IssueRefundDto = {
  chargeId: string;
  amount?: number;
  reason: string;
  stepUpToken: string;
};

export type AnnotateTransactionDto = {
  transactionId: string;
  note: string;
};

export type ResendDocumentDto = {
  transactionId: string;
  kind: 'receipt' | 'invoice';
};

export type EscalateDisputeDto = {
  disputeId: string;
  reason: string;
};

export type CancelSubscriptionDto = {
  subscriptionId: string;
  reason: string;
  stepUpToken: string;
};

export type ExportTransactionsDto = {
  audience: 'accounting' | 'finance';
  currency?: CurrencyCode;
};

export type ReconcileSettlementsDto = {
  providerSettlementLines: ProviderSettlementLine[];
};

export type TransactionActionContext = {
  actor: string;
  role: TransactionCenterRole;
  requestId: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  permissions?: PaymentPermission[];
};

export const toMoney = (value: number, currency: CurrencyCode): Money => ({ value, currency });
