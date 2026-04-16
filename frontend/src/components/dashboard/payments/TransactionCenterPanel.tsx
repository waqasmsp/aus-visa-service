import { FormEvent, useMemo, useState } from 'react';

type DashboardRole = 'admin' | 'manager' | 'user';
type TransactionKind = 'charge' | 'refund' | 'invoice' | 'dispute';

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
  {
    id: 'ch_40111',
    type: 'charge',
    provider: 'stripe',
    providerReference: 'pi_3PTX81x2',
    orderReference: 'ORD-22011',
    applicationReference: 'AUS-24020',
    customer: 'Maya Patel',
    amount: 149,
    currency: 'USD',
    status: 'Settled',
    createdAt: '2026-04-13T08:10:00Z'
  },
  {
    id: 'ch_40112',
    type: 'charge',
    provider: 'paypal',
    providerReference: 'PAYID-MSG9B1A',
    orderReference: 'ORD-22019',
    applicationReference: 'AUS-24031',
    customer: 'Jon Rivera',
    amount: 299,
    currency: 'USD',
    status: 'Captured',
    createdAt: '2026-04-14T11:12:00Z'
  },
  {
    id: 'rf_9011',
    type: 'refund',
    provider: 'stripe',
    providerReference: 're_3PTX81x2',
    orderReference: 'ORD-22009',
    applicationReference: 'AUS-24014',
    customer: 'Lina C.',
    amount: 49,
    currency: 'USD',
    status: 'Processed',
    createdAt: '2026-04-15T06:55:00Z'
  },
  {
    id: 'in_1202',
    type: 'invoice',
    provider: 'stripe',
    providerReference: 'in_1QvL8A',
    orderReference: 'ORD-22019',
    applicationReference: 'AUS-24031',
    customer: 'Jon Rivera',
    amount: 299,
    currency: 'USD',
    status: 'Paid',
    createdAt: '2026-04-14T11:13:00Z'
  },
  {
    id: 'dp_1001',
    type: 'dispute',
    provider: 'paypal',
    providerReference: 'PP-DIS-9910',
    orderReference: 'ORD-22001',
    applicationReference: 'AUS-23990',
    customer: 'Anya Wells',
    amount: 149,
    currency: 'USD',
    status: 'Needs Response',
    createdAt: '2026-04-15T13:40:00Z'
  }
];

const tabLabels: Array<{ key: TransactionKind; label: string }> = [
  { key: 'charge', label: 'Charges' },
  { key: 'refund', label: 'Refunds' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'dispute', label: 'Disputes' }
];

const toCsv = (rows: TransactionRecord[]): string => {
  const header = ['type', 'id', 'provider', 'provider_reference', 'order_reference', 'application_reference', 'customer', 'amount', 'currency', 'status', 'created_at'];
  const body = rows.map((row) => [
    row.type,
    row.id,
    row.provider,
    row.providerReference,
    row.orderReference,
    row.applicationReference,
    row.customer,
    row.amount.toFixed(2),
    row.currency,
    row.status,
    row.createdAt
  ]);
  return [header, ...body].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
};

const canRefund = (role: DashboardRole): boolean => role === 'admin' || role === 'manager';
const canEscalateDispute = (role: DashboardRole): boolean => role === 'admin' || role === 'manager';

