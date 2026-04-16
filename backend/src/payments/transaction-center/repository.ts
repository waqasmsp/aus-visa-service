import { toMoney } from './dtos';
import { ImmutableLedgerRecord, TransactionView } from './models';

export interface TransactionCenterRepository {
  listTransactions(): Promise<TransactionView[]>;
  appendLedger(record: ImmutableLedgerRecord): Promise<void>;
  listLedgerRecords(): Promise<ImmutableLedgerRecord[]>;
  updateTransactionStatus(id: string, status: string): Promise<void>;
  appendTransactionNote(id: string, note: string): Promise<void>;
}

export class InMemoryTransactionCenterRepository implements TransactionCenterRepository {
  constructor(
    private readonly transactions: TransactionView[] = [
      {
        id: 'ch_1001',
        type: 'charge',
        status: 'settled',
        amount: toMoney(149, 'USD'),
        customerLabel: 'Maya Patel',
        references: {
          provider: 'stripe',
          providerReference: 'pi_3PTX81x2',
          orderReference: 'ORD-22011',
          applicationReference: 'AUS-24020'
        },
        createdAt: '2026-04-13T08:10:00Z',
        notes: []
      },
      {
        id: 'dp_1001',
        type: 'dispute',
        status: 'needs_response',
        amount: toMoney(149, 'USD'),
        customerLabel: 'Anya Wells',
        references: {
          provider: 'paypal',
          providerReference: 'PP-DIS-9910',
          orderReference: 'ORD-22001',
          applicationReference: 'AUS-23990'
        },
        createdAt: '2026-04-15T13:40:00Z',
        notes: []
      }
    ],
    private readonly ledger: ImmutableLedgerRecord[] = []
  ) {}

  async listTransactions(): Promise<TransactionView[]> {
    return this.transactions.map((row) => ({ ...row, amount: { ...row.amount }, references: { ...row.references }, notes: [...row.notes] }));
  }

  async appendLedger(record: ImmutableLedgerRecord): Promise<void> {
    this.ledger.unshift({ ...record, references: { ...record.references }, amount: record.amount ? { ...record.amount } : undefined });
  }

  async listLedgerRecords(): Promise<ImmutableLedgerRecord[]> {
    return this.ledger.map((row) => ({ ...row, references: { ...row.references }, amount: row.amount ? { ...row.amount } : undefined }));
  }

  async updateTransactionStatus(id: string, status: string): Promise<void> {
    const target = this.transactions.find((row) => row.id === id);
    if (!target) {
      return;
    }
    target.status = status;
  }

  async appendTransactionNote(id: string, note: string): Promise<void> {
    const target = this.transactions.find((row) => row.id === id);
    if (!target) return;
    target.notes.push(note);
  }
}
