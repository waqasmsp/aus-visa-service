import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  assertPaymentPermission,
  collectStepUpApproval,
  hasPaymentPermission,
  PAYMENT_PERMISSIONS
} from '../../../services/dashboard/paymentPermissions';
import { writeAuditEvent } from '../../../services/dashboard/audit.service';

type DashboardRole = 'admin' | 'manager' | 'user';
type TransactionKind = 'charge' | 'refund' | 'invoice' | 'dispute' | 'subscription';

type TransactionRecord = {
  id: string;
  type: TransactionKind;
  provider: 'stripe' | 'paypal' | 'googlepay';
  providerReference: string;
  orderReference: string;
  applicationReference: string;
  customer: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type ReconciliationMismatch = {
  id: string;
  providerReference: string;
  expected: number;
  actual: number;
  reason: string;
};

const baseTransactions: TransactionRecord[] = [
  { id: 'ch_40111', type: 'charge', provider: 'stripe', providerReference: 'pi_3PTX81x2', orderReference: 'ORD-22011', applicationReference: 'AUS-24020', customer: 'Maya Patel', amount: 149, currency: 'USD', status: 'Settled', createdAt: '2026-04-13T08:10:00Z' },
  { id: 'ch_40112', type: 'charge', provider: 'paypal', providerReference: 'PAYID-MSG9B1A', orderReference: 'ORD-22019', applicationReference: 'AUS-24031', customer: 'Jon Rivera', amount: 299, currency: 'USD', status: 'Captured', createdAt: '2026-04-14T11:12:00Z' },
  { id: 'rf_9011', type: 'refund', provider: 'stripe', providerReference: 're_3PTX81x2', orderReference: 'ORD-22009', applicationReference: 'AUS-24014', customer: 'Lina C.', amount: 49, currency: 'USD', status: 'Processed', createdAt: '2026-04-15T06:55:00Z' },
  { id: 'in_1202', type: 'invoice', provider: 'stripe', providerReference: 'in_1QvL8A', orderReference: 'ORD-22019', applicationReference: 'AUS-24031', customer: 'Jon Rivera', amount: 299, currency: 'USD', status: 'Paid', createdAt: '2026-04-14T11:13:00Z' },
  { id: 'dp_1001', type: 'dispute', provider: 'paypal', providerReference: 'PP-DIS-9910', orderReference: 'ORD-22001', applicationReference: 'AUS-23990', customer: 'Anya Wells', amount: 149, currency: 'USD', status: 'Needs Response', createdAt: '2026-04-15T13:40:00Z' },
  { id: 'sub_1001', type: 'subscription', provider: 'stripe', providerReference: 'sub_89GA1A', orderReference: 'ORD-SUB-1001', applicationReference: 'AUS-24120', customer: 'Aria Wong', amount: 29, currency: 'USD', status: 'Active', createdAt: '2026-04-12T09:45:00Z' }
];

const tabLabels: Array<{ key: TransactionKind; label: string }> = [
  { key: 'charge', label: 'Charges' },
  { key: 'refund', label: 'Refunds' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'dispute', label: 'Disputes' },
  { key: 'subscription', label: 'Subscriptions' }
];

const toCsv = (rows: TransactionRecord[]): string => {
  const header = ['type', 'id', 'provider', 'provider_reference', 'order_reference', 'application_reference', 'customer', 'amount', 'currency', 'status', 'created_at'];
  const body = rows.map((row) => [row.type, row.id, row.provider, row.providerReference, row.orderReference, row.applicationReference, row.customer, row.amount.toFixed(2), row.currency, row.status, row.createdAt]);
  return [header, ...body].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
};

export function TransactionCenterPanel({ role }: { role: DashboardRole }) {
  const [transactions, setTransactions] = useState(baseTransactions);
  const [activeTab, setActiveTab] = useState<TransactionKind>('charge');
  const [search, setSearch] = useState('');
  const [refundTarget, setRefundTarget] = useState<TransactionRecord | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [mismatches, setMismatches] = useState<ReconciliationMismatch[]>([]);

  const [auditUser, setAuditUser] = useState('');
  const [auditActionType, setAuditActionType] = useState('payments.');
  const [auditProvider, setAuditProvider] = useState('');
  const [auditAmountMin, setAuditAmountMin] = useState('');
  const [auditAmountMax, setAuditAmountMax] = useState('');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const query = params.get('search');

    if (tab && ['charge', 'refund', 'invoice', 'dispute', 'subscription'].includes(tab)) {
      setActiveTab(tab as TransactionKind);
    }
    if (query) {
      setSearch(query);
    }
  }, []);

  const canView = hasPaymentPermission(role, PAYMENT_PERMISSIONS.view);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((row) => {
      if (row.type !== activeTab) return false;
      if (!query) return true;
      return [row.id, row.providerReference, row.orderReference, row.applicationReference, row.customer, row.status].join(' ').toLowerCase().includes(query);
    });
  }, [activeTab, search, transactions]);

  const paymentAuditEvents = useMemo(
    () =>
      listPaymentAudit().filter((event) => {
        if (auditUser && !event.actor.toLowerCase().includes(auditUser.toLowerCase())) return false;
        if (auditActionType && !event.action.toLowerCase().includes(auditActionType.toLowerCase())) return false;
        if (auditProvider && event.provider !== auditProvider) return false;
        if (auditAmountMin && event.amount < Number(auditAmountMin)) return false;
        if (auditAmountMax && event.amount > Number(auditAmountMax)) return false;
        if (auditDateFrom && event.timestamp < `${auditDateFrom}T00:00:00.000Z`) return false;
        if (auditDateTo && event.timestamp > `${auditDateTo}T23:59:59.999Z`) return false;
        return true;
      }),
    [auditActionType, auditAmountMax, auditAmountMin, auditDateFrom, auditDateTo, auditProvider, auditUser]
  );

  const runReconciliation = () => {
    assertPaymentPermission(role, PAYMENT_PERMISSIONS.settingsManage);
    const providerSettlements = new Map<string, number>([['pi_3PTX81x2', 149], ['PAYID-MSG9B1A', 289]]);

    const detected = transactions
      .filter((item) => item.type === 'charge')
      .map<ReconciliationMismatch | null>((charge) => {
        const providerAmount = providerSettlements.get(charge.providerReference);
        if (providerAmount === undefined) {
          return { id: `rc-missing-${charge.id}`, providerReference: charge.providerReference, expected: charge.amount, actual: 0, reason: 'Missing in provider settlement report' };
        }
        if (providerAmount !== charge.amount) {
          return { id: `rc-diff-${charge.id}`, providerReference: charge.providerReference, expected: charge.amount, actual: providerAmount, reason: 'Settlement amount mismatch' };
        }
        return null;
      })
      .filter((item): item is ReconciliationMismatch => item !== null);

    setMismatches(detected);
  };

  const handleExport = (audience: 'accounting' | 'finance') => {
    assertPaymentPermission(role, PAYMENT_PERMISSIONS.view);
    const csv = toCsv(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions-${audience}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const logPaymentAudit = (action: string, actor: string, row: TransactionRecord, before: unknown, after: unknown) => {
    writeAuditEvent({
      actor,
      action,
      entityType: 'payments',
      entityId: row.id,
      before: { ...toRecord(before), provider: row.provider, amount: row.amount, currency: row.currency },
      after,
    });
  };

  const handleCancelSubscription = (target: TransactionRecord) => {
    assertPaymentPermission(role, PAYMENT_PERMISSIONS.subscriptionManage);
    const approval = collectStepUpApproval('subscription cancellation');
    if (!approval) return;

    setTransactions((current) =>
      current.map((item) =>
        item.id === target.id
          ? {
              ...item,
              status: 'Canceled'
            }
          : item
      )
    );

    logPaymentAudit('payments.subscription.manage', role, target, { status: target.status }, { status: 'Canceled', reason: approval.reason, stepUpToken: '[REDACTED]' });
  };

  const handleRefundSubmit = (event: FormEvent) => {
    event.preventDefault();
    assertPaymentPermission(role, PAYMENT_PERMISSIONS.refundCreate);

    if (!refundTarget) return;
    const approval = collectStepUpApproval('refund issuance');
    if (!approval) return;
    if (!refundReason.trim()) {
      window.alert('Refund reason is required by policy.');
      return;
    }

    const requestedAmount = refundType === 'full' ? refundTarget.amount : Number(partialAmount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0 || requestedAmount > refundTarget.amount) {
      window.alert('Enter a valid partial refund amount within the captured amount.');
      return;
    }

    const refundRow: TransactionRecord = {
      id: `rf_${Date.now()}`,
      type: 'refund',
      provider: refundTarget.provider,
      providerReference: `refund-${refundTarget.providerReference}`,
      orderReference: refundTarget.orderReference,
      applicationReference: refundTarget.applicationReference,
      customer: refundTarget.customer,
      amount: Number(requestedAmount.toFixed(2)),
      currency: refundTarget.currency,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    setTransactions((current) => [refundRow, ...current]);
    logPaymentAudit('payments.refund.create', role, refundTarget, { status: refundTarget.status }, { ...refundRow, reason: refundReason, stepUpToken: '[REDACTED]', stepUpReason: approval.reason });

    setRefundTarget(null);
    setRefundReason('');
    setPartialAmount('');
    setRefundType('full');
  };

  if (!canView) {
    return <section className="dashboard-panel"><p className="dashboard-panel__note">Missing required permission: payments.view</p></section>;
  }

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header dashboard-panel__header--spread">
          <div>
            <h2>Transaction Center</h2>
            <small>Payment guardrails, ledger-backed operations, and reconciliation workspace</small>
          </div>
          <div className="dashboard-transaction-actions">
            <button type="button" className="dashboard-primary-button" onClick={() => handleExport('accounting')}>Export CSV (Accounting)</button>
            <button type="button" className="dashboard-primary-button" onClick={() => handleExport('finance')}>Export CSV (Finance)</button>
            <button type="button" className="dashboard-primary-button" onClick={runReconciliation}>Run Reconciliation</button>
          </div>
        </div>

        <div className="dashboard-transaction-toolbar">
          <input className="dashboard-auth__input" placeholder="Search by transaction, provider ref, order, application, customer" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search transactions" />
          <div className="dashboard-settings-tablist" role="tablist" aria-label="Transaction categories">
            {tabLabels.map((tab) => (
              <button key={tab.key} type="button" className={`dashboard-settings-tab ${activeTab === tab.key ? 'is-active' : ''}`} onClick={() => setActiveTab(tab.key)} role="tab" aria-selected={activeTab === tab.key}>{tab.label}</button>
            ))}
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead><tr><th>ID</th><th>Provider Ref</th><th>Order / App</th><th>Customer</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.id}</strong><small>{new Date(row.createdAt).toLocaleString()}</small></td>
                  <td><strong>{row.providerReference}</strong><small>{row.provider.toUpperCase()}</small></td>
                  <td><strong>{row.orderReference}</strong><small>{row.applicationReference}</small></td>
                  <td>{row.customer}</td>
                  <td>{row.currency} {row.amount.toFixed(2)}</td>
                  <td>{row.status}</td>
                  <td>
                    <div className="dashboard-transaction-row-actions">
                      {row.type === 'charge' ? <button type="button" className="dashboard-ghost-button" onClick={() => setRefundTarget(row)} disabled={!hasPaymentPermission(role, PAYMENT_PERMISSIONS.refundCreate)}>Issue Refund</button> : null}
                      {row.type === 'subscription' ? <button type="button" className="dashboard-ghost-button" onClick={() => handleCancelSubscription(row)} disabled={!hasPaymentPermission(role, PAYMENT_PERMISSIONS.subscriptionManage)}>Cancel Subscription</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {refundTarget ? (
          <form className="dashboard-stack dashboard-card" onSubmit={handleRefundSubmit}>
            <h3>Issue refund for {refundTarget.id}</h3>
            <label>
              Refund type
              <select value={refundType} onChange={(event) => setRefundType(event.target.value as 'full' | 'partial')}>
                <option value="full">Full ({refundTarget.currency} {refundTarget.amount.toFixed(2)})</option>
                <option value="partial">Partial amount</option>
              </select>
            </label>
            {refundType === 'partial' ? <label>Partial amount<input className="dashboard-auth__input" value={partialAmount} onChange={(event) => setPartialAmount(event.target.value)} placeholder={`Max ${refundTarget.amount.toFixed(2)}`} /></label> : null}
            <label>Reason<textarea className="dashboard-auth__textarea" value={refundReason} onChange={(event) => setRefundReason(event.target.value)} rows={3} placeholder="Policy reason for refund" /></label>
            <div className="dashboard-inline-actions">
              <button type="submit" className="dashboard-primary-button">Confirm Refund</button>
              <button type="button" className="dashboard-ghost-button" onClick={() => setRefundTarget(null)}>Cancel</button>
            </div>
          </form>
        ) : null}

        <article className="dashboard-card">
          <h3>Payment Audit Explorer</h3>
          <div className="dashboard-grid-two">
            <label>User<input className="dashboard-auth__input" value={auditUser} onChange={(event) => setAuditUser(event.target.value)} placeholder="Actor role/email" /></label>
            <label>Action Type<input className="dashboard-auth__input" value={auditActionType} onChange={(event) => setAuditActionType(event.target.value)} placeholder="payments.refund.create" /></label>
            <label>Provider<select value={auditProvider} onChange={(event) => setAuditProvider(event.target.value)}><option value="">All providers</option><option value="stripe">Stripe</option><option value="paypal">PayPal</option><option value="googlepay">Google Pay</option></select></label>
            <label>Amount Min<input className="dashboard-auth__input" value={auditAmountMin} onChange={(event) => setAuditAmountMin(event.target.value)} /></label>
            <label>Amount Max<input className="dashboard-auth__input" value={auditAmountMax} onChange={(event) => setAuditAmountMax(event.target.value)} /></label>
            <label>Date From<input className="dashboard-auth__input" type="date" value={auditDateFrom} onChange={(event) => setAuditDateFrom(event.target.value)} /></label>
            <label>Date To<input className="dashboard-auth__input" type="date" value={auditDateTo} onChange={(event) => setAuditDateTo(event.target.value)} /></label>
          </div>
          <ul>
            {paymentAuditEvents.map((event) => <li key={event.id}>{event.timestamp} · {event.actor} · {event.action} · {event.provider} · {event.amount.toFixed(2)}</li>)}
          </ul>
        </article>

        {mismatches.length > 0 ? (
          <article className="dashboard-card"><h3>Reconciliation mismatches</h3><ul>{mismatches.map((mismatch) => <li key={mismatch.id}>{mismatch.providerReference}: expected ${mismatch.expected.toFixed(2)} / actual ${mismatch.actual.toFixed(2)} ({mismatch.reason})</li>)}</ul></article>
        ) : null}
      </article>
    </section>
  );
}

type PaymentAuditRow = {
  id: string;
  actor: string;
  action: string;
  provider: string;
  amount: number;
  timestamp: string;
};

const toRecord = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});

const listPaymentAudit = (): PaymentAuditRow[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('aus-visa-dashboard-audit-events-v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return parsed
      .filter((event) => String(event.entityType) === 'payments')
      .map((event) => {
        const after = toRecord(event.after);
        return {
          id: String(event.id),
          actor: String(event.actor ?? 'unknown'),
          action: String(event.action ?? ''),
          provider: String(after.provider ?? 'unknown'),
          amount: Number(after.amount ?? 0),
          timestamp: String(event.timestamp ?? '')
        };
      });
  } catch {
    return [];
  }
};
