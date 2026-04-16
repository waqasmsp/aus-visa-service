import { useEffect, useId, useMemo, useState } from 'react';
import { getAdditionalContrastWarnings, getThemeContrastWarnings, sanitizeThemeColorValue } from '../../../utils/themeColors';
import { applyThemeSettings, defaultThemeSettings, loadThemeSettings, saveThemeSettings, ThemeSettings } from '../../../utils/themeSettings';
import { WebhooksIntegrationTab } from './integrations/WebhooksIntegrationTab';
import { DashboardButton } from '../common/DashboardButton';
import { DashboardCheckbox } from '../common/DashboardCheckbox';
import { DashboardInput } from '../common/DashboardInput';
import { DashboardSelect } from '../common/DashboardSelect';
import { canPerform, collectDestructiveApproval } from '../../../services/dashboard/authPolicy';
import { listAuditEvents, writeAuditEvent } from '../../../services/dashboard/audit.service';
import { useDashboardNotifications } from '../common/DashboardNotificationsProvider';

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
type MacroTab = 'platform' | 'security' | 'integrations' | 'branding-access';
type SectionId = 'operations' | 'workflow' | 'notifications' | 'mfa' | 'audit' | 'payments' | 'email' | 'webhooks' | 'analytics' | 'branding' | 'access';

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

const macroTabs: Array<{ id: MacroTab; label: string; adminOnly?: boolean }> = [
  { id: 'platform', label: 'Platform' },
  { id: 'security', label: 'Security', adminOnly: true },
  { id: 'integrations', label: 'Integrations', adminOnly: true },
  { id: 'branding-access', label: 'Branding & Access' }
];

const macroTabToLegacyTabs: Record<MacroTab, TopLevelTab[]> = {
  platform: ['general', 'workflow', 'notifications'],
  security: ['security', 'audit-logs'],
  integrations: ['integrations'],
  'branding-access': ['branding', 'access-roles']
};

