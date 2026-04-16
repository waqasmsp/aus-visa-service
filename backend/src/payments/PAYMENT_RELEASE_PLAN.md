# Payments observability, flags, and rollout plan

## Metrics instrumentation

Instrument and publish the following metrics to the shared payments telemetry pipeline:

- Intent creation success rate (`intent_creation_success_total / intent_creation_total`)
- Payment success/failure segmented by provider + method
- Authorization-to-capture latency (`authorization_to_capture_latency_ms`)
- Refund SLA (`refund_sla_ms`)
- Webhook processing lag and failure rate (`webhook_processing_lag_ms`, `webhook_failure_total / webhook_total`)

## Dashboards and alerts

Create dashboards and alerting rules with provider + region breakdowns:

- Abnormal decline spikes (provider + method + region)
- Provider outage patterns (error-rate spikes, timeout spikes, webhook failure spikes)
- Reconciliation drifts (ledger vs provider settlement mismatch)

Suggested alert severities:

- P1: multi-provider outage or >25% decline spike sustained for 10+ minutes
- P2: single-provider degradation, webhook failure-rate >5% for 15+ minutes
- P3: reconciliation drift above tolerated threshold for 2 consecutive windows

## Feature flags

Control release behavior with explicit payment flags:

- Provider enablement by region (example: `providersByRegion.US.stripe = true`)
- Wallet availability (`wallets.gpay`, `wallets.paypal`)
- Subscription rollout cohorts + percentage gating

## Go-live checklist

- [ ] Sandbox certification completed for each enabled provider by region
- [ ] Webhook verification tests passed (signature, replay handling, duplicate events)
- [ ] Refund/dispute runbook reviewed with on-call and operations
- [ ] Failover/fallback behavior validated (provider reroute, wallet fallback, graceful checkout degradation)

## Phased rollout

1. Internal users only (`subscriptionCohorts = ['internal-users']`, low traffic)
2. Small production cohort (named pilot cohort + capped traffic)
3. Percentage ramp (e.g., 5% → 20% → 50% with hold points)
4. Full release (100% with post-rollout monitoring window)

Every phase requires:

- 24-hour metric review
- No unresolved P1/P2 payment alerts
- Reconciliation drift within configured tolerance
