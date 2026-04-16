import { CheckoutSession, TransactionRecord } from './models';

export interface CheckoutRepository {
  saveSession(session: CheckoutSession): Promise<void>;
  updateSession(session: CheckoutSession): Promise<void>;
  findSessionById(checkoutSessionId: string): Promise<CheckoutSession | undefined>;
  saveTransaction(record: TransactionRecord): Promise<void>;
  findTransactionsByOrder(orderId: string): Promise<TransactionRecord[]>;
}

export class InMemoryCheckoutRepository implements CheckoutRepository {
  private readonly sessions = new Map<string, CheckoutSession>();
  private readonly transactions = new Map<string, TransactionRecord[]>();

  async saveSession(session: CheckoutSession): Promise<void> {
    this.sessions.set(session.checkoutSessionId, session);
  }

  async updateSession(session: CheckoutSession): Promise<void> {
    this.sessions.set(session.checkoutSessionId, session);
  }

  async findSessionById(checkoutSessionId: string): Promise<CheckoutSession | undefined> {
    return this.sessions.get(checkoutSessionId);
  }

  async saveTransaction(record: TransactionRecord): Promise<void> {
    const existing = this.transactions.get(record.orderId) ?? [];
    this.transactions.set(record.orderId, [...existing, record]);
  }

  async findTransactionsByOrder(orderId: string): Promise<TransactionRecord[]> {
    return this.transactions.get(orderId) ?? [];
  }
}
