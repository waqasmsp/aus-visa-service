import { useEffect, useMemo, useState } from 'react';
import { getThemeContrastWarnings, sanitizeThemeColorValue } from '../../../utils/themeColors';
import { applyThemeSettings, defaultThemeSettings, loadThemeSettings, saveThemeSettings, ThemeSettings } from '../../../utils/themeSettings';
import { WebhooksIntegrationTab } from './integrations/WebhooksIntegrationTab';

type DashboardRole = 'admin' | 'manager' | 'user';

type PlatformSettings = {
  maintenanceMode: boolean;
  requireMfaForAdmins: boolean;
  autoAssignCases: boolean;
  abandonedEmailAutomation: boolean;
  paymentAutoRetry: boolean;
  supportSlaHours: string;
  defaultApplicationSla: string;
  primaryBrand: string;
  requiredReviewerCount: string;
  approvalQuorum: string;
  complianceChecklistGate: boolean;
  webhookSigningSecret: string;
  analyticsWriteKey: string;
  paymentProvider: 'stripe' | 'braintree';
  paymentApiKey: string;
  emailProvider: 'ses' | 'sendgrid';
  emailApiKey: string;
  roleChangeRequiresApproval: boolean;
  allowSelfRoleEscalation: boolean;
};

type SettingsState = {
  platform: PlatformSettings;
  theme: ThemeSettings;
};

type HistoryEntry = {
  id: string;
  actor: string;
  tab: TopLevelTab;
  key: string;
  timestamp: string;
  before: string | boolean;
  after: string | boolean;
};

type TopLevelTab = 'general' | 'security' | 'workflow' | 'notifications' | 'integrations' | 'branding' | 'access-roles' | 'audit-logs';
type IntegrationTab = 'payment' | 'email' | 'webhooks' | 'analytics';

const DASHBOARD_SETTINGS_STORAGE_KEY = 'aus-visa-dashboard-settings-v2';
const DASHBOARD_SETTINGS_HISTORY_STORAGE_KEY = 'aus-visa-dashboard-settings-history';

const defaultPlatformSettings: PlatformSettings = {
  maintenanceMode: false,
  requireMfaForAdmins: true,
  autoAssignCases: true,
  abandonedEmailAutomation: true,
  paymentAutoRetry: true,
  supportSlaHours: '8',
  defaultApplicationSla: '48',
  primaryBrand: 'var(--color-text)',
  requiredReviewerCount: '2',
  approvalQuorum: '75',
  complianceChecklistGate: true,
  webhookSigningSecret: '',
  analyticsWriteKey: '',
  paymentProvider: 'stripe',
  paymentApiKey: '',
  emailProvider: 'ses',
  emailApiKey: '',
  roleChangeRequiresApproval: true,
  allowSelfRoleEscalation: false
};

const topTabs: Array<{ id: TopLevelTab; label: string; adminOnly?: boolean }> = [
  { id: 'general', label: 'General' },
  { id: 'security', label: 'Security', adminOnly: true },
  { id: 'workflow', label: 'Workflow' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'integrations', label: 'Integrations', adminOnly: true },
  { id: 'branding', label: 'Branding' },
  { id: 'access-roles', label: 'Access & Roles', adminOnly: true },
  { id: 'audit-logs', label: 'Audit Logs', adminOnly: true }
];

const integrationTabs: Array<{ id: IntegrationTab; label: string }> = [
  { id: 'payment', label: 'Payment' },
  { id: 'email', label: 'Email' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'analytics', label: 'Analytics' }
];

const tabFieldScope: Record<Exclude<TopLevelTab, 'audit-logs'>, Array<keyof PlatformSettings> | 'theme'> = {
  general: ['supportSlaHours', 'defaultApplicationSla', 'maintenanceMode'],
  security: ['requireMfaForAdmins', 'allowSelfRoleEscalation'],
  workflow: ['autoAssignCases', 'requiredReviewerCount', 'approvalQuorum', 'complianceChecklistGate'],
  notifications: ['abandonedEmailAutomation', 'paymentAutoRetry'],
  integrations: ['paymentProvider', 'paymentApiKey', 'emailProvider', 'emailApiKey', 'webhookSigningSecret', 'analyticsWriteKey'],
  branding: ['primaryBrand', 'maintenanceMode', 'supportSlaHours', 'defaultApplicationSla'],
  'access-roles': ['roleChangeRequiresApproval', 'allowSelfRoleEscalation']
};

