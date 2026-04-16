import { FormEvent, useMemo, useState } from 'react';
import { CheckoutApiClient } from '../../services/payments/checkoutClient';
import { CheckoutMethod, PaymentMethod, PaymentTransaction } from '../../types/payments';
import { OrderSummary } from './OrderSummary';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentStatusView } from './PaymentStatusView';
import { SavedMethodsManager } from './SavedMethodsManager';

type CheckoutPanelProps = {
  userId: string;
  applicationId: string;
  orderId: string;
  amount: number;
  currency: string;
  savedMethods: PaymentMethod[];
  supportHref?: string;
};

const client = new CheckoutApiClient();

export function CheckoutPanel({
  userId,
  applicationId,
  orderId,
  amount,
  currency,
  savedMethods,
  supportHref
}: CheckoutPanelProps) {
  const [method, setMethod] = useState<CheckoutMethod>('card');
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<PaymentTransaction>();
  const [error, setError] = useState<string>();

  const amountItems = useMemo(
    () => [
      { label: 'Visa Processing Service', value: amount },
      { label: 'Fraud & Compliance Checks', value: 450 }
    ],
    [amount]
  );

  const startCheckout = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      const returnUrl = `${window.location.origin}/payments/return?order_id=${encodeURIComponent(orderId)}&application_id=${encodeURIComponent(applicationId)}`;
      const session = await client.createSession(
        {
          userId,
          applicationId,
          orderId,
          amount,
          currency,
          method,
          provider: method === 'paypal' ? 'paypal' : method === 'google_pay' ? 'googlepay' : 'stripe',
          returnUrl
        },
        {
          correlationId: `checkout-${Date.now()}`,
          idempotencyKey: `idem-${orderId}-${Date.now()}`
        }
      );

      const processorPayload: Record<string, unknown> = {
        status: 'succeeded',
        reference: session.paymentIntentId,
        paymentMethodId: selectedSavedMethodId
      };

      if (method === 'paypal' && session.approvalUrl) {
        window.location.assign(
          `${session.approvalUrl}&checkoutSessionId=${encodeURIComponent(session.checkoutSessionId)}&redirect_status=succeeded`
        );
        return;
      }

      if ((method === 'card' || method === 'google_pay') && session.requiresActionRedirectUrl) {
        const requiresRedirect = !selectedSavedMethodId;
        if (requiresRedirect) {
          window.location.assign(
            `${session.requiresActionRedirectUrl}&checkoutSessionId=${encodeURIComponent(session.checkoutSessionId)}`
          );
          return;
        }
      }

      const finalized = await client.finalize(
        session.checkoutSessionId,
        method === 'paypal' ? 'paypal' : method === 'google_pay' ? 'googlepay' : 'stripe',
        processorPayload
      );
      setTransaction(finalized);
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : 'Payment could not be completed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (transaction) {
    return (
      <PaymentStatusView
        mode={transaction.state === 'succeeded' ? 'success' : transaction.state === 'failed' ? 'failed' : 'processing'}
        transaction={transaction}
        onRetry={() => setTransaction(undefined)}
        onSwitchMethod={() => {
          setMethod('card');
          setTransaction(undefined);
        }}
        supportHref={supportHref}
      />
    );
  }

  return (
    <div className="checkout-panel">
      <form onSubmit={startCheckout} className="checkout-panel__form">
        <h2>Checkout</h2>
        <p className="checkout-panel__note">Supports Stripe Elements (card + wallets), PayPal Smart Buttons, and Google Pay.</p>
        <PaymentMethodSelector value={method} onChange={setMethod} disabled={loading} />

        <SavedMethodsManager
          methods={savedMethods}
          selectedMethodId={selectedSavedMethodId}
          onSelect={setSelectedSavedMethodId}
        />

        <div className="checkout-panel__wallets" aria-label="Wallet actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Processing…' : method === 'paypal' ? 'Pay with PayPal Smart Buttons' : 'Pay now'}
          </button>
          {(method === 'card' || method === 'google_pay') && (
            <button type="submit" disabled={loading}>
              {loading ? 'Opening wallet…' : method === 'google_pay' ? 'Pay with Google Pay' : 'Use Stripe wallet'}
            </button>
          )}
        </div>

        {error ? <p className="checkout-panel__error">{error}</p> : null}
      </form>

      <OrderSummary orderId={orderId} applicationId={applicationId} currency={currency} items={amountItems} />
    </div>
  );
}
