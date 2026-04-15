import { FormEvent, useMemo, useState } from 'react';
import { DashboardUserRole } from '../../../../types/dashboard/applications';
import { canPerform, collectDestructiveApproval } from '../../../../services/dashboard/authPolicy';
import { writeAuditEvent } from '../../../../services/dashboard/audit.service';

type WebhookEventKey =
  | 'contact.form.submitted'
  | 'application.created'
  | 'application.updated'
  | 'application.status.changed'
  | 'user.created'
  | 'user.updated'
  | 'blog.published'
  | 'blog.updated'
  | 'page.published'
  | 'page.updated';

type BackoffStrategy = 'fixed' | 'linear' | 'exponential';
type EndpointStatus = 'active' | 'disabled' | 'failed';

type DeliveryPolicy = {
  retryCount: number;
  timeoutSeconds: number;
  backoffStrategy: BackoffStrategy;
};

type WebhookEndpoint = {
  id: string;
  name: string;
  url: string;
  status: EndpointStatus;
  signingSecret: string;
  subscriptions: Record<WebhookEventKey, boolean>;
  deliveryPolicy: DeliveryPolicy;
  updatedAt: string;
};

type EndpointFormState = {
  id: string | null;
  name: string;
  url: string;
};

type DeliveryLogEntry = {
  id: string;
  endpointId: string;
  endpointName: string;
  eventKey: WebhookEventKey;
  statusCode: number;
  latencyMs: number;
  attemptCount: number;
  responseSnippet: string;
  deliveredAt: string;
};

const webhookEvents: Array<{ key: WebhookEventKey; label: string }> = [
  { key: 'contact.form.submitted', label: 'Contact form submitted' },
  { key: 'application.created', label: 'Application created' },
  { key: 'application.updated', label: 'Application updated' },
  { key: 'application.status.changed', label: 'Application status changed' },
  { key: 'user.created', label: 'User created' },
  { key: 'user.updated', label: 'User updated' },
  { key: 'blog.published', label: 'Blog published' },
  { key: 'blog.updated', label: 'Blog updated' },
  { key: 'page.published', label: 'Page published' },
  { key: 'page.updated', label: 'Page updated' }
];

const eventPayloadTemplates: Record<WebhookEventKey, string> = {
  'contact.form.submitted': JSON.stringify(
    {
      event: 'contact.form.submitted',
      occurredAt: '2026-04-15T12:00:00.000Z',
      data: {
        contactId: 'cnt_2749',
        fullName: 'Ravi Sharma',
        email: 'ravi@example.com',
        source: 'Migration Consultation'
      }
    },
    null,
    2
  ),
  'application.created': JSON.stringify(
    {
      event: 'application.created',
      occurredAt: '2026-04-15T12:00:00.000Z',
      data: {
        applicationId: 'app_10042',
        visaType: 'Student (500)',
        status: 'draft'
      }
    },
    null,
    2
  ),
  'application.updated': JSON.stringify(
    {
      event: 'application.updated',
      occurredAt: '2026-04-15T12:00:00.000Z',
      data: {
        applicationId: 'app_10042',
        changedFields: ['passportNumber', 'preferredIntake'],
        status: 'submitted'
      }
    },
    null,
    2
  ),
  'application.status.changed': JSON.stringify(
    {
      event: 'application.status.changed',
      occurredAt: '2026-04-15T12:00:00.000Z',
      data: {
        applicationId: 'app_10042',
        previousStatus: 'submitted',
        newStatus: 'documents_requested'
      }
    },
    null,
    2
  ),
  'user.created': JSON.stringify(
    {
      event: 'user.created',
      occurredAt: '2026-04-15T12:00:00.000Z',
      data: {
        userId: 'usr_501',
        role: 'manager',
        email: 'manager@example.com'
      }
    },
    null,
    2
  ),
  'user.updated': JSON.stringify(
    {
      event: 'user.updated',
      occurredAt: '2026-04-15T12:00:00.000Z',
      data: {
        userId: 'usr_501',
        changedFields: ['firstName', 'mobile'],
        role: 'manager'
      }
    },
    null,
    2
  ),
  'blog.published': JSON.stringify(
    {
      event: 'blog.published',
      occurredAt: '2026-04-15T12:00:00.000Z',
      data: {
        postId: 'blog_221',
        slug: 'partner-visa-checklist',
        authorId: 'usr_88'
      }
    },
    null,
    2
  ),
  'blog.updated': JSON.stringify(
    {
      event: 'blog.updated',
      occurredAt: '2026-04-15T12:00:00.000Z',
      data: {
        postId: 'blog_221',
        changedFields: ['title', 'summary']
      }
    },
    null,
    2
  ),
  'page.published': JSON.stringify(
    {
      event: 'page.published',
      occurredAt: '2026-04-15T12:00:00.000Z',
      data: {
        pageId: 'page_14',
        slug: 'about-us'
      }
    },
    null,
    2
  ),
  'page.updated': JSON.stringify(
    {
      event: 'page.updated',
      occurredAt: '2026-04-15T12:00:00.000Z',
      data: {
        pageId: 'page_14',
        changedFields: ['heroImage', 'body']
      }
    },
    null,
    2
  )
};

