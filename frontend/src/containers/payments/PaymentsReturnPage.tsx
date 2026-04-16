import { useEffect, useState } from 'react';
import { PaymentStatusView } from '../../components/payments';
import { CheckoutApiClient } from '../../services/payments';
import { PaymentTransaction, ResumePaymentState } from '../../types/payments';

const client = new CheckoutApiClient();

type PaymentsReturnPageProps = {
  pathname: string;
};

export function PaymentsReturnPage({ pathname }: PaymentsReturnPageProps) {
  const [resumeState, setResumeState] = useState<ResumePaymentState>();
  const [transaction, setTransaction] = useState<PaymentTransaction>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const checkoutSessionId = params.get('checkoutSessionId') ?? '';
        const provider = (params.get('provider') as 'stripe' | 'paypal' | 'googlepay' | null) ?? 'stripe';
        const redirectStatus = params.get('redirect_status') ?? undefined;

        if (!checkoutSessionId) {
          setLoading(false);
          return;
        }

        const resumed = await client.resume(checkoutSessionId, provider, redirectStatus);
        setResumeState(resumed);

        if (resumed.status === 'succeeded' || resumed.status === 'processing') {
          const finalized = await client.finalize(
            checkoutSessionId,
            provider,
            {
              status: resumed.status === 'succeeded' ? 'succeeded' : 'processing',
              reference: `resume-${checkoutSessionId}`
            },
            'unavailable',
            'unavailable'
          );
          setTransaction(finalized);
        }
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      void run();
    }
  }, []);

  if (loading) {
    return <main className="payments-page">Validating your payment return on {pathname}…</main>;
  }

  if (!resumeState) {
    return <main className="payments-page">No payment session found. Please start checkout again.</main>;
  }

  const mode =
    transaction?.state === 'succeeded'
      ? 'success'
      : resumeState.status === 'failed'
        ? 'failed'
        : 'processing';

  return (
    <main className="payments-page payments-page--return">
      <h1>Payment return</h1>
      <p>{resumeState.message}</p>
      <PaymentStatusView
        mode={mode}
        transaction={transaction}
        onRetry={() => window.location.assign(`/payments?order_id=${encodeURIComponent(resumeState.orderId)}`)}
        onSwitchMethod={() => window.location.assign(`/payments?order_id=${encodeURIComponent(resumeState.orderId)}&switch_method=1`)}
        supportHref="/contact-us"
      />
    </main>
  );
}