const loadSettingsState = (): SettingsState => {
  if (typeof window === 'undefined') {
    return { platform: defaultPlatformSettings, theme: defaultThemeSettings };
  }

  try {
    const raw = window.localStorage.getItem(DASHBOARD_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { platform: defaultPlatformSettings, theme: loadThemeSettings() };
    }
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    const platform = { ...defaultPlatformSettings, ...(parsed.platform ?? {}) };
    return {
      platform,
      theme: parsed.theme ? { ...defaultThemeSettings, ...parsed.theme } : loadThemeSettings()
    };
  } catch {
    return { platform: defaultPlatformSettings, theme: loadThemeSettings() };
  }
};

const loadSettingsHistory = (): HistoryEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(DASHBOARD_SETTINGS_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isPositiveInteger = (value: string): boolean => /^\d+$/.test(value) && Number(value) > 0;

const computeValidationErrors = (state: SettingsState): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!isPositiveInteger(state.platform.supportSlaHours)) {
    errors.supportSlaHours = 'Support SLA must be a positive number of hours.';
  }
  if (!isPositiveInteger(state.platform.defaultApplicationSla)) {
    errors.defaultApplicationSla = 'Application SLA must be a positive number of hours.';
  }

  if (!isPositiveInteger(state.platform.requiredReviewerCount)) {
    errors.requiredReviewerCount = 'Required reviewer count must be a positive integer.';
  }

  const quorum = Number(state.platform.approvalQuorum);
  if (!Number.isFinite(quorum) || quorum < 1 || quorum > 100) {
    errors.approvalQuorum = 'Approval quorum must be between 1 and 100.';
  }

  return errors;
};

const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso));

