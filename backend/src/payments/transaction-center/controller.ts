import {
  AnnotateTransactionDto,
  CancelSubscriptionDto,
  EscalateDisputeDto,
  ExportTransactionsDto,
  IssueRefundDto,
  ReconcileSettlementsDto,
  ResendDocumentDto,
  TransactionActionContext,
  TransactionQueryDto
} from './dtos';
import { TransactionCenterService } from './service';

export class TransactionCenterController {
  constructor(private readonly service: TransactionCenterService) {}

  async list(req: { query: TransactionQueryDto; context: Pick<TransactionActionContext, 'role' | 'permissions'> }) {
    return this.service.searchTransactions(req.query, req.context);
  }

  async issueRefund(req: { body: IssueRefundDto; context: TransactionActionContext }) {
    await this.service.issueRefund(req.body, req.context);
    return { ok: true };
  }

  async resendReceiptOrInvoice(req: { body: ResendDocumentDto; context: TransactionActionContext }) {
    await this.service.resendDocument(req.body, req.context);
    return { ok: true };
  }

  async annotate(req: { body: AnnotateTransactionDto; context: TransactionActionContext }) {
    await this.service.annotateTransaction(req.body, req.context);
    return { ok: true };
  }

  async escalateDispute(req: { body: EscalateDisputeDto; context: TransactionActionContext }) {
    await this.service.escalateDispute(req.body, req.context);
    return { ok: true };
  }

  async reconcile(req: { body: ReconcileSettlementsDto; context: TransactionActionContext }) {
    return this.service.reconcile(req.body, req.context);
  }

  async cancelSubscription(req: { body: CancelSubscriptionDto; context: TransactionActionContext }) {
    await this.service.cancelSubscription(req.body, req.context);
    return { ok: true };
  }

  async exportAccountingCsv(req: { query: Omit<ExportTransactionsDto, 'audience'>; context: Pick<TransactionActionContext, 'role' | 'permissions'> }) {
    return this.service.exportCsv({ ...req.query, audience: 'accounting' }, req.context);
  }

  async exportFinanceCsv(req: { query: Omit<ExportTransactionsDto, 'audience'>; context: Pick<TransactionActionContext, 'role' | 'permissions'> }) {
    return this.service.exportCsv({ ...req.query, audience: 'finance' }, req.context);
  }
}
