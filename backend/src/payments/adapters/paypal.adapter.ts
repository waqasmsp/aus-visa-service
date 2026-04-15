import { StripeAdapter } from './stripe.adapter';

export class PayPalAdapter extends StripeAdapter {
  readonly provider = 'paypal' as const;
}
