export type DashboardRole = 'admin' | 'manager' | 'user';

export type DashboardDummyCredential = {
  role: DashboardRole;
  email: string;
  password: string;
  route: string;
};

const DUMMY_LOGIN_DB_KEY = 'aus-visa-dashboard-dummy-login-db';

const seededCredentials: DashboardDummyCredential[] = [
  { role: 'admin', email: 'admin@ausvisaservice.com', password: 'Admin@123', route: '/dashboard' },
  { role: 'manager', email: 'manager@ausvisaservice.com', password: 'Manager@123', route: '/dashboard' },
  { role: 'user', email: 'user@ausvisaservice.com', password: 'User@123', route: '/dashboard' }
];

const readCredentialDb = (): DashboardDummyCredential[] => {
  if (typeof window === 'undefined') {
    return seededCredentials;
  }

  const raw = window.localStorage.getItem(DUMMY_LOGIN_DB_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as DashboardDummyCredential[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry) => entry.email && entry.password && entry.role && entry.route);
  } catch {
    return [];
  }
};

const writeCredentialDb = (records: DashboardDummyCredential[]): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(DUMMY_LOGIN_DB_KEY, JSON.stringify(records));
};

const sortByRole = (records: DashboardDummyCredential[]): DashboardDummyCredential[] => {
  const rank: Record<DashboardRole, number> = { admin: 0, manager: 1, user: 2 };
  return [...records].sort((a, b) => rank[a.role] - rank[b.role]);
};

export const loginCredentialsService = {
  async ensureSeeded(): Promise<DashboardDummyCredential[]> {
    const existing = readCredentialDb();
    if (existing.length > 0) {
      return sortByRole(existing);
    }

    writeCredentialDb(seededCredentials);
    return sortByRole(seededCredentials);
  },

  async list(): Promise<DashboardDummyCredential[]> {
    return sortByRole(readCredentialDb());
  },

  async validate(email: string, password: string): Promise<DashboardDummyCredential | null> {
    const records = readCredentialDb();
    const normalizedEmail = email.trim().toLowerCase();
    const match = records.find((item) => item.email.toLowerCase() === normalizedEmail && item.password === password);
    return match ?? null;
  }
};