const defaultSubscriptions = (): Record<WebhookEventKey, boolean> =>
  webhookEvents.reduce((accumulator, eventItem) => {
    accumulator[eventItem.key] = eventItem.key === 'application.status.changed';
    return accumulator;
  }, {} as Record<WebhookEventKey, boolean>);

const defaultPolicy: DeliveryPolicy = {
  retryCount: 3,
  timeoutSeconds: 10,
  backoffStrategy: 'exponential'
};

const generateId = (): string => `wh_${Math.random().toString(36).slice(2, 9)}`;

const generateSecret = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `whsec_${crypto.randomUUID().replace(/-/g, '')}`;
  }
  return `whsec_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

const isValidWebhookUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const formatLocalTimestamp = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso));

const createInitialEndpoint = (): WebhookEndpoint => ({
  id: 'wh_primary',
  name: 'Primary Automation Endpoint',
  url: 'https://hooks.example.com/aus-visa/primary',
  status: 'active',
  signingSecret: generateSecret(),
  subscriptions: defaultSubscriptions(),
  deliveryPolicy: defaultPolicy,
  updatedAt: new Date().toISOString()
});

const initialDeliveryLogs: DeliveryLogEntry[] = [
  {
    id: 'log_1',
    endpointId: 'wh_primary',
    endpointName: 'Primary Automation Endpoint',
    eventKey: 'application.status.changed',
    statusCode: 202,
    latencyMs: 198,
    attemptCount: 1,
    responseSnippet: '{"accepted":true,"jobId":"delivery_101"}',
    deliveredAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: 'log_2',
    endpointId: 'wh_primary',
    endpointName: 'Primary Automation Endpoint',
    eventKey: 'contact.form.submitted',
    statusCode: 500,
    latencyMs: 1700,
    attemptCount: 3,
    responseSnippet: '{"error":"downstream timeout"}',
    deliveredAt: new Date(Date.now() - 1000 * 60 * 48).toISOString()
  }
];

export function WebhooksIntegrationTab({ role, actor }: { role: DashboardUserRole; actor: string }) {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(() => [createInitialEndpoint()]);
  const [formState, setFormState] = useState<EndpointFormState>({ id: null, name: '', url: '' });
  const [urlError, setUrlError] = useState('');
  const [secretStatusMessage, setSecretStatusMessage] = useState('');
  const [logs, setLogs] = useState<DeliveryLogEntry[]>(initialDeliveryLogs);
  const [selectedTemplateEvent, setSelectedTemplateEvent] = useState<WebhookEventKey>('application.created');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('wh_primary');
  const [testResult, setTestResult] = useState('');

  const templatePreview = eventPayloadTemplates[selectedTemplateEvent];

  const selectedEndpoint = useMemo(
    () => endpoints.find((endpoint) => endpoint.id === selectedEndpointId) ?? endpoints[0] ?? null,
    [endpoints, selectedEndpointId]
  );

  const resetForm = () => {
    setFormState({ id: null, name: '', url: '' });
    setUrlError('');
  };

  const handleSubmitEndpoint = (event: FormEvent) => {
    event.preventDefault();
    if (!canPerform(role, 'webhooks', formState.id ? 'edit' : 'create')) {
      setUrlError('Your role cannot mutate webhook endpoints.');
      return;
    }
    if (!isValidWebhookUrl(formState.url.trim())) {
      setUrlError('Enter a valid HTTPS endpoint URL.');
      return;
    }

    const now = new Date().toISOString();
    const normalizedUrl = formState.url.trim();

    if (formState.id) {
      setEndpoints((current) =>
        current.map((endpoint) =>
          endpoint.id === formState.id
            ? {
                ...endpoint,
                name: formState.name.trim() || 'Webhook endpoint',
                url: normalizedUrl,
                updatedAt: now
              }
            : endpoint
        )
      );
      setSecretStatusMessage('Endpoint updated.');
      writeAuditEvent({ actor, action: 'edit', entityType: 'webhooks', entityId: formState.id, before: null, after: { ...formState } });
    } else {
      const newEndpoint: WebhookEndpoint = {
        id: generateId(),
        name: formState.name.trim() || 'Webhook endpoint',
        url: normalizedUrl,
        status: 'active',
        signingSecret: generateSecret(),
        subscriptions: defaultSubscriptions(),
        deliveryPolicy: defaultPolicy,
        updatedAt: now
      };
      setEndpoints((current) => [...current, newEndpoint]);
      setSelectedEndpointId(newEndpoint.id);
      setSecretStatusMessage('Endpoint created with a unique signing secret.');
      writeAuditEvent({ actor, action: 'create', entityType: 'webhooks', entityId: newEndpoint.id, before: null, after: newEndpoint });
    }

    resetForm();
  };

  const editEndpoint = (endpoint: WebhookEndpoint) => {
    setFormState({ id: endpoint.id, name: endpoint.name, url: endpoint.url });
    setUrlError('');
  };

  const toggleEndpointStatus = (endpointId: string) => {
    if (!canPerform(role, 'webhooks', 'edit')) {
      setSecretStatusMessage('Your role cannot modify webhook status.');
      return;
    }
    setEndpoints((current) =>
      current.map((endpoint) =>
        endpoint.id === endpointId
          ? {
              ...endpoint,
              status: endpoint.status === 'disabled' ? 'active' : 'disabled',
              updatedAt: new Date().toISOString()
            }
          : endpoint
      )
    );
  };

  const deleteEndpoint = (endpointId: string) => {
    if (!canPerform(role, 'webhooks', 'delete')) {
      setSecretStatusMessage('Your role cannot delete endpoints.');
      return;
    }
    const approval = collectDestructiveApproval('webhooks', 'delete', endpointId);
    if (!approval) return;
    setEndpoints((current) => current.filter((endpoint) => endpoint.id !== endpointId));
    writeAuditEvent({ actor, action: 'delete', entityType: 'webhooks', entityId: endpointId, before: null, after: approval });
    if (selectedEndpointId === endpointId) {
      const fallbackEndpoint = endpoints.find((endpoint) => endpoint.id !== endpointId);
      setSelectedEndpointId(fallbackEndpoint?.id ?? '');
    }
    if (formState.id === endpointId) {
      resetForm();
    }
  };

  const updatePolicy = <K extends keyof DeliveryPolicy>(endpointId: string, key: K, value: DeliveryPolicy[K]) => {
    setEndpoints((current) =>
      current.map((endpoint) =>
        endpoint.id === endpointId
          ? {
              ...endpoint,
              deliveryPolicy: {
                ...endpoint.deliveryPolicy,
                [key]: value
              },
              updatedAt: new Date().toISOString()
            }
          : endpoint
      )
    );
  };

  const toggleSubscription = (endpointId: string, eventKey: WebhookEventKey) => {
    setEndpoints((current) =>
      current.map((endpoint) =>
        endpoint.id === endpointId
          ? {
              ...endpoint,
              subscriptions: {
                ...endpoint.subscriptions,
                [eventKey]: !endpoint.subscriptions[eventKey]
              },
              updatedAt: new Date().toISOString()
            }
          : endpoint
      )
    );
  };

  const rotateSigningSecret = (endpointId: string) => {
    setEndpoints((current) =>
      current.map((endpoint) =>
        endpoint.id === endpointId
          ? {
              ...endpoint,
              signingSecret: generateSecret(),
              updatedAt: new Date().toISOString()
            }
          : endpoint
      )
    );
    setSecretStatusMessage('Signing secret rotated. Update downstream verifier immediately.');
  };

  const replayFailedEvent = (logEntry: DeliveryLogEntry) => {
    const replayResult: DeliveryLogEntry = {
      id: generateId(),
      endpointId: logEntry.endpointId,
      endpointName: logEntry.endpointName,
      eventKey: logEntry.eventKey,
      statusCode: 202,
      latencyMs: 220,
      attemptCount: 1,
      responseSnippet: '{"accepted":true,"replay":true}',
      deliveredAt: new Date().toISOString()
    };
    setLogs((current) => [replayResult, ...current]);
  };

  const sendTestWebhook = () => {
    if (!selectedEndpoint) {
      setTestResult('Create an endpoint first before sending a test webhook.');
      return;
    }
    if (selectedEndpoint.status === 'disabled') {
      setTestResult('Selected endpoint is disabled. Enable it before sending test traffic.');
      return;
    }

    const wasSuccessful = Math.random() > 0.2;
    const statusCode = wasSuccessful ? 202 : 503;
    const responseSnippet = wasSuccessful ? '{"queued":true}' : '{"error":"service unavailable"}';

    const newLog: DeliveryLogEntry = {
      id: generateId(),
      endpointId: selectedEndpoint.id,
      endpointName: selectedEndpoint.name,
      eventKey: selectedTemplateEvent,
      statusCode,
      latencyMs: wasSuccessful ? 180 : 1400,
      attemptCount: wasSuccessful ? 1 : 2,
      responseSnippet,
      deliveredAt: new Date().toISOString()
    };

    setLogs((current) => [newLog, ...current]);
    setTestResult(
      wasSuccessful
        ? `Test webhook sent to ${selectedEndpoint.url} with ${selectedTemplateEvent} payload.`
        : `Test webhook failed with HTTP ${statusCode}. Review retry policy and endpoint health.`
    );
  };

  return (
    <div className="dashboard-webhooks-layout">
      <section className="dashboard-webhooks-card">
        <div className="dashboard-panel__header dashboard-panel__header--spread">
          <div>
            <h2>Endpoint Management</h2>
            <small>Add, edit, disable, or remove webhook destinations.</small>
          </div>
        </div>

        <form className="dashboard-webhook-endpoint-form" onSubmit={handleSubmitEndpoint}>
          <label className="dashboard-settings-grid-label">
            Endpoint Name
            <input
              value={formState.name}
              onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
              placeholder="CRM intake webhook"
            />
          </label>
          <label className="dashboard-settings-grid-label dashboard-settings-grid-label--full">
            Endpoint URL (HTTPS)
            <input
              value={formState.url}
              onChange={(event) => {
                setFormState((current) => ({ ...current, url: event.target.value }));
                setUrlError('');
              }}
              placeholder="https://hooks.partner.com/aus-visa"
            />
          </label>
          {urlError ? <p className="dashboard-blog-form-error">{urlError}</p> : null}
          <div className="dashboard-settings-actions">
            <button type="submit" className="dashboard-primary-button" disabled={!canPerform(role, 'webhooks', formState.id ? 'edit' : 'create')}>
              {formState.id ? 'Save Endpoint' : 'Add Endpoint'}
            </button>
            {formState.id ? (
              <button type="button" className="dashboard-settings-subtab" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        <table className="dashboard-table dashboard-webhooks-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>URL</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.length ? (
              endpoints.map((endpoint) => (
                <tr key={endpoint.id}>
                  <td>{endpoint.name}</td>
                  <td>{endpoint.url}</td>
                  <td>
                    <span className={`dashboard-chip dashboard-webhook-status dashboard-webhook-status--${endpoint.status}`}>
                      {endpoint.status}
                    </span>
                  </td>
                  <td>{formatLocalTimestamp(endpoint.updatedAt)}</td>
                  <td>
                    <div className="dashboard-actions-inline">
                      <button type="button" onClick={() => editEndpoint(endpoint)} disabled={!canPerform(role, 'webhooks', 'edit')}>
                        Edit
                      </button>
                      <button type="button" onClick={() => toggleEndpointStatus(endpoint.id)} disabled={!canPerform(role, 'webhooks', 'edit')}>
                        {endpoint.status === 'disabled' ? 'Enable' : 'Disable'}
                      </button>
                      <button type="button" className="danger" onClick={() => deleteEndpoint(endpoint.id)} disabled={!canPerform(role, 'webhooks', 'delete')}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No webhook endpoints configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="dashboard-webhooks-card">
        <div className="dashboard-panel__header">
          <h2>Event Subscription Matrix</h2>
          <small>Select which events each endpoint receives.</small>
        </div>
        <div className="dashboard-webhook-matrix-wrap">
          <table className="dashboard-table dashboard-webhook-matrix">
            <thead>
              <tr>
                <th>Event</th>
                {endpoints.map((endpoint) => (
                  <th key={endpoint.id}>{endpoint.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {webhookEvents.map((eventItem) => (
                <tr key={eventItem.key}>
                  <td>{eventItem.label}</td>
                  {endpoints.map((endpoint) => (
                    <td key={`${eventItem.key}_${endpoint.id}`}>
                      <label className="dashboard-webhook-checkbox">
                        <input
                          type="checkbox"
                          checked={endpoint.subscriptions[eventItem.key]}
                          onChange={() => toggleSubscription(endpoint.id, eventItem.key)}
                        />
                        <span>{endpoint.subscriptions[eventItem.key] ? 'Subscribed' : 'Off'}</span>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-webhooks-card">
        <div className="dashboard-panel__header">
          <h2>Security</h2>
          <small>Per-endpoint signing secret controls and verification guidance.</small>
        </div>
        <p className="dashboard-panel__note">
          Verify incoming payloads with HMAC SHA-256 using the endpoint secret and compare against the <code>x-aus-signature</code> header.
        </p>
        {secretStatusMessage ? <p className="dashboard-blog-form-hint">{secretStatusMessage}</p> : null}
        <div className="dashboard-webhook-security-list">
          {endpoints.map((endpoint) => (
            <article key={endpoint.id} className="dashboard-webhook-security-item">
              <header>
                <strong>{endpoint.name}</strong>
                <span>{endpoint.url}</span>
              </header>
              <p>
                <code>{endpoint.signingSecret}</code>
              </p>
              <button type="button" className="dashboard-settings-subtab" onClick={() => rotateSigningSecret(endpoint.id)}>
                Rotate Secret
              </button>
            </article>
          ))}
        </div>
        <label className="dashboard-settings-grid-label dashboard-settings-grid-label--full">
          Test Payload Preview
          <pre className="dashboard-webhook-preview">{templatePreview}</pre>
        </label>
      </section>

      <section className="dashboard-webhooks-card">
        <div className="dashboard-panel__header">
          <h2>Delivery Policy</h2>
          <small>Configure retry count, timeout, and backoff for each endpoint.</small>
        </div>
        <div className="dashboard-webhook-policy-list">
          {endpoints.map((endpoint) => (
            <div key={`${endpoint.id}_policy`} className="dashboard-settings-grid">
              <label>
                {endpoint.name} · Retry Count
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={endpoint.deliveryPolicy.retryCount}
                  onChange={(event) => updatePolicy(endpoint.id, 'retryCount', Number(event.target.value))}
                />
              </label>
              <label>
                Timeout (seconds)
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={endpoint.deliveryPolicy.timeoutSeconds}
                  onChange={(event) => updatePolicy(endpoint.id, 'timeoutSeconds', Number(event.target.value))}
                />
              </label>
              <label>
                Backoff Strategy
                <select
                  value={endpoint.deliveryPolicy.backoffStrategy}
                  onChange={(event) => updatePolicy(endpoint.id, 'backoffStrategy', event.target.value as BackoffStrategy)}
                >
                  <option value="fixed">Fixed</option>
                  <option value="linear">Linear</option>
                  <option value="exponential">Exponential</option>
                </select>
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-webhooks-card">
        <div className="dashboard-panel__header">
          <h2>Send Test Webhook</h2>
          <small>Choose a template payload and simulate a delivery.</small>
        </div>
        <div className="dashboard-settings-grid">
          <label>
            Endpoint
            <select value={selectedEndpointId} onChange={(event) => setSelectedEndpointId(event.target.value)}>
              {endpoints.map((endpoint) => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Payload Template
            <select value={selectedTemplateEvent} onChange={(event) => setSelectedTemplateEvent(event.target.value as WebhookEventKey)}>
              {webhookEvents.map((eventItem) => (
                <option key={eventItem.key} value={eventItem.key}>
                  {eventItem.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="dashboard-settings-actions">
          <button type="button" className="dashboard-primary-button" onClick={sendTestWebhook}>
            Send Test Webhook
          </button>
        </div>
        {testResult ? <p className="dashboard-panel__note">{testResult}</p> : null}
      </section>

      <section className="dashboard-webhooks-card">
        <div className="dashboard-panel__header">
          <h2>Delivery Logs</h2>
          <small>Observe delivery outcomes and replay failures.</small>
        </div>
        <table className="dashboard-table dashboard-webhooks-table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Event</th>
              <th>Status Code</th>
              <th>Latency</th>
              <th>Attempts</th>
              <th>Response Snippet</th>
              <th>Delivered</th>
              <th>Replay</th>
            </tr>
          </thead>
          <tbody>
            {logs.length ? (
              logs.map((logEntry) => (
                <tr key={logEntry.id}>
                  <td>{logEntry.endpointName}</td>
                  <td>{logEntry.eventKey}</td>
                  <td>{logEntry.statusCode}</td>
                  <td>{logEntry.latencyMs} ms</td>
                  <td>{logEntry.attemptCount}</td>
                  <td className="dashboard-webhook-response">{logEntry.responseSnippet}</td>
                  <td>{formatLocalTimestamp(logEntry.deliveredAt)}</td>
                  <td>
                    {logEntry.statusCode >= 400 ? (
                      <button type="button" onClick={() => replayFailedEvent(logEntry)}>
                        Replay
                      </button>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>No deliveries recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
