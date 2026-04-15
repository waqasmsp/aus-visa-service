export type DashboardModuleKey = 'core-data-layer' | 'applications' | 'users' | 'pages' | 'blogs' | 'settings' | 'webhooks' | 'rbac-audit';

export type ModuleFlag = {
  key: DashboardModuleKey;
  enabled: boolean;
  rollout: number;
  owner: string;
  description: string;
};

const STORAGE_KEY = 'aus-visa-dashboard-feature-flags-v1';

const defaults: ModuleFlag[] = [
  {
    key: 'core-data-layer',
    enabled: true,
    rollout: 100,
    owner: 'platform',
    description: 'Data layer, shared table primitives, and top navigation framework.'
  },
  {
    key: 'applications',
    enabled: true,
    rollout: 100,
    owner: 'operations',
    description: 'Applications CRUD workflows and dashboards.'
  },
  {
    key: 'users',
    enabled: true,
    rollout: 100,
    owner: 'operations',
    description: 'User CRM and permissions-sensitive actions.'
  },
  {
    key: 'pages',
    enabled: true,
    rollout: 100,
    owner: 'content',
    description: 'CMS pages module parity and publishing flow.'
  },
  {
    key: 'blogs',
    enabled: true,
    rollout: 100,
    owner: 'content',
    description: 'Blog CMS module parity and review workflow.'
  },
  {
    key: 'settings',
    enabled: true,
    rollout: 100,
    owner: 'platform',
    description: 'Settings panel including integrations and branding.'
  },
  {
    key: 'webhooks',
    enabled: true,
    rollout: 100,
    owner: 'platform',
    description: 'Webhook delivery controls and observability.'
  },
  {
    key: 'rbac-audit',
    enabled: true,
    rollout: 100,
    owner: 'security',
    description: 'RBAC enforcement surfaces and audit log views.'
  }
];

const isBrowser = (): boolean => typeof window !== 'undefined';

export const listModuleFlags = (): ModuleFlag[] => {
  if (!isBrowser()) return defaults;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as ModuleFlag[];
    if (!Array.isArray(parsed)) return defaults;
    return defaults.map((flag) => parsed.find((item) => item.key === flag.key) ?? flag);
  } catch {
    return defaults;
  }
};

export const isModuleEnabled = (key: DashboardModuleKey): boolean => {
  const flag = listModuleFlags().find((entry) => entry.key === key);
  return Boolean(flag?.enabled && (flag.rollout ?? 0) > 0);
};

export const updateModuleFlag = (key: DashboardModuleKey, next: Partial<Pick<ModuleFlag, 'enabled' | 'rollout'>>): ModuleFlag[] => {
  const updated = listModuleFlags().map((flag) =>
    flag.key === key
      ? {
          ...flag,
          enabled: next.enabled ?? flag.enabled,
          rollout: typeof next.rollout === 'number' ? Math.min(100, Math.max(0, next.rollout)) : flag.rollout
        }
      : flag
  );

  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return updated;
};
