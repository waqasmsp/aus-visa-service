import { useMemo, useState } from 'react';

type BillingRole = 'admin' | 'manager' | 'user';
type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

type BillingPlan = {
  id: string;
  name: string;
  interval: 'monthly' | 'annual';
  amount: number;
  currency: string;
};

type BillingInvoice = {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'open' | 'failed';
};

const availablePlans: BillingPlan[] = [
  { id: 'starter-monthly', name: 'Starter', interval: 'monthly', amount: 29, currency: 'USD' },
  { id: 'starter-annual', name: 'Starter', interval: 'annual', amount: 290, currency: 'USD' },
  { id: 'growth-monthly', name: 'Growth', interval: 'monthly', amount: 79, currency: 'USD' },
  { id: 'growth-annual', name: 'Growth', interval: 'annual', amount: 790, currency: 'USD' }
];

const couponRegistry = new Map<string, { type: 'percent' | 'amount'; value: number; maxUses: number; used: number }>([
  ['LAUNCH20', { type: 'percent', value: 20, maxUses: 200, used: 9 }],
  ['GROWTH100', { type: 'amount', value: 100, maxUses: 50, used: 3 }]
]);

export function BillingWorkspace({ role }: { role: BillingRole }) {
  const [status, setStatus] = useState<BillingStatus>('active');
  const [currentPlan, setCurrentPlan] = useState<BillingPlan>(availablePlans[0]);
  const [scheduledPlan, setScheduledPlan] = useState<BillingPlan | null>(null);
  const [nextBillingDate, setNextBillingDate] = useState('2026-05-16');
  const [paymentMethod, setPaymentMethod] = useState('Visa •••• 4242 · exp 09/29');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; label: string } | null>(null);
  const [cancelAtTermEnd, setCancelAtTermEnd] = useState(false);

  const [invoices] = useState<BillingInvoice[]>([
    { id: 'INV-1420', date: '2026-04-16', amount: 29, status: 'paid' },
    { id: 'INV-1310', date: '2026-03-16', amount: 29, status: 'paid' },
    { id: 'INV-1204', date: '2026-02-16', amount: 29, status: 'paid' }
  ]);

  const invoicePreview = useMemo(() => {
    const base = scheduledPlan?.amount ?? currentPlan.amount;
    const discount = couponApplied?.label.includes('%') ? Number((base * 0.2).toFixed(2)) : couponApplied ? 100 : 0;
    const proration = scheduledPlan ? Number(((scheduledPlan.amount - currentPlan.amount) * 0.42).toFixed(2)) : 0;
    return Number((base + proration - discount).toFixed(2));
  }, [couponApplied, currentPlan.amount, scheduledPlan]);

  const applyCoupon = () => {
    const normalized = couponCode.trim().toUpperCase();
    const coupon = couponRegistry.get(normalized);
    if (!coupon) {
      setCouponError('Coupon not found.');
      setCouponApplied(null);
      return;
    }
    if (coupon.used >= coupon.maxUses) {
      setCouponError('Coupon usage limit reached.');
      setCouponApplied(null);
      return;
    }

    setCouponError('');
    setCouponApplied({
      code: normalized,
      label: coupon.type === 'percent' ? `${coupon.value}% off` : `$${coupon.value} off`
    });
  };

  const schedulePlanChange = (planId: string) => {
    const next = availablePlans.find((row) => row.id === planId);
    if (!next) return;
    setScheduledPlan(next);
  };

  const confirmPlanChange = () => {
    if (!scheduledPlan) return;
    setCurrentPlan(scheduledPlan);
    setScheduledPlan(null);
  };

  const cancelSubscription = (mode: 'immediate' | 'end_of_term') => {
    if (mode === 'immediate') {
      setStatus('canceled');
      setCancelAtTermEnd(false);
      return;
    }

    setCancelAtTermEnd(true);
  };

  const resumeSubscription = () => {
    setStatus('active');
    setCancelAtTermEnd(false);
    setNextBillingDate('2026-05-16');
  };

  const triggerFailedRenewal = () => {
    setStatus('past_due');
    setNextBillingDate('2026-04-23 (grace period)');
  };

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header dashboard-panel__header--spread">
          <div>
            <h2>Billing Workspace</h2>
            <small>Plan catalog, subscription lifecycle, invoices, and dunning controls</small>
          </div>
          <span className={`dashboard-chip dashboard-chip--${status.replace('_', '-')}`}>{status}</span>
        </div>

        <div className="dashboard-grid-two">
          <article className="dashboard-card">
            <h3>Current plan</h3>
            <p><strong>{currentPlan.name}</strong> · {currentPlan.interval} · ${currentPlan.amount}/{currentPlan.interval === 'monthly' ? 'mo' : 'yr'}</p>
            <p className="dashboard-panel__note">Next billing date: <strong>{nextBillingDate}</strong></p>
            <p className="dashboard-panel__note">Payment method: <strong>{paymentMethod}</strong></p>
            <label>
              Update payment method
              <input className="dashboard-auth__input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} />
            </label>
          </article>

          <article className="dashboard-card">
            <h3>Change plan</h3>
            <label>
              Select plan
              <select value={scheduledPlan?.id ?? currentPlan.id} onChange={(event) => schedulePlanChange(event.target.value)}>
                {availablePlans.map((plan) => (
                  <option value={plan.id} key={plan.id}>{plan.name} · {plan.interval} · ${plan.amount}</option>
                ))}
              </select>
            </label>
            <p className="dashboard-panel__note">Upcoming invoice preview (proration included): <strong>${invoicePreview.toFixed(2)}</strong></p>
            <div className="dashboard-inline-actions">
              <button type="button" className="dashboard-primary-button" onClick={confirmPlanChange}>Confirm Plan Update</button>
              <button type="button" className="dashboard-ghost-button" onClick={() => setScheduledPlan(null)}>Discard</button>
            </div>
          </article>
        </div>

        <article className="dashboard-card">
          <h3>Coupon / promo codes</h3>
          <div className="dashboard-inline-actions">
            <input className="dashboard-auth__input" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter promo code" />
            <button type="button" className="dashboard-primary-button" onClick={applyCoupon}>Validate & Apply</button>
          </div>
          {couponApplied ? <p className="dashboard-panel__note">Applied <strong>{couponApplied.code}</strong> ({couponApplied.label}).</p> : null}
          {couponError ? <p className="dashboard-panel__note">{couponError}</p> : null}
        </article>

        <article className="dashboard-card">
          <h3>Cancellation & dunning policy</h3>
          <ul className="dashboard-simple-list">
            <li>Retries at 6h, 24h, and 72h after failure.</li>
            <li>Grace period: 7 days in <strong>past_due</strong> before cancellation.</li>
            <li>Webhook transitions are pushed to entitlement state sync.</li>
          </ul>
          <div className="dashboard-inline-actions">
            <button type="button" className="dashboard-ghost-button" onClick={() => cancelSubscription('end_of_term')}>Cancel End of Term</button>
            <button type="button" className="dashboard-ghost-button" onClick={() => cancelSubscription('immediate')}>Cancel Immediately</button>
            <button type="button" className="dashboard-ghost-button" onClick={resumeSubscription}>Resume</button>
            {role !== 'user' ? <button type="button" className="dashboard-ghost-button" onClick={triggerFailedRenewal}>Simulate Failed Renewal</button> : null}
          </div>
          {cancelAtTermEnd ? <p className="dashboard-panel__note">Subscription will cancel on {nextBillingDate}.</p> : null}
        </article>

        <article className="dashboard-card">
          <h3>Invoices</h3>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.id}</td>
                    <td>{invoice.date}</td>
                    <td>${invoice.amount.toFixed(2)}</td>
                    <td><span className={`dashboard-chip dashboard-chip--${invoice.status}`}>{invoice.status}</span></td>
                    <td><a href="#" onClick={(event) => event.preventDefault()}>Download PDF</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </article>
    </section>
  );
}