export function TransactionCenterPanel({ role }: { role: DashboardRole }) {
  const [transactions, setTransactions] = useState(baseTransactions);
  const [activeTab, setActiveTab] = useState<TransactionKind>('charge');
  const [search, setSearch] = useState('');
  const [annotationDraft, setAnnotationDraft] = useState('');
  const [annotationTarget, setAnnotationTarget] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<TransactionRecord | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [disputeEscalations, setDisputeEscalations] = useState<Record<string, string>>({});
  const [mismatches, setMismatches] = useState<ReconciliationMismatch[]>([]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((row) => {
      if (row.type !== activeTab) return false;
      if (!query) return true;
      return [row.id, row.providerReference, row.orderReference, row.applicationReference, row.customer, row.status]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [activeTab, search, transactions]);

  const runReconciliation = () => {
    const providerSettlements = new Map<string, number>([
      ['pi_3PTX81x2', 149],
      ['PAYID-MSG9B1A', 289]
    ]);

    const detected = transactions
      .filter((item) => item.type === 'charge')
      .map<ReconciliationMismatch | null>((charge) => {
        const providerAmount = providerSettlements.get(charge.providerReference);
        if (providerAmount === undefined) {
          return {
            id: `rc-missing-${charge.id}`,
            providerReference: charge.providerReference,
            expected: charge.amount,
            actual: 0,
            reason: 'Missing in provider settlement report'
          };
        }

        if (providerAmount !== charge.amount) {
          return {
            id: `rc-diff-${charge.id}`,
            providerReference: charge.providerReference,
            expected: charge.amount,
            actual: providerAmount,
            reason: 'Settlement amount mismatch'
          };
        }

        return null;
      })
      .filter((item): item is ReconciliationMismatch => item !== null);

    setMismatches(detected);
  };

  const handleExport = (audience: 'accounting' | 'finance') => {
    const csv = toCsv(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions-${audience}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleRefundSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!refundTarget || !canRefund(role)) {
      return;
    }

    if (!refundReason.trim()) {
      window.alert('Refund reason is required by policy.');
      return;
    }

    const requestedAmount = refundType === 'full' ? refundTarget.amount : Number(partialAmount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0 || requestedAmount > refundTarget.amount) {
      window.alert('Enter a valid partial refund amount within the captured amount.');
      return;
    }

    setTransactions((current) => [
      {
        id: `rf_${current.length + 9000}`,
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
      },
      ...current
    ]);

    setRefundTarget(null);
    setRefundReason('');
    setPartialAmount('');
    setRefundType('full');
  };

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header dashboard-panel__header--spread">
          <div>
            <h2>Transaction Center</h2>
            <small>Ledger-backed operations and reconciliation workspace</small>
          </div>
          <div className="dashboard-transaction-actions">
            <button type="button" className="dashboard-primary-button" onClick={() => handleExport('accounting')}>
              Export CSV (Accounting)
            </button>
            <button type="button" className="dashboard-primary-button" onClick={() => handleExport('finance')}>
              Export CSV (Finance)
            </button>
            <button type="button" className="dashboard-primary-button" onClick={runReconciliation}>
              Run Reconciliation
            </button>
          </div>
        </div>

        <div className="dashboard-transaction-toolbar">
          <input
            className="dashboard-auth__input"
            placeholder="Search by transaction, provider ref, order, application, customer"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search transactions"
          />
          <div className="dashboard-settings-tablist" role="tablist" aria-label="Transaction categories">
            {tabLabels.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`dashboard-settings-tab ${activeTab === tab.key ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Provider Ref</th>
                <th>Order / App</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.id}</strong>
                    <small>{new Date(row.createdAt).toLocaleString()}</small>
                  </td>
                  <td>
                    <strong>{row.providerReference}</strong>
                    <small>{row.provider.toUpperCase()}</small>
                  </td>
                  <td>
                    <strong>{row.orderReference}</strong>
                    <small>{row.applicationReference}</small>
                  </td>
                  <td>{row.customer}</td>
                  <td>
                    {row.currency} {row.amount.toFixed(2)}
                  </td>
                  <td>{row.status}</td>
                  <td>
                    <div className="dashboard-transaction-row-actions">
                      {row.type === 'charge' ? (
                        <button type="button" className="dashboard-ghost-button" onClick={() => setRefundTarget(row)} disabled={!canRefund(role)}>
                          Issue Refund
                        </button>
                      ) : null}
                      {(row.type === 'charge' || row.type === 'invoice') ? (
                        <button type="button" className="dashboard-ghost-button">
                          Resend Receipt/Invoice
                        </button>
                      ) : null}
                      <button type="button" className="dashboard-ghost-button" onClick={() => setAnnotationTarget(row.id)}>
                        Annotate
                      </button>
                      {row.type === 'dispute' ? (
                        <button
                          type="button"
                          className="dashboard-ghost-button"
                          onClick={() => setDisputeEscalations((current) => ({ ...current, [row.id]: 'Escalated to Risk Ops' }))}
                          disabled={!canEscalateDispute(role)}
                        >
                          Escalate Dispute
                        </button>
                      ) : null}
                    </div>
                    {disputeEscalations[row.id] ? <small>{disputeEscalations[row.id]}</small> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!canRefund(role) ? <p className="dashboard-panel__note">Refund actions are permission-gated to manager/admin roles.</p> : null}
      </article>

      {refundTarget ? (
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2>Issue Refund</h2>
            <small>{refundTarget.id}</small>
          </div>
          <form className="dashboard-settings-grid" onSubmit={handleRefundSubmit}>
            <label>
              Refund Type
              <select value={refundType} onChange={(event) => setRefundType(event.target.value as 'full' | 'partial')}>
                <option value="full">Full refund</option>
                <option value="partial">Partial refund</option>
              </select>
            </label>
            <label>
              Amount
              <input
                type="number"
                min={0.01}
                max={refundTarget.amount}
                step="0.01"
                value={refundType === 'full' ? String(refundTarget.amount) : partialAmount}
                onChange={(event) => setPartialAmount(event.target.value)}
                disabled={refundType === 'full'}
              />
            </label>
            <label className="dashboard-settings-grid-label dashboard-settings-grid-label--full">
              Refund Reason (Required)
              <textarea value={refundReason} onChange={(event) => setRefundReason(event.target.value)} rows={3} required />
            </label>
            <div className="dashboard-settings-actions">
              <button type="submit" className="dashboard-primary-button">
                Submit Refund
              </button>
              <button type="button" className="dashboard-ghost-button" onClick={() => setRefundTarget(null)}>
                Cancel
              </button>
            </div>
          </form>
        </article>
      ) : null}

      {annotationTarget ? (
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2>Annotate Transaction</h2>
            <small>{annotationTarget}</small>
          </div>
          <div className="dashboard-settings-grid">
            <label className="dashboard-settings-grid-label dashboard-settings-grid-label--full">
              Internal note
              <textarea rows={3} value={annotationDraft} onChange={(event) => setAnnotationDraft(event.target.value)} />
            </label>
            <div className="dashboard-settings-actions">
              <button
                type="button"
                className="dashboard-primary-button"
                onClick={() => {
                  if (!annotationDraft.trim()) return;
                  setAnnotationTarget(null);
                  setAnnotationDraft('');
                }}
              >
                Save Annotation
              </button>
            </div>
          </div>
        </article>
      ) : null}

      {mismatches.length ? (
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2>Reconciliation Mismatches</h2>
            <small>{mismatches.length} flagged</small>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Provider Ref</th>
                  <th>Internal</th>
                  <th>Provider</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {mismatches.map((item) => (
                  <tr key={item.id}>
                    <td>{item.providerReference}</td>
                    <td>${item.expected.toFixed(2)}</td>
                    <td>${item.actual.toFixed(2)}</td>
                    <td>{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </section>
  );
}
