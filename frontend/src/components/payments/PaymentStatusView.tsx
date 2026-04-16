import { PaymentTransaction } from '../../types/payments';

type PaymentStatusViewProps = {
  transaction?: PaymentTransaction;
  mode: 'success' | 'failed' | 'processing';
  onRetry: () => void;
  onSwitchMethod: () => void;
  supportHref?: string;
};

const titleByMode: Record<PaymentStatusViewProps['mode'], string> = {
  success: 'Payment successful',
  failed: 'Payment failed',
  processing: 'Payment processing'
};

export function PaymentStatusView({
  transaction,
  mode,
  onRetry,
  onSwitchMethod,
  supportHref = '/contact-us'
}: PaymentStatusViewProps) {
  return (
    <section className={`payments-status payments-status--${mode}`} aria-live="polite">
      <h2>{titleByMode[mode]}</h2>
      <p>
        {mode === 'success'
          ? 'Your payment was verified and the receipt is now available.'
          : mode === 'processing'
            ? 'We are waiting on processor confirmation. This can take up to a minute.'
            : 'You can retry this method, switch methods, or escalate to support.'}
      </p>
      {transaction ? (
        <dl>
          <div>
            <dt>Transaction reference</dt>
            <dd>{transaction.processorReference}</dd>
          </div>
          <div>
            <dt>Order ID</dt>
            <dd>{transaction.orderId}</dd>
          </div>
        </dl>
      ) : null}

      {mode !== 'success' ? (
        <div className="payments-status__actions">
          <button type="button" onClick={onRetry}>
            Retry same method
          </button>
          <button type="button" onClick={onSwitchMethod}>
            Switch method
          </button>
          <a href={supportHref}>Contact support</a>
        </div>
      ) : (
        <a href="/dashboard/payments">View receipt in dashboard</a>
      )}
    </section>
  );
}
