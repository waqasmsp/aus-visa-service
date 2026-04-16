import { CheckoutPanel } from '../../components/payments';
import { PaymentMethod } from '../../types/payments';

const mockSavedMethods: PaymentMethod[] = [
  { id: 'pm_saved_visa', provider: 'stripe', type: 'card', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2030 },
  { id: 'pm_saved_mc', provider: 'stripe', type: 'card', brand: 'mastercard', last4: '4444', expMonth: 1, expYear: 2031 }
];

type PaymentsCheckoutPageProps = {
  pathname: string;
};

export function PaymentsCheckoutPage({ pathname }: PaymentsCheckoutPageProps) {
  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const userId = search.get('user_id') ?? 'user_demo_001';
  const applicationId = search.get('application_id') ?? 'app_demo_001';
  const orderId = search.get('order_id') ?? 'order_demo_001';

  return (
    <main className="payments-page" data-pathname={pathname}>
      <section className="payments-page__hero">
        <h1>Secure payment</h1>
        <p>Complete your visa order using card, PayPal, or Google Pay. 3DS/SCA challenges are supported.</p>
      </section>
      <CheckoutPanel
        userId={userId}
        applicationId={applicationId}
        orderId={orderId}
        amount={14900}
        currency="USD"
        savedMethods={mockSavedMethods}
        supportHref="/contact-us"
      />
    </main>
  );
}