export function SettingsPanel({ role, actorEmail }: { role: DashboardRole; actorEmail?: string }) {
  const isAdmin = role === 'admin';
  const visibleTabs = useMemo(() => topTabs.filter((tab) => !tab.adminOnly || isAdmin), [isAdmin]);
  const [activeTab, setActiveTab] = useState<TopLevelTab>(visibleTabs[0]?.id ?? 'general');
  const [activeIntegrationTab, setActiveIntegrationTab] = useState<IntegrationTab>('payment');
  const [savedState, setSavedState] = useState<SettingsState>(() => loadSettingsState());
  const [draftState, setDraftState] = useState<SettingsState>(() => loadSettingsState());
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadSettingsHistory());
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  const validationErrors = useMemo(() => computeValidationErrors(draftState), [draftState]);

  const sanitizedThemeSettings = useMemo<ThemeSettings>(
    () => ({
      global: {
        appBackground: sanitizeThemeColorValue(draftState.theme.global.appBackground, defaultThemeSettings.global.appBackground).sanitized,
        headerBackground: sanitizeThemeColorValue(draftState.theme.global.headerBackground, defaultThemeSettings.global.headerBackground).sanitized,
        buttonBackground: sanitizeThemeColorValue(draftState.theme.global.buttonBackground, defaultThemeSettings.global.buttonBackground).sanitized,
        buttonText: sanitizeThemeColorValue(draftState.theme.global.buttonText, defaultThemeSettings.global.buttonText).sanitized,
        footerBackground: sanitizeThemeColorValue(draftState.theme.global.footerBackground, defaultThemeSettings.global.footerBackground).sanitized
      },
      sections: {
        ...draftState.theme.sections,
        pageHeroBackground: sanitizeThemeColorValue(
          draftState.theme.sections.pageHeroBackground,
          defaultThemeSettings.sections.pageHeroBackground
        ).sanitized,
        applicationSectionBackground: sanitizeThemeColorValue(
          draftState.theme.sections.applicationSectionBackground,
          defaultThemeSettings.sections.applicationSectionBackground
        ).sanitized
      }
    }),
    [draftState.theme]
  );

  const contrastWarnings = useMemo(
    () =>
      getThemeContrastWarnings({
        buttonBackground: sanitizedThemeSettings.global.buttonBackground,
        buttonText: sanitizedThemeSettings.global.buttonText,
        headerBackground: sanitizedThemeSettings.global.headerBackground,
        headerText: '#1e3a5f',
        footerBackground: sanitizedThemeSettings.global.footerBackground,
        footerText: '#334155'
      }),
    [sanitizedThemeSettings]
  );

  const blockingContrastWarnings = useMemo(() => contrastWarnings.filter((warning) => warning.severity === 'error'), [contrastWarnings]);

  const tabDirtyMap = useMemo(() => {
    const dirty: Record<TopLevelTab, boolean> = {
      general: false,
      security: false,
      workflow: false,
      notifications: false,
      integrations: false,
      branding: false,
      'access-roles': false,
      'audit-logs': false
    };

    (Object.keys(tabFieldScope) as Array<Exclude<TopLevelTab, 'audit-logs'>>).forEach((tab) => {
      const scope = tabFieldScope[tab];
      if (scope === 'theme') {
        return;
      }
      dirty[tab] = scope.some((field) => draftState.platform[field] !== savedState.platform[field]);
    });

    dirty.branding =
      dirty.branding ||
      JSON.stringify(draftState.theme) !== JSON.stringify(savedState.theme) ||
      draftState.platform.primaryBrand !== savedState.platform.primaryBrand;

    return dirty;
  }, [draftState, savedState]);

  const hasUnsavedChanges = useMemo(() => Object.values(tabDirtyMap).some(Boolean), [tabDirtyMap]);
  const currentTabDirty = tabDirtyMap[activeTab];

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };

    const handleClick = (event: MouseEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]');
      if (!anchor || anchor.getAttribute('href')?.startsWith('#')) {
        return;
      }

      const shouldLeave = window.confirm('You have unsaved settings changes. Leave this page and discard them?');
      if (!shouldLeave) {
        event.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (visibleTabs.some((tab) => tab.id === activeTab)) {
      return;
    }
    setActiveTab(visibleTabs[0]?.id ?? 'general');
  }, [activeTab, visibleTabs]);

  const updatePlatform = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setDraftState((prev) => ({ ...prev, platform: { ...prev.platform, [key]: value } }));
    setSaveMessage('');
    setSaveError('');
  };

  const updateThemeGlobal = <K extends keyof ThemeSettings['global']>(key: K, value: ThemeSettings['global'][K]) => {
    setDraftState((prev) => ({ ...prev, theme: { ...prev.theme, global: { ...prev.theme.global, [key]: value } } }));
    setSaveMessage('');
    setSaveError('');
  };

  const updateThemeSection = <K extends keyof ThemeSettings['sections']>(key: K, value: ThemeSettings['sections'][K]) => {
    setDraftState((prev) => ({ ...prev, theme: { ...prev.theme, sections: { ...prev.theme.sections, [key]: value } } }));
    setSaveMessage('');
    setSaveError('');
  };

  const switchTopTab = (nextTab: TopLevelTab) => {
    if (nextTab === activeTab) {
      return;
    }
    if (currentTabDirty) {
      const allowed = window.confirm('You have unsaved changes in this tab. Continue without saving?');
      if (!allowed) {
        return;
      }
    }
    setActiveTab(nextTab);
  };

  const saveTab = (tab: TopLevelTab) => {
    if (tab === 'audit-logs') {
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      setSaveMessage('');
      setSaveError('Resolve validation errors before saving.');
      return;
    }

    if (tab === 'branding' && blockingContrastWarnings.length > 0) {
      setSaveMessage('');
      setSaveError('Cannot save branding tab until contrast warnings are resolved (minimum 4.5:1).');
      return;
    }

    const actor = actorEmail ?? `${role}@ausvisaservice.local`;
    const now = new Date().toISOString();
    const newHistory: HistoryEntry[] = [];

    const newSavedState: SettingsState = {
      platform: { ...savedState.platform },
      theme: { ...savedState.theme }
    };

    const scope = tabFieldScope[tab as Exclude<TopLevelTab, 'audit-logs'>];

    if (scope !== 'theme') {
      scope.forEach((key) => {
        if (savedState.platform[key] === draftState.platform[key]) {
          return;
        }
        newHistory.push({
          id: `${now}-${tab}-${String(key)}`,
          actor,
          tab,
          key: String(key),
          timestamp: now,
          before: savedState.platform[key],
          after: draftState.platform[key]
        });
        (newSavedState.platform as Record<string, string | boolean>)[String(key)] = draftState.platform[key];
      });
    }

    if (tab === 'branding') {
      if (JSON.stringify(savedState.theme) !== JSON.stringify(draftState.theme)) {
        newHistory.push({
          id: `${now}-branding-theme`,
          actor,
          tab: 'branding',
          key: 'themePalette',
          timestamp: now,
          before: JSON.stringify(savedState.theme),
          after: JSON.stringify(draftState.theme)
        });
      }
      newSavedState.theme = sanitizedThemeSettings;
      saveThemeSettings(sanitizedThemeSettings);
      applyThemeSettings(sanitizedThemeSettings);
    }

    const mergedHistory = [...newHistory, ...history].slice(0, 200);

    try {
      window.localStorage.setItem(
        DASHBOARD_SETTINGS_STORAGE_KEY,
        JSON.stringify({
          platform: newSavedState.platform,
          theme: newSavedState.theme
        })
      );
      window.localStorage.setItem(DASHBOARD_SETTINGS_HISTORY_STORAGE_KEY, JSON.stringify(mergedHistory));

      setSavedState(newSavedState);
      setHistory(mergedHistory);
      setSaveError('');
      setSaveMessage(newHistory.length ? `Saved ${tab.replace('-', ' ')} settings.` : 'No changes to save for this tab.');
    } catch {
      setSaveMessage('');
      setSaveError('Unable to save settings. Please try again.');
    }
  };

  const resetTab = (tab: TopLevelTab) => {
    if (tab === 'audit-logs') {
      return;
    }

    const scope = tabFieldScope[tab as Exclude<TopLevelTab, 'audit-logs'>];
    if (scope !== 'theme') {
      setDraftState((prev) => {
        const updatedPlatform = { ...prev.platform };
        scope.forEach((field) => {
          (updatedPlatform as Record<string, string | boolean>)[String(field)] = savedState.platform[field];
        });

        const next = { ...prev, platform: updatedPlatform };
        if (tab === 'branding') {
          next.theme = savedState.theme;
        }
        return next;
      });
    }

    if (tab === 'branding') {
      setDraftState((prev) => ({ ...prev, theme: savedState.theme }));
    }

    setSaveMessage('Tab changes reset.');
    setSaveError('');
  };

  const renderHelp = (text: string) => <small className="dashboard-settings-help">{text}</small>;

  const renderValidation = (field: string) =>
    validationErrors[field] ? <small className="dashboard-auth__message is-error">{validationErrors[field]}</small> : null;

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Settings</h2>
          <small>{hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}</small>
        </div>

        <div className="dashboard-settings-tablist" role="tablist" aria-label="Settings tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`dashboard-settings-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => switchTopTab(tab.id)}
            >
              {tab.label}
              {tabDirtyMap[tab.id] ? <span className="dashboard-settings-tab__dirty">•</span> : null}
            </button>
          ))}
        </div>
      </article>

      {activeTab === 'general' ? (
        <article className="dashboard-panel">
          <div className="dashboard-settings-grid">
            <label>
              Support SLA (Hours)
              <input value={draftState.platform.supportSlaHours} onChange={(event) => updatePlatform('supportSlaHours', event.target.value)} />
              {renderHelp('Target first-response SLA used in support dashboards and escalations.')}
              {renderValidation('supportSlaHours')}
            </label>
            <label>
              Application SLA (Hours)
              <input
                value={draftState.platform.defaultApplicationSla}
                onChange={(event) => updatePlatform('defaultApplicationSla', event.target.value)}
              />
              {renderHelp('Default completion SLA for new visa applications.')}
              {renderValidation('defaultApplicationSla')}
            </label>
            <label>
              <input type="checkbox" checked={draftState.platform.maintenanceMode} onChange={(event) => updatePlatform('maintenanceMode', event.target.checked)} />
              Maintenance Mode
              {renderHelp('Shows maintenance notices and pauses customer submissions.')}
            </label>
          </div>
        </article>
      ) : null}

      {activeTab === 'security' ? (
        <article className="dashboard-panel">
          <div className="dashboard-settings-grid">
            <label>
              <input
                type="checkbox"
                checked={draftState.platform.requireMfaForAdmins}
                onChange={(event) => updatePlatform('requireMfaForAdmins', event.target.checked)}
              />
              Require MFA for Admins
              {renderHelp('Applies strong authentication to all admin sessions.')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={draftState.platform.allowSelfRoleEscalation}
                onChange={(event) => updatePlatform('allowSelfRoleEscalation', event.target.checked)}
              />
              Allow self role escalation
              {renderHelp('Critical policy: should remain disabled for production environments.')}
            </label>
          </div>
        </article>
      ) : null}

      {activeTab === 'workflow' ? (
        <article className="dashboard-panel">
          <div className="dashboard-settings-grid">
            <label>
              Required Reviewer Count
              <input
                value={draftState.platform.requiredReviewerCount}
                onChange={(event) => updatePlatform('requiredReviewerCount', event.target.value)}
              />
              {renderHelp('Minimum reviewers needed before a blog can be published.')}
              {renderValidation('requiredReviewerCount')}
            </label>
            <label>
              Approval Quorum (%)
              <input value={draftState.platform.approvalQuorum} onChange={(event) => updatePlatform('approvalQuorum', event.target.value)} />
              {renderHelp('Percentage of assigned reviewers required for approval.')}
              {renderValidation('approvalQuorum')}
            </label>
            <label>
              <input type="checkbox" checked={draftState.platform.autoAssignCases} onChange={(event) => updatePlatform('autoAssignCases', event.target.checked)} />
              Auto assign new cases
            </label>
            <label>
              <input
                type="checkbox"
                checked={draftState.platform.complianceChecklistGate}
                onChange={(event) => updatePlatform('complianceChecklistGate', event.target.checked)}
              />
              Enforce compliance checklist before publish
            </label>
          </div>
        </article>
      ) : null}

      {activeTab === 'notifications' ? (
        <article className="dashboard-panel">
          <div className="dashboard-settings-grid">
            <label>
              <input
                type="checkbox"
                checked={draftState.platform.abandonedEmailAutomation}
                onChange={(event) => updatePlatform('abandonedEmailAutomation', event.target.checked)}
              />
              Abandoned lead email automation
              {renderHelp('Automatically sends follow-ups for incomplete applications.')}
            </label>
            <label>
              <input type="checkbox" checked={draftState.platform.paymentAutoRetry} onChange={(event) => updatePlatform('paymentAutoRetry', event.target.checked)} />
              Payment auto retry
              {renderHelp('Retries failed payments before moving invoices to manual collections.')}
            </label>
          </div>
        </article>
      ) : null}

      {activeTab === 'integrations' ? (
        <article className="dashboard-panel">
          <div className="dashboard-settings-subtabs" role="tablist" aria-label="Integration tabs">
            {integrationTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`dashboard-settings-subtab ${activeIntegrationTab === tab.id ? 'is-active' : ''}`}
                onClick={() => setActiveIntegrationTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="dashboard-settings-grid">
            {activeIntegrationTab === 'payment' ? (
              <>
                <label>
                  Payment Provider
                  <select
                    value={draftState.platform.paymentProvider}
                    onChange={(event) => updatePlatform('paymentProvider', event.target.value as PlatformSettings['paymentProvider'])}
                  >
                    <option value="stripe">Stripe</option>
                    <option value="braintree">Braintree</option>
                  </select>
                </label>
                <label>
                  Payment API Key
                  <input value={draftState.platform.paymentApiKey} onChange={(event) => updatePlatform('paymentApiKey', event.target.value)} />
                  {renderHelp('Admin only secret. Used for payment authorization and retries.')}
                </label>
              </>
            ) : null}

            {activeIntegrationTab === 'email' ? (
              <>
                <label>
                  Email Provider
                  <select
                    value={draftState.platform.emailProvider}
                    onChange={(event) => updatePlatform('emailProvider', event.target.value as PlatformSettings['emailProvider'])}
                  >
                    <option value="ses">Amazon SES</option>
                    <option value="sendgrid">SendGrid</option>
                  </select>
                </label>
                <label>
                  Email API Key
                  <input value={draftState.platform.emailApiKey} onChange={(event) => updatePlatform('emailApiKey', event.target.value)} />
                </label>
              </>
            ) : null}

            {activeIntegrationTab === 'webhooks' ? <WebhooksIntegrationTab /> : null}

            {activeIntegrationTab === 'analytics' ? (
              <label>
                Analytics Write Key
                <input value={draftState.platform.analyticsWriteKey} onChange={(event) => updatePlatform('analyticsWriteKey', event.target.value)} />
              </label>
            ) : null}
          </div>
        </article>
      ) : null}

      {activeTab === 'branding' ? (
        <article className="dashboard-panel">
          <div className="dashboard-settings-grid">
            <label>
              Primary Brand Color
              <input value={draftState.platform.primaryBrand} onChange={(event) => updatePlatform('primaryBrand', event.target.value)} />
              {renderHelp('Brand token used for charts and admin highlights.')}
            </label>
            <label>
              App Background
              <input type="text" value={draftState.theme.global.appBackground} onChange={(event) => updateThemeGlobal('appBackground', event.target.value)} />
            </label>
            <label>
              Header Background
              <input type="text" value={draftState.theme.global.headerBackground} onChange={(event) => updateThemeGlobal('headerBackground', event.target.value)} />
            </label>
            <label>
              Button Background
              <input type="text" value={draftState.theme.global.buttonBackground} onChange={(event) => updateThemeGlobal('buttonBackground', event.target.value)} />
            </label>
            <label>
              Button Text Color
              <input type="text" value={draftState.theme.global.buttonText} onChange={(event) => updateThemeGlobal('buttonText', event.target.value)} />
            </label>
            <label>
              Footer Background
              <input type="text" value={draftState.theme.global.footerBackground} onChange={(event) => updateThemeGlobal('footerBackground', event.target.value)} />
            </label>
          </div>
          <div className="dashboard-toggle-list">
            <label>
              <input
                type="checkbox"
                checked={draftState.theme.sections.enableApplicationSectionBackground}
                onChange={(event) => updateThemeSection('enableApplicationSectionBackground', event.target.checked)}
              />
              Override Application Section Background
            </label>
            <label>
              Application Section Background
              <input
                type="text"
                value={draftState.theme.sections.applicationSectionBackground}
                onChange={(event) => updateThemeSection('applicationSectionBackground', event.target.value)}
                disabled={!draftState.theme.sections.enableApplicationSectionBackground}
              />
            </label>
          </div>
          {contrastWarnings.length ? (
            <div className="dashboard-settings-warnings" role="status" aria-live="polite">
              {contrastWarnings.map((warning) => (
                <p key={warning.id} className={`dashboard-auth__message ${warning.severity === 'error' ? 'is-error' : 'is-warning'}`}>
                  {warning.message}
                </p>
              ))}
            </div>
          ) : null}
        </article>
      ) : null}

      {activeTab === 'access-roles' ? (
        <article className="dashboard-panel">
          <div className="dashboard-settings-grid">
            <label>
              <input
                type="checkbox"
                checked={draftState.platform.roleChangeRequiresApproval}
                onChange={(event) => updatePlatform('roleChangeRequiresApproval', event.target.checked)}
              />
              Role changes require admin approval
              {renderHelp('RBAC policy change requests must be approved by an admin.')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={draftState.platform.allowSelfRoleEscalation}
                onChange={(event) => updatePlatform('allowSelfRoleEscalation', event.target.checked)}
              />
              Allow self role escalation
              {renderHelp('Sensitive setting. Enabling this weakens RBAC protections.')}
            </label>
          </div>
        </article>
      ) : null}

      {activeTab === 'audit-logs' ? (
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2>Settings Change History</h2>
            <small>{history.length} entries</small>
          </div>
          {history.length ? (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Actor</th>
                    <th>Tab</th>
                    <th>Field</th>
                    <th>Before</th>
                    <th>After</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.actor}</td>
                      <td>{entry.tab}</td>
                      <td>{entry.key}</td>
                      <td>{String(entry.before).slice(0, 80)}</td>
                      <td>{String(entry.after).slice(0, 80)}</td>
                      <td>{formatDateTime(entry.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="dashboard-panel__note">No settings changes have been recorded yet.</p>
          )}
        </article>
      ) : null}

      {activeTab !== 'audit-logs' ? (
        <article className="dashboard-panel">
          <div className="dashboard-settings-actions">
            <button type="button" className="dashboard-primary-button" onClick={() => saveTab(activeTab)}>
              Save {topTabs.find((tab) => tab.id === activeTab)?.label}
            </button>
            <button type="button" className="dashboard-ghost-button" onClick={() => resetTab(activeTab)}>
              Reset {topTabs.find((tab) => tab.id === activeTab)?.label}
            </button>
          </div>
          {saveMessage ? <p className="dashboard-auth__message is-success">{saveMessage}</p> : null}
          {saveError ? <p className="dashboard-auth__message is-error">{saveError}</p> : null}
        </article>
      ) : null}
    </section>
  );
}
