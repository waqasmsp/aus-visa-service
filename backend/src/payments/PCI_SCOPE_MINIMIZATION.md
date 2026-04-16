# Payment PCI Scope Minimization Standard

## Integration model

- **Primary target: SAQ-A** when using hosted payment pages/elements and provider tokenization where card entry is handled by the provider domain.
- **Fallback target: SAQ-A-EP** only when merchant-hosted checkout pages embed provider JS but still avoid direct PAN/CVV transit/storage in backend services.
- **Explicit prohibition:** application systems must never persist or log raw PAN, CVV, track data, or full magnetic stripe equivalents.

## Enforcement controls

1. `CheckoutFlowService` requires `paymentMethodToken` and rejects payloads that contain `pan`, `cardNumber`, `cvv`, or `cvc` fields.
2. `WebhookIngestionService` stores masked payload/header snapshots and never writes raw secrets/card data into audit rows.
3. Transaction Center list responses mask provider references for non-admin roles.
4. Secret material must be provided from an `sm://` secret manager URI with rotation timestamp and strict environment separation (`dev`, `staging`, `prod`).

## Operations and evidence

- Keep annual PCI evidence showing SAQ-A/SAQ-A-EP control ownership and processor attestation.
- Review payment telemetry weekly for decline spikes, refund/dispute anomalies, and webhook signature failures.
- Test role-based access restrictions quarterly for payment administration screens.
