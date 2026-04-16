import { InternalPaymentDomainEventType } from './webhooks/models';

export type SecurityAlertType =
  | 'webhook_signature_failures'
  | 'payment_decline_spike'
  | 'refund_pattern_anomaly'
  | 'dispute_pattern_anomaly'
  | 'provider_outage_pattern'
  | 'reconciliation_drift_detected'
  | 'webhook_processing_failure_spike';

export type SecurityAlert = {
  type: SecurityAlertType;
  message: string;
  observedAt: string;
  metadata?: Record<string, string>;
};

export type SecurityAlertSink = (alert: SecurityAlert) => Promise<void>;

export type PaymentMethod = 'card' | 'bank_transfer' | 'applepay' | 'googlepay' | 'paypal' | 'other';

export type CounterMetricName =
  | 'intent_creation_total'
  | 'intent_creation_success_total'
  | 'payment_attempt_total'
  | 'payment_success_total'
  | 'payment_failure_total'
  | 'refund_total'
  | 'webhook_total'
  | 'webhook_failure_total';

export type DistributionMetricName =
  | 'authorization_to_capture_latency_ms'
  | 'refund_sla_ms'
  | 'webhook_processing_lag_ms';

export type MetricTags = Record<string, string>;

export type PaymentMetricsSink = {
  incrementCounter(name: CounterMetricName, value: number, tags?: MetricTags): Promise<void>;
  observeDistribution(name: DistributionMetricName, value: number, tags?: MetricTags): Promise<void>;
};

export class PaymentSecurityMonitoringService {
  private webhookFailures = 0;
  private paymentFailures = 0;
  private refunds = 0;
  private disputes = 0;
  private reconciliationDrifts = 0;

  constructor(
    private readonly sink: SecurityAlertSink,
    private readonly metricsSink: PaymentMetricsSink = noOpMetricsSink,
    private readonly thresholds = {
      webhookFailures: 5,
      paymentFailures: 10,
      refunds: 8,
      disputes: 5,
      reconciliationDrifts: 3
    }
  ) {}

  async recordIntentCreation(success: boolean, provider: string, method: PaymentMethod): Promise<void> {
    const tags = { provider, method };
    await this.metricsSink.incrementCounter('intent_creation_total', 1, tags);
    if (success) {
      await this.metricsSink.incrementCounter('intent_creation_success_total', 1, tags);
    }
  }

  async recordPaymentOutcome(success: boolean, provider: string, method: PaymentMethod): Promise<void> {
    const tags = { provider, method };
    await this.metricsSink.incrementCounter('payment_attempt_total', 1, tags);
    await this.metricsSink.incrementCounter(success ? 'payment_success_total' : 'payment_failure_total', 1, tags);

    if (!success) {
      this.paymentFailures += 1;
      if (this.paymentFailures >= this.thresholds.paymentFailures) {
        await this.emit('payment_decline_spike', 'Payment decline spike detected.', {
          provider,
          method,
          failedPayments: String(this.paymentFailures)
        });
        this.paymentFailures = 0;
      }
    }
  }

  async recordAuthorizationToCaptureLatency(latencyMs: number, provider: string, method: PaymentMethod): Promise<void> {
    await this.metricsSink.observeDistribution('authorization_to_capture_latency_ms', latencyMs, { provider, method });
  }

  async recordRefundSla(latencyMs: number, provider: string, method: PaymentMethod): Promise<void> {
    await this.metricsSink.incrementCounter('refund_total', 1, { provider, method });
    await this.metricsSink.observeDistribution('refund_sla_ms', latencyMs, { provider, method });
  }

  async recordWebhookProcessingLag(lagMs: number, provider: string, eventType: string, failed = false): Promise<void> {
    const tags = { provider, eventType };
    await this.metricsSink.incrementCounter('webhook_total', 1, tags);
    await this.metricsSink.observeDistribution('webhook_processing_lag_ms', lagMs, tags);

    if (failed) {
      await this.metricsSink.incrementCounter('webhook_failure_total', 1, tags);
      this.webhookFailures += 1;
      if (this.webhookFailures >= this.thresholds.webhookFailures) {
        await this.emit('webhook_processing_failure_spike', `Webhook processing failures exceeded threshold for ${provider}.`, {
          provider,
          failures: String(this.webhookFailures)
        });
        this.webhookFailures = 0;
      }
    }
  }

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

  async recordProviderOutagePattern(provider: string, failureRatePct: number, windowMinutes: number): Promise<void> {
    await this.emit('provider_outage_pattern', `Potential provider outage pattern detected for ${provider}.`, {
      provider,
      failureRatePct: String(failureRatePct),
      windowMinutes: String(windowMinutes)
    });
  }

  async recordReconciliationDrift(provider: string, driftAmount: number, currency: string): Promise<void> {
    this.reconciliationDrifts += 1;
    if (this.reconciliationDrifts >= this.thresholds.reconciliationDrifts) {
      await this.emit('reconciliation_drift_detected', 'Reconciliation drift threshold exceeded.', {
        provider,
        driftAmount: driftAmount.toFixed(2),
        currency,
        drifts: String(this.reconciliationDrifts)
      });
      this.reconciliationDrifts = 0;
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

export const noOpMetricsSink: PaymentMetricsSink = {
  incrementCounter: async () => undefined,
  observeDistribution: async () => undefined
};
