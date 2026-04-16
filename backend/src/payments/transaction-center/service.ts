import {
  AnnotateTransactionDto,
  CancelSubscriptionDto,
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
import { buildPaymentAuditEvent, PaymentAuditRepository } from '../audit';
import { assertPaymentPermission, PAYMENT_PERMISSIONS } from '../permissions';

const permissionMatrix: Record<'admin' | 'manager' | 'user', Record<TransactionPermissionAction, boolean>> = {
  admin: {
    issue_refund: true,
    escalate_dispute: true,
    resend_receipt_invoice: true,
    cancel_subscription: true
  },
  manager: {
    issue_refund: true,
    escalate_dispute: true,
    resend_receipt_invoice: true,
    cancel_subscription: true
  },
  user: {
    issue_refund: false,
    escalate_dispute: false,
    resend_receipt_invoice: false,
    cancel_subscription: false
  }
};

const randomId = (prefix: string): string => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export class TransactionCenterService {
  constructor(
    private readonly repository: TransactionCenterRepository,
    private readonly auditRepository?: PaymentAuditRepository
  ) {}

  async searchTransactions(query: TransactionQueryDto, context?: Pick<TransactionActionContext, 'role' | 'permissions'>): Promise<TransactionView[]> {
    assertPaymentPermission(context, PAYMENT_PERMISSIONS.view, 'list payment transactions');
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
    assertPaymentPermission(context, PAYMENT_PERMISSIONS.refundCreate, 'issue payment refund');
    this.assertReason(input.reason);
    this.assertStepUpToken(input.stepUpToken, 'refund');

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

    await this.audit('payments.refund.create', context, {
      type: 'charge',
      id: charge.id,
      provider: charge.references.provider
    }, {
      status: charge.status,
      amount: charge.amount,
      id: charge.id
    }, {
      refundAmount: toMoney(amount, charge.amount.currency),
      reason: input.reason,
      sourceChargeId: charge.id
    });
  }

  async resendDocument(input: ResendDocumentDto, context: TransactionActionContext): Promise<void> {
    this.assertPermission(context, 'resend_receipt_invoice');
    assertPaymentPermission(context, PAYMENT_PERMISSIONS.view, 'resend payment receipts/invoices');

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

    await this.audit(
      input.kind === 'receipt' ? 'payments.receipt.resend' : 'payments.invoice.resend',
      context,
      { type: target.type, id: target.id, provider: target.references.provider },
      { status: target.status },
      { status: target.status, resent: input.kind }
    );
  }

  async annotateTransaction(input: AnnotateTransactionDto, context: TransactionActionContext): Promise<void> {
    assertPaymentPermission(context, PAYMENT_PERMISSIONS.view, 'annotate payment transaction');
    const rows = await this.repository.listTransactions();
    const target = rows.find((item) => item.id === input.transactionId);
    if (!target) throw new Error(`Transaction ${input.transactionId} was not found.`);

    const before = { notes: [...target.notes] };
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

    await this.audit('payments.transaction.annotate', context, { type: target.type, id: target.id, provider: target.references.provider }, before, {
      notes: [...target.notes, input.note]
    });
  }

  async escalateDispute(input: EscalateDisputeDto, context: TransactionActionContext): Promise<void> {
    this.assertPermission(context, 'escalate_dispute');
    assertPaymentPermission(context, PAYMENT_PERMISSIONS.disputeManage, 'escalate payment dispute');
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

    await this.audit('payments.dispute.manage', context, { type: 'dispute', id: dispute.id, provider: dispute.references.provider }, {
      status: dispute.status
    }, {
      status: 'escalated',
      reason: input.reason
    });
  }

  async cancelSubscription(input: CancelSubscriptionDto, context: TransactionActionContext): Promise<void> {
    this.assertPermission(context, 'cancel_subscription');
    assertPaymentPermission(context, PAYMENT_PERMISSIONS.subscriptionManage, 'cancel payment subscription');
    this.assertReason(input.reason);
    this.assertStepUpToken(input.stepUpToken, 'subscription cancellation');

    const rows = await this.repository.listTransactions();
    const subscription = rows.find((item) => item.id === input.subscriptionId && item.type === 'subscription');
    if (!subscription) throw new Error(`Subscription ${input.subscriptionId} was not found.`);

    await this.repository.updateTransactionStatus(subscription.id, 'canceled');
    await this.repository.appendLedger(this.buildLedgerRecord({
      actor: context.actor,
      transactionType: 'subscription',
      eventType: 'subscription.canceled',
      references: subscription.references,
      amount: subscription.amount,
      reason: input.reason,
      metadata: {
        requestId: context.requestId
      }
    }));

    await this.audit('payments.subscription.manage', context, { type: 'subscription', id: subscription.id, provider: subscription.references.provider }, {
      status: subscription.status
    }, {
      status: 'canceled',
      reason: input.reason
    });
  }

  async reconcile(input: ReconcileSettlementsDto, context: TransactionActionContext): Promise<ReconciliationMismatch[]> {
    assertPaymentPermission(context, PAYMENT_PERMISSIONS.settingsManage, 'reconcile provider settlements');
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

    await this.audit('payments.settings.manage.reconcile', context, { type: 'settlement', id: `recon_${Date.now()}` }, {
      mismatchCount: 0
    }, {
      mismatchCount: mismatches.length
    });

    return mismatches;
  }

  async exportCsv(input: ExportTransactionsDto, context?: Pick<TransactionActionContext, 'role' | 'permissions'>): Promise<string> {
    assertPaymentPermission(context, PAYMENT_PERMISSIONS.view, 'export payment transactions');
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

  private assertStepUpToken(token: string | undefined, action: string): void {
    if (!token?.trim()) {
      throw new Error(`Step-up confirmation is required for ${action}.`);
    }
  }

  private async audit(
    action: string,
    context: TransactionActionContext,
    targetEntity: { type: string; id: string; provider?: string },
    before: unknown,
    after: unknown
  ): Promise<void> {
    if (!this.auditRepository) {
      return;
    }

    await this.auditRepository.save(buildPaymentAuditEvent({
      action,
      actor: context.actor,
      targetEntity,
      before,
      after,
      requestMetadata: {
        requestId: context.requestId,
        correlationId: context.correlationId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    }));
  }

  private buildLedgerRecord(input: Omit<ImmutableLedgerRecord, 'id' | 'createdAt'>): ImmutableLedgerRecord {
    return {
      ...input,
      id: randomId('ledger'),
      createdAt: new Date().toISOString()
    };
  }
}
