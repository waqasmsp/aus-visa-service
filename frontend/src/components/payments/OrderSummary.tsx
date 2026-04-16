type SummaryItem = {
  label: string;
  value: number;
};

type OrderSummaryProps = {
  orderId: string;
  applicationId: string;
  currency: string;
  items: SummaryItem[];
};

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value / 100);

export function OrderSummary({ orderId, applicationId, currency, items }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <aside className="payments-order-summary" aria-label="Order summary">
      <h3>Order Summary</h3>
      <dl>
        <div>
          <dt>Order ID</dt>
          <dd>{orderId}</dd>
        </div>
        <div>
          <dt>Application</dt>
          <dd>{applicationId}</dd>
        </div>
      </dl>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{formatCurrency(item.value, currency)}</strong>
          </li>
        ))}
      </ul>
      <div className="payments-order-summary__total">
        <span>Total</span>
        <strong>{formatCurrency(subtotal, currency)}</strong>
      </div>
    </aside>
  );
}
