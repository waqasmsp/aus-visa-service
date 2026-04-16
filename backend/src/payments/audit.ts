import { PaymentProvider } from './models';

export type PaymentAuditRequestMetadata = {
  requestId: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type PaymentAuditEvent = {
  id: string;
  action: string;
  actor: string;
  targetEntity: {
    type: string;
    id: string;
    provider?: PaymentProvider | string;
  };
  before: unknown;
  after: unknown;
  timestamp: string;
  requestMetadata: PaymentAuditRequestMetadata;
};

export interface PaymentAuditRepository {
  save(event: PaymentAuditEvent): Promise<void>;
  list(): Promise<PaymentAuditEvent[]>;
}

export class InMemoryPaymentAuditRepository implements PaymentAuditRepository {
  constructor(private readonly events: PaymentAuditEvent[] = []) {}

  async save(event: PaymentAuditEvent): Promise<void> {
    this.events.unshift(event);
  }

  async list(): Promise<PaymentAuditEvent[]> {
    return this.events.map((event) => ({
      ...event,
      targetEntity: { ...event.targetEntity },
      requestMetadata: { ...event.requestMetadata }
    }));
  }
}

export const buildPaymentAuditEvent = (
  input: Omit<PaymentAuditEvent, 'id' | 'timestamp'>
): PaymentAuditEvent => ({
  ...input,
  id: `pay_audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  timestamp: new Date().toISOString()
});