const sectionDefinitions: Array<{ id: SectionId; macro: MacroTab; label: string; tab: TopLevelTab; integrationTab?: 'payment' | 'email' | 'webhooks' | 'analytics'; adminOnly?: boolean }> = [
  { id: 'operations', macro: 'platform', label: 'Operations', tab: 'general' },
  { id: 'workflow', macro: 'platform', label: 'Workflow', tab: 'workflow' },
  { id: 'notifications', macro: 'platform', label: 'Notifications', tab: 'notifications' },
  { id: 'mfa', macro: 'security', label: 'MFA & Session', tab: 'security', adminOnly: true },
  { id: 'audit', macro: 'security', label: 'Audit Logs', tab: 'audit-logs', adminOnly: true },
  { id: 'payments', macro: 'integrations', label: 'Payments', tab: 'integrations', integrationTab: 'payment', adminOnly: true },
  { id: 'email', macro: 'integrations', label: 'Email', tab: 'integrations', integrationTab: 'email', adminOnly: true },
  { id: 'webhooks', macro: 'integrations', label: 'Webhooks', tab: 'integrations', integrationTab: 'webhooks', adminOnly: true },
  { id: 'analytics', macro: 'integrations', label: 'Analytics', tab: 'integrations', integrationTab: 'analytics', adminOnly: true },
  { id: 'branding', macro: 'branding-access', label: 'Branding', tab: 'branding' },
  { id: 'access', macro: 'branding-access', label: 'Access & Roles', tab: 'access-roles', adminOnly: true }
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

export function SettingsPanel({ role, actorEmail }: { role: DashboardRole; actorEmail?: string }) {
  const settingsTablistId = useId();
  const isAdmin = role === 'admin';
  const visibleMacroTabs = useMemo(() => macroTabs.filter((tab) => !tab.adminOnly || isAdmin), [isAdmin]);
  const [activeMacroTab, setActiveMacroTab] = useState<MacroTab>(visibleMacroTabs[0]?.id ?? 'platform');
  const visibleSections = useMemo(() => sectionDefinitions.filter((section) => !section.adminOnly || isAdmin), [isAdmin]);
  const sectionMap = useMemo(() => Object.fromEntries(visibleSections.map((section) => [section.id, section])) as Record<SectionId, (typeof visibleSections)[number]>, [visibleSections]);
  const [activeSection, setActiveSection] = useState<SectionId>('operations');
  const [expandedMobileSections, setExpandedMobileSections] = useState<SectionId[]>(['operations']);
  const [savedState, setSavedState] = useState<SettingsState>(() => loadSettingsState());
  const [draftState, setDraftState] = useState<SettingsState>(() => loadSettingsState());
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadSettingsHistory());
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActor, setAuditActor] = useState('');
  const [auditAction, setAuditAction] = useState('');
  const [auditEntityType, setAuditEntityType] = useState('');
  const [saveError, setSaveError] = useState('');
  const { notifyError, notifyInfo, notifySuccess, formatNotificationMessage } = useDashboardNotifications();

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
    () => [
      ...getThemeContrastWarnings({
        buttonBackground: sanitizedThemeSettings.global.buttonBackground,
        buttonText: sanitizedThemeSettings.global.buttonText,
        headerBackground: sanitizedThemeSettings.global.headerBackground,
        headerText: '#1e3a5f',
        footerBackground: sanitizedThemeSettings.global.footerBackground,
        footerText: '#334155'
      }),
      ...getAdditionalContrastWarnings([
        {
          id: 'dashboard-form-border',
          label: 'Dashboard form border vs surface',
          background: '#ffffff',
          foreground: '#94a3b8',
          minRatio: 3
        },
        {
          id: 'dashboard-muted-text',
          label: 'Dashboard muted text vs surface',
          background: '#ffffff',
          foreground: '#475569'
        },
        {
          id: 'dashboard-chip',
          label: 'Dashboard chip text vs chip surface',
          background: '#dbeafe',
          foreground: '#1e40af'
        }
      ])
    ],
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
  const activeLegacyTab = sectionMap[activeSection]?.tab ?? 'general';
  const currentTabDirty = tabDirtyMap[activeLegacyTab];
  const canManageSettings = canPerform(role, 'settings', 'manage_settings');
  const filteredAuditEvents = useMemo(
    () =>
      listAuditEvents({
        search: auditSearch,
        actor: auditActor,
        action: auditAction,
        entityType: auditEntityType || undefined
      }),
    [auditAction, auditActor, auditEntityType, auditSearch, history]
  );

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
    if (visibleMacroTabs.some((tab) => tab.id === activeMacroTab)) {
      return;
    }
    setActiveMacroTab(visibleMacroTabs[0]?.id ?? 'platform');
  }, [activeMacroTab, visibleMacroTabs]);

  useEffect(() => {
    const sectionsForMacro = visibleSections.filter((section) => section.macro === activeMacroTab);
    if (sectionsForMacro.some((section) => section.id === activeSection)) {
      return;
    }
    setActiveSection(sectionsForMacro[0]?.id ?? visibleSections[0]?.id ?? 'operations');
  }, [activeMacroTab, activeSection, visibleSections]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as MacroTab | null;
    const section = params.get('section') as SectionId | null;

    if (tab && visibleMacroTabs.some((entry) => entry.id === tab)) {
      setActiveMacroTab(tab);
    }
    if (section && sectionMap[section]) {
      setActiveSection(section);
      const linkedSection = sectionMap[section];
      setActiveMacroTab(linkedSection.macro);
    }
  }, [visibleMacroTabs, sectionMap]);

  const updatePlatform = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setDraftState((prev) => ({ ...prev, platform: { ...prev.platform, [key]: value } }));
    setSaveError('');
  };

  const updateThemeGlobal = <K extends keyof ThemeSettings['global']>(key: K, value: ThemeSettings['global'][K]) => {
    setDraftState((prev) => ({ ...prev, theme: { ...prev.theme, global: { ...prev.theme.global, [key]: value } } }));
    setSaveError('');
  };

  const updateThemeSection = <K extends keyof ThemeSettings['sections']>(key: K, value: ThemeSettings['sections'][K]) => {
    setDraftState((prev) => ({ ...prev, theme: { ...prev.theme, sections: { ...prev.theme.sections, [key]: value } } }));
    setSaveError('');
  };

  const setDeepLink = (macroTab: MacroTab, section: SectionId) => {
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set('tab', macroTab);
    params.set('section', section);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const switchMacroTab = (nextTab: MacroTab) => {
    if (nextTab === activeMacroTab) {
      return;
    }
    if (currentTabDirty) {
      const allowed = window.confirm('You have unsaved changes in this tab. Continue without saving?');
      if (!allowed) {
        return;
      }
    }
    const firstSection = visibleSections.find((section) => section.macro === nextTab);
    const nextSection = firstSection?.id ?? activeSection;
    setActiveMacroTab(nextTab);
    setActiveSection(nextSection);
    setDeepLink(nextTab, nextSection);
  };

  const switchSection = (section: SectionId) => {
    const next = sectionMap[section];
    if (!next) {
      return;
    }
    setActiveSection(section);
    setDeepLink(next.macro, section);
  };

  const saveTab = (tab: TopLevelTab) => {
    if (tab === 'audit-logs') {
      return;
    }
    if (!canManageSettings) {
      const message = 'Your role cannot manage platform settings.';
      setSaveError(message);
      notifyError(formatNotificationMessage({ entity: 'settings', action: 'edit', result: 'error' }, message));
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      const message = 'Resolve validation errors before saving.';
      setSaveError(message);
      notifyError(formatNotificationMessage({ entity: 'settings', action: 'edit', result: 'error' }, message));
      return;
    }

    if (tab === 'branding' && blockingContrastWarnings.length > 0) {
      const message = 'Cannot save branding tab until contrast warnings are resolved (minimum 4.5:1).';
      setSaveError(message);
      notifyError(formatNotificationMessage({ entity: 'settings', action: 'edit', result: 'error' }, message));
      return;
    }

    const actor = actorEmail ?? `${role}@ausvisaservice.local`;
    const approval = collectDestructiveApproval('settings', 'manage_settings', `${tab} settings`);
    if (!approval) {
      const message = 'Settings update canceled by policy safeguards.';
      setSaveError(message);
      notifyInfo(formatNotificationMessage({ entity: 'settings', action: 'edit', result: 'info' }, message));
      return;
    }
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
        writeAuditEvent({
          actor,
          action: `settings_update_${tab}`,
          entityType: 'settings',
          entityId: String(key),
          before: { value: savedState.platform[key] },
          after: { value: draftState.platform[key], ...approval }
        });
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
        writeAuditEvent({
          actor,
          action: 'settings_update_branding_theme',
          entityType: 'settings',
          entityId: 'themePalette',
          before: savedState.theme,
          after: { ...draftState.theme, ...approval }
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
      if (newHistory.length) {
        notifySuccess(formatNotificationMessage({ entity: 'settings', action: 'edit', result: 'success' }, `Saved ${tab.replace('-', ' ')} settings.`));
      } else {
        notifyInfo(formatNotificationMessage({ entity: 'settings', action: 'edit', result: 'info' }, 'No changes to save for this tab.'));
      }
    } catch {
      const message = 'Unable to save settings. Please try again.';
      setSaveError(message);
      notifyError(formatNotificationMessage({ entity: 'settings', action: 'edit', result: 'error' }, message));
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

    setSaveError('');
    notifyInfo(formatNotificationMessage({ entity: 'settings', action: 'edit', result: 'info' }, 'Tab changes reset.'));
  };

  const renderHelp = (text: string) => <small className="dashboard-settings-help">{text}</small>;

  const renderValidation = (field: string) =>
    validationErrors[field] ? <small className="dashboard-auth__message is-error">{validationErrors[field]}</small> : null;

  const macroUnsavedCount = useMemo(
    () =>
      Object.fromEntries(
        visibleMacroTabs.map((tab) => [
          tab.id,
          macroTabToLegacyTabs[tab.id].reduce((count, legacyTab) => count + (tabDirtyMap[legacyTab] ? 1 : 0), 0)
        ])
      ) as Record<MacroTab, number>,
    [tabDirtyMap, visibleMacroTabs]
  );

  const macroValidationCount = useMemo(() => {
    const counts: Record<MacroTab, number> = {
      platform: 0,
      security: 0,
      integrations: 0,
      'branding-access': 0
    };
    if (validationErrors.supportSlaHours) counts.platform += 1;
    if (validationErrors.defaultApplicationSla) counts.platform += 1;
    if (validationErrors.requiredReviewerCount) counts.platform += 1;
    if (validationErrors.approvalQuorum) counts.platform += 1;
    counts['branding-access'] += blockingContrastWarnings.length;
    return counts;
  }, [validationErrors, blockingContrastWarnings]);

  const validateActiveTab = () => {
    const count = macroValidationCount[activeMacroTab];
    if (count > 0) {
      notifyError(formatNotificationMessage({ entity: 'settings', action: 'edit', result: 'error' }, `${count} validation issues need attention.`));
      return;
    }
    notifySuccess(formatNotificationMessage({ entity: 'settings', action: 'edit', result: 'success' }, 'No validation issues found in this tab.'));
  };

  const saveMacro = (macro: MacroTab) => {
    macroTabToLegacyTabs[macro].forEach((tab) => {
      if (tab !== 'audit-logs') {
        saveTab(tab);
      }
    });
  };

  const resetMacro = (macro: MacroTab) => {
    macroTabToLegacyTabs[macro].forEach((tab) => {
      if (tab !== 'audit-logs') {
        resetTab(tab);
      }
    });
  };

  const activeSections = visibleSections.filter((section) => section.macro === activeMacroTab);

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Settings</h2>
          <small>{hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}</small>
        </div>

        <div className="dashboard-settings-tablist" role="tablist" aria-label="Settings tabs">
          {visibleMacroTabs.map((tab) => (
            <DashboardButton
              key={tab.id}
              id={`${settingsTablistId}-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeMacroTab === tab.id}
              aria-controls={`${settingsTablistId}-panel`}
              tabIndex={activeMacroTab === tab.id ? 0 : -1}
              className={`dashboard-settings-tab ${activeMacroTab === tab.id ? 'is-active' : ''}`}
              variant="ghost"
              size="sm"
              onClick={() => switchMacroTab(tab.id)}
            >
              {tab.label}
              {macroValidationCount[tab.id] > 0 ? <span className="dashboard-settings-tab__badge is-error">{macroValidationCount[tab.id]}</span> : null}
              {macroUnsavedCount[tab.id] > 0 ? <span className="dashboard-settings-tab__badge">{macroUnsavedCount[tab.id]}</span> : null}
            </DashboardButton>
          ))}
        </div>
      </article>

      <article className="dashboard-panel dashboard-settings-layout" role="tabpanel" id={`${settingsTablistId}-panel`} aria-labelledby={`${settingsTablistId}-${activeMacroTab}`}>
        <aside className="dashboard-settings-sidenav" aria-label="Settings sections">
          {activeSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`dashboard-settings-sidenav__item ${activeSection === section.id ? 'is-active' : ''}`}
              onClick={() => switchSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </aside>
        <div className="dashboard-settings-main">
          <div className="dashboard-settings-accordion">
            {activeSections.map((section) => (
              <article key={section.id} className="dashboard-settings-accordion__item">
                <button
                  type="button"
                  className={`dashboard-settings-accordion__trigger ${activeSection === section.id ? 'is-open' : ''}`}
                  onClick={() => {
                    switchSection(section.id);
                    setExpandedMobileSections((prev) => (prev.includes(section.id) ? prev.filter((entry) => entry !== section.id) : [...prev, section.id]));
                  }}
                >
                  {section.label}
                </button>
                <div className={`dashboard-settings-accordion__panel ${expandedMobileSections.includes(section.id) || activeSection === section.id ? 'is-open' : ''}`}>
                  {section.id === 'operations' ? (
                    <div className="dashboard-settings-grid">
                      <label>
                        Support SLA (Hours)
                        <DashboardInput value={draftState.platform.supportSlaHours} onChange={(event) => updatePlatform('supportSlaHours', event.target.value)} />
                        {renderHelp('Target first-response SLA used in support dashboards and escalations.')}
                        {renderValidation('supportSlaHours')}
                      </label>
                      <label>
                        Application SLA (Hours)
                        <DashboardInput
                          value={draftState.platform.defaultApplicationSla}
                          onChange={(event) => updatePlatform('defaultApplicationSla', event.target.value)}
                        />
                        {renderHelp('Default completion SLA for new visa applications.')}
                        {renderValidation('defaultApplicationSla')}
                      </label>
                      <label>
                        <DashboardCheckbox checked={draftState.platform.maintenanceMode} onChange={(event) => updatePlatform('maintenanceMode', event.target.checked)} label="Maintenance Mode" />
                        {renderHelp('Shows maintenance notices and pauses customer submissions.')}
                      </label>
                    </div>
                  ) : null}
                  {section.id === 'workflow' ? (
                    <div className="dashboard-settings-grid">
                      <label>
                        Required Reviewer Count
                        <DashboardInput
                          value={draftState.platform.requiredReviewerCount}
                          onChange={(event) => updatePlatform('requiredReviewerCount', event.target.value)}
                        />
                        {renderHelp('Minimum reviewers needed before a blog can be published.')}
                        {renderValidation('requiredReviewerCount')}
                      </label>
                      <label>
                        Approval Quorum (%)
                        <DashboardInput value={draftState.platform.approvalQuorum} onChange={(event) => updatePlatform('approvalQuorum', event.target.value)} />
                        {renderHelp('Percentage of assigned reviewers required for approval.')}
                        {renderValidation('approvalQuorum')}
                      </label>
                      <label>
                        <DashboardCheckbox
                          checked={draftState.platform.autoAssignCases}
                          onChange={(event) => updatePlatform('autoAssignCases', event.target.checked)}
                          label="Auto assign new cases"
                        />
                      </label>
                      <label>
                        <DashboardCheckbox
                          checked={draftState.platform.complianceChecklistGate}
                          onChange={(event) => updatePlatform('complianceChecklistGate', event.target.checked)}
                          label="Enforce compliance checklist before publish"
                        />
                      </label>
                    </div>
                  ) : null}
                  {section.id === 'notifications' ? (
                    <div className="dashboard-settings-grid">
                      <label>
                        <DashboardCheckbox
                          checked={draftState.platform.abandonedEmailAutomation}
                          onChange={(event) => updatePlatform('abandonedEmailAutomation', event.target.checked)}
                          label="Abandoned lead email automation"
                        />
                        {renderHelp('Automatically sends follow-ups for incomplete applications.')}
                      </label>
                      <label>
                        <DashboardCheckbox
                          checked={draftState.platform.paymentAutoRetry}
                          onChange={(event) => updatePlatform('paymentAutoRetry', event.target.checked)}
                          label="Payment auto retry"
                        />
                        {renderHelp('Retries failed payments before moving invoices to manual collections.')}
                      </label>
                    </div>
                  ) : null}
                  {section.id === 'mfa' ? (
                    <div className="dashboard-settings-grid">
                      <label>
                        <DashboardCheckbox
                          checked={draftState.platform.requireMfaForAdmins}
                          onChange={(event) => updatePlatform('requireMfaForAdmins', event.target.checked)}
                          label="Require MFA for Admins"
                        />
                        {renderHelp('Applies strong authentication to all admin sessions.')}
                      </label>
                      <label>
                        <DashboardCheckbox
                          checked={draftState.platform.allowSelfRoleEscalation}
                          onChange={(event) => updatePlatform('allowSelfRoleEscalation', event.target.checked)}
                          label="Allow self role escalation"
                        />
                        {renderHelp('Critical policy: should remain disabled for production environments.')}
                      </label>
                    </div>
                  ) : null}
                  {section.id === 'audit' ? (
                    <div>
                      <div className="dashboard-panel__header">
                        <h2>Audit Explorer</h2>
                        <small>{filteredAuditEvents.length} entries</small>
                      </div>
                      <div className="dashboard-filter-grid dashboard-filter-grid--dense">
                        <DashboardInput value={auditSearch} onChange={(event) => setAuditSearch(event.target.value)} placeholder="Search actor/action/entity/diff" />
                        <DashboardInput value={auditActor} onChange={(event) => setAuditActor(event.target.value)} placeholder="Actor email/name" />
                        <DashboardInput value={auditAction} onChange={(event) => setAuditAction(event.target.value)} placeholder="Action" />
                        <DashboardSelect value={auditEntityType} onChange={(event) => setAuditEntityType(event.target.value)}>
                          <option value="">All entity types</option>
                          <option value="applications">Applications</option>
                          <option value="users">Users</option>
                          <option value="blogs">Blogs</option>
                          <option value="pages">Pages</option>
                          <option value="settings">Settings</option>
                          <option value="webhooks">Webhooks</option>
                        </DashboardSelect>
                      </div>
                      {filteredAuditEvents.length ? (
                        <div className="dashboard-table-wrap">
                          <table className="dashboard-table">
                            <thead>
                              <tr>
                                <th>Actor</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Before</th>
                                <th>After</th>
                                <th>Session</th>
                                <th>Timestamp</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAuditEvents.map((entry) => (
                                <tr key={entry.id}>
                                  <td>{entry.actor}</td>
                                  <td>{entry.action}</td>
                                  <td>
                                    {entry.entityType}:{entry.entityId}
                                  </td>
                                  <td>{JSON.stringify(entry.before).slice(0, 80)}</td>
                                  <td>{JSON.stringify(entry.after).slice(0, 80)}</td>
                                  <td>{entry.requestMetadata.sessionId ?? 'n/a'}</td>
                                  <td>{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.timestamp))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="dashboard-panel__note">No audit events found for current filters.</p>
                      )}
                    </div>
                  ) : null}
                  {section.macro === 'integrations' ? (
                    <div className="dashboard-settings-grid">
                      {section.id === 'payments' ? (
                        <>
                          <label>
                            Payment Provider
                            <DashboardSelect
                              value={draftState.platform.paymentProvider}
                              onChange={(event) => updatePlatform('paymentProvider', event.target.value as PlatformSettings['paymentProvider'])}
                            >
                              <option value="stripe">Stripe</option>
                              <option value="braintree">Braintree</option>
                            </DashboardSelect>
                          </label>
                          <label>
                            Payment API Key
                            <DashboardInput value={draftState.platform.paymentApiKey} onChange={(event) => updatePlatform('paymentApiKey', event.target.value)} />
                          </label>
                        </>
                      ) : null}
                      {section.id === 'email' ? (
                        <>
                          <label>
                            Email Provider
                            <DashboardSelect
                              value={draftState.platform.emailProvider}
                              onChange={(event) => updatePlatform('emailProvider', event.target.value as PlatformSettings['emailProvider'])}
                            >
                              <option value="ses">Amazon SES</option>
                              <option value="sendgrid">SendGrid</option>
                            </DashboardSelect>
                          </label>
                          <label>
                            Email API Key
                            <DashboardInput value={draftState.platform.emailApiKey} onChange={(event) => updatePlatform('emailApiKey', event.target.value)} />
                          </label>
                        </>
                      ) : null}
                      {section.id === 'webhooks' ? <WebhooksIntegrationTab role={role} actor={actorEmail ?? `${role}@ausvisaservice.local`} /> : null}
                      {section.id === 'analytics' ? (
                        <label>
                          Analytics Write Key
                          <DashboardInput value={draftState.platform.analyticsWriteKey} onChange={(event) => updatePlatform('analyticsWriteKey', event.target.value)} />
                        </label>
                      ) : null}
                    </div>
                  ) : null}
                  {section.id === 'branding' ? (
                    <article className="dashboard-panel">
                      <div className="dashboard-settings-grid">
                        <label>
                          Primary Brand Color
                          <DashboardInput value={draftState.platform.primaryBrand} onChange={(event) => updatePlatform('primaryBrand', event.target.value)} />
                          {renderHelp('Brand token used for charts and admin highlights.')}
                        </label>
                        <label>
                          App Background
                          <DashboardInput type="text" value={draftState.theme.global.appBackground} onChange={(event) => updateThemeGlobal('appBackground', event.target.value)} />
                        </label>
                        <label>
                          Header Background
                          <DashboardInput type="text" value={draftState.theme.global.headerBackground} onChange={(event) => updateThemeGlobal('headerBackground', event.target.value)} />
                        </label>
                        <label>
                          Button Background
                          <DashboardInput type="text" value={draftState.theme.global.buttonBackground} onChange={(event) => updateThemeGlobal('buttonBackground', event.target.value)} />
                        </label>
                        <label>
                          Button Text Color
                          <DashboardInput type="text" value={draftState.theme.global.buttonText} onChange={(event) => updateThemeGlobal('buttonText', event.target.value)} />
                        </label>
                        <label>
                          Footer Background
                          <DashboardInput type="text" value={draftState.theme.global.footerBackground} onChange={(event) => updateThemeGlobal('footerBackground', event.target.value)} />
                        </label>
                      </div>
                      <div className="dashboard-toggle-list">
                        <label>
                          <DashboardCheckbox
                            checked={draftState.theme.sections.enableApplicationSectionBackground}
                            onChange={(event) => updateThemeSection('enableApplicationSectionBackground', event.target.checked)}
                            label="Override Application Section Background"
                          />
                        </label>
                        <label>
                          Application Section Background
                          <DashboardInput
                            type="text"
                            value={draftState.theme.sections.applicationSectionBackground}
                            onChange={(event) => updateThemeSection('applicationSectionBackground', event.target.value)}
                            disabled={!draftState.theme.sections.enableApplicationSectionBackground}
                          />
                        </label>
                      </div>
                    </article>
                  ) : null}
                  {section.id === 'access' ? (
                    <div className="dashboard-settings-grid">
                      <label>
                        <DashboardCheckbox
                          checked={draftState.platform.roleChangeRequiresApproval}
                          onChange={(event) => updatePlatform('roleChangeRequiresApproval', event.target.checked)}
                          label="Role changes require admin approval"
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </article>
      <article className="dashboard-panel dashboard-settings-actions-bar">
        <div className="dashboard-settings-actions">
          <DashboardButton type="button" variant="primary" onClick={() => saveMacro(activeMacroTab)} disabled={!canManageSettings}>
            Save {macroTabs.find((tab) => tab.id === activeMacroTab)?.label}
          </DashboardButton>
          <DashboardButton type="button" variant="ghost" onClick={() => resetMacro(activeMacroTab)}>
            Discard changes
          </DashboardButton>
          <DashboardButton type="button" variant="secondary" onClick={validateActiveTab}>
            Validate tab
          </DashboardButton>
        </div>
        {saveError ? <p className="dashboard-auth__message is-error">{saveError}</p> : null}
      </article>
    </section>
  );
}
