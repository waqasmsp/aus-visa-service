import { EnqueueWebhookRequest, ReplayDeadLetterDto, WebhookHttpRequest } from './dtos';
import { WebhookIngestionService, WebhookReplayService } from './service';

export class PaymentsWebhookController {
  static readonly stripePath = '/api/webhooks/stripe';
  static readonly paypalPath = '/api/webhooks/paypal';
  static readonly googlePayPath = '/api/webhooks/payments/googlepay';

  constructor(
    private readonly ingestion: WebhookIngestionService,
    private readonly replay: WebhookReplayService,
    private readonly options: { enableGooglePayDirectEvents: boolean }
  ) {}

  async handleStripe(req: { body: WebhookHttpRequest; correlationId: string }) {
    return this.ingest({
      provider: 'stripe',
      endpoint: PaymentsWebhookController.stripePath,
      request: req.body,
      correlationId: req.correlationId
    });
  }

  async handlePayPal(req: { body: WebhookHttpRequest; correlationId: string }) {
    return this.ingest({
      provider: 'paypal',
      endpoint: PaymentsWebhookController.paypalPath,
      request: req.body,
      correlationId: req.correlationId
    });
  }

  async handleGooglePay(req: { body: WebhookHttpRequest; correlationId: string }) {
    if (!this.options.enableGooglePayDirectEvents) {
      throw new Error('Google Pay direct webhook events are disabled. Route through processor webhooks only.');
    }

    return this.ingest({
      provider: 'googlepay',
      endpoint: PaymentsWebhookController.googlePayPath,
      request: req.body,
      correlationId: req.correlationId
    });
  }

  async replayDeadLetters(req: { body: ReplayDeadLetterDto }) {
    return this.replay.replay(req.body);
  }

  private ingest(input: EnqueueWebhookRequest) {
    return this.ingestion.ingest(input);
  }
}
