import {
  AnnotateTransactionDto,
  EscalateDisputeDto,
  ExportTransactionsDto,
  IssueRefundDto,
  ReconcileSettlementsDto,
  ResendDocumentDto,
  TransactionActionContext,
  TransactionQueryDto,
  toMoney
} from './dtos';
import { TransactionCenterRepository } from './repository';
import {
  ImmutableLedgerRecord,
  ReconciliationMismatch,
  TransactionPermissionAction,
  TransactionView
} from './models';
import { maskPaymentAdminReference } from '../security';

const permissionMatrix: Record<'admin' | 'manager' | 'user', Record<TransactionPermissionAction, boolean>> = {
  admin: {
    issue_refund: true,
    escalate_dispute: true,
    resend_receipt_invoice: true
  },
  manager: {
    issue_refund: true,
    escalate_dispute: true,
    resend_receipt_invoice: true
  },
  user: {
    issue_refund: false,
    escalate_dispute: false,
    resend_receipt_invoice: false
  }
};

const randomId = (prefix: string): string => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export class TransactionCenterService {
  constructor(private readonly repository: TransactionCenterRepository) {}

  async searchTransactions(query: TransactionQueryDto, context?: Pick<TransactionActionContext, 'role'>): Promise<TransactionView[]> {
    const rows = await this.repository.listTransactions();
    const search = query.search?.trim().toLowerCase();

    return rows.filter((row) => {
      if (query.type && row.type !== query.type) return false;
      if (!search) return true;
      return [row.id, row.status, row.customerLabel, row.references.providerReference, row.references.orderReference, row.references.applicationReference]
        .join(' ')
        .toLowerCase()
        .includes(search);
    }).map((row) => ({
      ...row,
      references: {
        ...row.references,
        providerReference: context ? maskPaymentAdminReference(row.references.providerReference, context.role) : row.references.providerReference
      }
    }));
  }

  async issueRefund(input: IssueRefundDto, context: TransactionActionContext): Promise<void> {
    this.assertPermission(context, 'issue_refund');
    this.assertReason(input.reason);

    const rows = await this.repository.listTransactions();
    const charge = rows.find((item) => item.id === input.chargeId && item.type === 'charge');
    if (!charge) {
      throw new Error(`Charge ${input.chargeId} was not found.`);
    }

    const amount = input.amount ?? charge.amount.value;
    if (amount <= 0 || amount > charge.amount.value) {
      throw new Error('Refund amount must be greater than zero and less than or equal to charged amount.');
    }

    await this.repository.appendLedger(this.buildLedgerRecord({
      actor: context.actor,
      transactionType: 'refund',
      eventType: 'refund.issued',
      references: charge.references,
      amount: toMoney(amount, charge.amount.currency),
      reason: input.reason,
      metadata: {
        requestId: context.requestId,
        sourceChargeId: charge.id
      }
    }));
  }

  async resendDocument(input: ResendDocumentDto, context: TransactionActionContext): Promise<void> {
    this.assertPermission(context, 'resend_receipt_invoice');

    const rows = await this.repository.listTransactions();
    const target = rows.find((item) => item.id === input.transactionId);
    if (!target) {
      throw new Error(`Transaction ${input.transactionId} was not found.`);
    }

    await this.repository.appendLedger(this.buildLedgerRecord({
      actor: context.actor,
      transactionType: target.type,
      eventType: input.kind === 'receipt' ? 'receipt.resent' : 'invoice.resent',
      references: target.references,
      amount: target.amount,
      metadata: {
        requestId: context.requestId
      }
    }));
  }

  async annotateTransaction(input: AnnotateTransactionDto, context: TransactionActionContext): Promise<void> {
    const rows = await this.repository.listTransactions();
    const target = rows.find((item) => item.id === input.transactionId);
    if (!target) throw new Error(`Transaction ${input.transactionId} was not found.`);

    await this.repository.appendTransactionNote(target.id, input.note);
    await this.repository.appendLedger(this.buildLedgerRecord({
      actor: context.actor,
      transactionType: target.type,
      eventType: 'transaction.annotated',
      references: target.references,
      notes: input.note,
      metadata: {
        requestId: context.requestId
      }
    }));
  }

  async escalateDispute(input: EscalateDisputeDto, context: TransactionActionContext): Promise<void> {
    this.assertPermission(context, 'escalate_dispute');
    this.assertReason(input.reason);

    const rows = await this.repository.listTransactions();
    const dispute = rows.find((item) => item.id === input.disputeId && item.type === 'dispute');
    if (!dispute) throw new Error(`Dispute ${input.disputeId} was not found.`);

    await this.repository.updateTransactionStatus(dispute.id, 'escalated');
    await this.repository.appendLedger(this.buildLedgerRecord({
      actor: context.actor,
      transactionType: 'dispute',
      eventType: 'dispute.escalated',
      references: dispute.references,
      amount: dispute.amount,
      reason: input.reason,
      metadata: {
        requestId: context.requestId
      }
    }));
  }

  async reconcile(input: ReconcileSettlementsDto, context: TransactionActionContext): Promise<ReconciliationMismatch[]> {
    const providerMap = new Map(input.providerSettlementLines.map((row) => [row.providerReference, row.amount]));
    const charges = (await this.repository.listTransactions()).filter((row) => row.type === 'charge');

    const mismatches = charges
      .map<ReconciliationMismatch | null>((charge) => {
        const settled = providerMap.get(charge.references.providerReference);
        if (!settled) {
          return {
            id: randomId('recon'),
            providerReference: charge.references.providerReference,
            expected: charge.amount,
            actual: toMoney(0, charge.amount.currency),
            reason: 'Missing provider settlement line'
          };
        }

        if (settled.value !== charge.amount.value || settled.currency !== charge.amount.currency) {
          return {
            id: randomId('recon'),
            providerReference: charge.references.providerReference,
            expected: charge.amount,
            actual: settled,
            reason: 'Amount or currency mismatch'
          };
        }

        return null;
      })
      .filter((row): row is ReconciliationMismatch => row !== null);

    await Promise.all(
      mismatches.map((mismatch) =>
        this.repository.appendLedger(this.buildLedgerRecord({
          actor: context.actor,
          transactionType: 'charge',
          eventType: 'reconciliation.mismatch',
          references: {
            provider: 'stripe',
            providerReference: mismatch.providerReference,
            orderReference: 'UNKNOWN',
            applicationReference: 'UNKNOWN'
          },
          amount: mismatch.actual,
          reason: mismatch.reason,
          metadata: {
            requestId: context.requestId,
            expectedAmount: `${mismatch.expected.value} ${mismatch.expected.currency}`
          }
        }))
      )
    );

    return mismatches;
  }

  async exportCsv(input: ExportTransactionsDto): Promise<string> {
    const rows = await this.repository.listTransactions();
    const filtered = input.currency ? rows.filter((row) => row.amount.currency === input.currency) : rows;

    const header = ['audience', 'type', 'id', 'provider_ref', 'order_ref', 'application_ref', 'status', 'amount', 'currency', 'created_at'];
    const body = filtered.map((row) => [
      input.audience,
      row.type,
      row.id,
      row.references.providerReference,
      row.references.orderReference,
      row.references.applicationReference,
      row.status,
      row.amount.value.toFixed(2),
      row.amount.currency,
      row.createdAt
    ]);

    return [header, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  private assertPermission(context: TransactionActionContext, action: TransactionPermissionAction): void {
    if (!permissionMatrix[context.role][action]) {
      throw new Error(`Role ${context.role} is not allowed to perform ${action}.`);
    }
  }

  private assertReason(reason?: string): void {
    if (!reason?.trim()) {
      throw new Error('A reason is required by policy for this action.');
    }
  }

  private buildLedgerRecord(input: Omit<ImmutableLedgerRecord, 'id' | 'createdAt'>): ImmutableLedgerRecord {
    return {
      ...input,
      id: randomId('ledger'),
      createdAt: new Date().toISOString()
    };
  }
}
