import { InternalPaymentDomainEventType } from './webhooks/models';

export type SecurityAlertType =
  | 'webhook_signature_failures'
  | 'payment_decline_spike'
  | 'refund_pattern_anomaly'
  | 'dispute_pattern_anomaly';

export type SecurityAlert = {
  type: SecurityAlertType;
  message: string;
  observedAt: string;
  metadata?: Record<string, string>;
};

export type SecurityAlertSink = (alert: SecurityAlert) => Promise<void>;

export class PaymentSecurityMonitoringService {
  private webhookFailures = 0;
  private paymentFailures = 0;
  private refunds = 0;
  private disputes = 0;

  constructor(
    private readonly sink: SecurityAlertSink,
    private readonly thresholds = {
      webhookFailures: 5,
      paymentFailures: 10,
      refunds: 8,
      disputes: 5
    }
  ) {}

  async recordWebhookSignatureFailure(provider: string): Promise<void> {
    this.webhookFailures += 1;
    if (this.webhookFailures >= this.thresholds.webhookFailures) {
      await this.emit('webhook_signature_failures', `Webhook signature failures exceeded threshold for ${provider}.`, {
        provider,
        failures: String(this.webhookFailures)
      });
      this.webhookFailures = 0;
    }
  }

  async recordDomainEvent(type: InternalPaymentDomainEventType): Promise<void> {
    if (type === 'payment_failed') {
      this.paymentFailures += 1;
      if (this.paymentFailures >= this.thresholds.paymentFailures) {
        await this.emit('payment_decline_spike', 'Payment decline spike detected.', {
          failedPayments: String(this.paymentFailures)
        });
        this.paymentFailures = 0;
      }
    }

    if (type === 'refund_completed') {
      this.refunds += 1;
      if (this.refunds >= this.thresholds.refunds) {
        await this.emit('refund_pattern_anomaly', 'Unusual refund volume detected.', {
          refunds: String(this.refunds)
        });
        this.refunds = 0;
      }
    }

    if (type === 'dispute_opened') {
      this.disputes += 1;
      if (this.disputes >= this.thresholds.disputes) {
        await this.emit('dispute_pattern_anomaly', 'Unusual dispute volume detected.', {
          disputes: String(this.disputes)
        });
        this.disputes = 0;
      }
    }
  }

  private async emit(type: SecurityAlertType, message: string, metadata?: Record<string, string>): Promise<void> {
    await this.sink({
      type,
      message,
      observedAt: new Date().toISOString(),
      metadata
    });
  }
}

export const noOpAlertSink: SecurityAlertSink = async () => undefined;
