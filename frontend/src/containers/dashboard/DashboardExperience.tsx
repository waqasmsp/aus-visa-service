import { FormEvent, useEffect, useMemo, useState } from 'react';

type DashboardExperienceProps = {
  pathname: string;
};

type DashboardRole = 'admin' | 'manager' | 'user';
type AuthSession = {
  role: DashboardRole;
  email: string;
  loginAt: string;
};
type DashboardSection = 'overview' | 'pages' | 'users' | 'visa-applications' | 'documents' | 'payments' | 'settings';
type UserSection = 'overview' | 'applications' | 'documents' | 'payments' | 'messages' | 'profile';
type PageStatus = 'Published' | 'Draft' | 'Archived';
type UserSegment = 'Registered' | 'Lead';
type ApplicationStatus = 'Submitted' | 'In Review' | 'Documents Needed' | 'Approved' | 'Completed' | 'Rejected';

type CmsPage = {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  updatedBy: string;
  updatedAt: string;
  locale: string;
  views: number;
};

type PortalUser = {
  id: string;
  fullName: string;
  email: string;
  segment: UserSegment;
  purchased: boolean;
  source: string;
  country: string;
  spentUsd: number;
  lastSeen: string;
};

type VisaApplication = {
  id: string;
  applicant: string;
  email: string;
  visaType: string;
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string;
  submittedOn: string;
  status: ApplicationStatus;
};

const AUTH_SESSION_KEY = 'aus-visa-auth-session';

const roleOptions: Array<{ role: DashboardRole; label: string; helper: string }> = [
  { role: 'admin', label: 'Admin', helper: 'Full control over all modules' },
  { role: 'manager', label: 'Manager', helper: 'Operations and team workflows' },
  { role: 'user', label: 'User', helper: 'Personal and application-level view' }
];

const roleScope: Record<DashboardRole, DashboardSection[]> = {
  admin: ['overview', 'pages', 'users', 'visa-applications', 'documents', 'payments', 'settings'],
  manager: ['overview', 'pages', 'users', 'visa-applications', 'documents', 'payments', 'settings'],
  user: ['overview', 'visa-applications', 'documents', 'settings']
};

const sidebarItems: Array<{ section: DashboardSection; label: string; href: string; badge?: string }> = [
  { section: 'overview', label: 'Dashboard', href: '/dashboard' },
  { section: 'pages', label: 'Pages', href: '/dashboard/pages', badge: 'CMS' },
  { section: 'users', label: 'Users', href: '/dashboard/users', badge: 'CRM' },
  { section: 'visa-applications', label: 'Visa Applications', href: '/dashboard/visa-applications', badge: 'Core' },
  { section: 'documents', label: 'Documents', href: '/dashboard/documents' },
  { section: 'payments', label: 'Payments', href: '/dashboard/payments' },
  { section: 'settings', label: 'Settings', href: '/dashboard/settings' }
];

const userSidebarItems: Array<{ section: UserSection; label: string; href: string; badge?: string }> = [
  { section: 'overview', label: 'Overview', href: '/user-dashboard' },
  { section: 'applications', label: 'My Applications', href: '/user-dashboard/applications', badge: 'Core' },
  { section: 'documents', label: 'My Documents', href: '/user-dashboard/documents' },
  { section: 'payments', label: 'Payments', href: '/user-dashboard/payments' },
  { section: 'messages', label: 'Support', href: '/user-dashboard/messages' },
  { section: 'profile', label: 'Profile', href: '/user-dashboard/profile' }
];

const initialPages: CmsPage[] = [
  {
    id: 'page-1',
    title: 'Home Landing',
    slug: '/home',
    status: 'Published',
    updatedBy: 'Sarah Weston',
    updatedAt: '2026-04-10',
    locale: 'EN',
    views: 58214
  },
  {
    id: 'page-2',
    title: 'Visa Pricing',
    slug: '/visa-pricing',
    status: 'Published',
    updatedBy: 'Mike T.',
    updatedAt: '2026-04-11',
    locale: 'EN',
    views: 22120
  },
  {
    id: 'page-3',
    title: 'Corporate Intake Form',
    slug: '/corporate-intake',
    status: 'Draft',
    updatedBy: 'Admin Team',
    updatedAt: '2026-04-07',
    locale: 'EN',
    views: 294
  },
  {
    id: 'page-4',
    title: 'Refund Policy Legacy',
    slug: '/refund-policy-legacy',
    status: 'Archived',
    updatedBy: 'Nina K.',
    updatedAt: '2026-03-28',
    locale: 'EN',
    views: 780
  }
];

const initialUsers: PortalUser[] = [
  {
    id: 'usr-1',
    fullName: 'Arman Siddiqui',
    email: 'arman.s@example.com',
    segment: 'Registered',
    purchased: true,
    source: 'Google Search',
    country: 'Pakistan',
    spentUsd: 149,
    lastSeen: '2h ago'
  },
  {
    id: 'usr-2',
    fullName: 'Olivia Brown',
    email: 'olivia.brown@example.com',
    segment: 'Lead',
    purchased: false,
    source: 'Meta Ads',
    country: 'United Kingdom',
    spentUsd: 0,
    lastSeen: '1d ago'
  },
  {
    id: 'usr-3',
    fullName: 'Hassan Ali',
    email: 'hassan.ali@example.com',
    segment: 'Registered',
    purchased: false,
    source: 'Direct',
    country: 'UAE',
    spentUsd: 0,
    lastSeen: '45m ago'
  },
  {
    id: 'usr-4',
    fullName: 'Emma Wilson',
    email: 'emma.w@example.com',
    segment: 'Registered',
    purchased: true,
    source: 'Referral',
    country: 'United States',
    spentUsd: 299,
    lastSeen: '4h ago'
  },
  {
    id: 'usr-5',
    fullName: 'Noah Farooq',
    email: 'noah.farooq@example.com',
    segment: 'Lead',
    purchased: false,
    source: 'Email Campaign',
    country: 'Saudi Arabia',
    spentUsd: 0,
    lastSeen: '6h ago'
  }
];

const initialApplications: VisaApplication[] = [
  {
    id: 'AUS-24019',
    applicant: 'Sophia Collins',
    email: 'sophia.c@example.com',
    visaType: 'Tourist Visa',
    priority: 'High',
    assignedTo: 'Nadia R.',
    submittedOn: '2026-04-11',
    status: 'In Review'
  },
  {
    id: 'AUS-24020',
    applicant: 'Bilal Ahmed',
    email: 'bilal.ahmed@example.com',
    visaType: 'Business Visa',
    priority: 'Medium',
    assignedTo: 'Mikael D.',
    submittedOn: '2026-04-10',
    status: 'Documents Needed'
  },
  {
    id: 'AUS-24021',
    applicant: 'Grace Thomas',
    email: 'grace.t@example.com',
    visaType: 'Family Visa',
    priority: 'Low',
    assignedTo: 'Nadia R.',
    submittedOn: '2026-04-09',
    status: 'Submitted'
  },
  {
    id: 'AUS-24022',
    applicant: 'Ibrahim Khan',
    email: 'ibrahim.k@example.com',
    visaType: 'Student Visa',
    priority: 'High',
    assignedTo: 'Jordan M.',
    submittedOn: '2026-04-06',
    status: 'Approved'
  },
  {
    id: 'AUS-24023',
    applicant: 'Liam Cooper',
    email: 'liam.cooper@example.com',
    visaType: 'Tourist Visa',
    priority: 'Medium',
    assignedTo: 'Nina K.',
    submittedOn: '2026-04-04',
    status: 'Completed'
  }
];

const dummyCredentials: Record<DashboardRole, { email: string; password: string; route: string }> = {
  admin: {
    email: 'admin@ausvisaservice.com',
    password: 'Admin@123',
    route: '/dashboard'
  },
  manager: {
    email: 'manager@ausvisaservice.com',
    password: 'Manager@123',
    route: '/dashboard/visa-applications'
  },
  user: {
    email: 'user@ausvisaservice.com',
    password: 'User@123',
    route: '/user-dashboard'
  }
};

const normalizePathname = (pathname: string): string => pathname.toLowerCase().replace(/\/+$/, '') || '/';

const getDashboardSectionFromPath = (pathname: string): DashboardSection => {
  const normalized = normalizePathname(pathname);
  const pieces = normalized.split('/').filter(Boolean);
  const section = pieces[1];

  switch (section) {
    case 'pages':
      return 'pages';
    case 'users':
      return 'users';
    case 'visa-applications':
      return 'visa-applications';
    case 'documents':
      return 'documents';
    case 'payments':
      return 'payments';
    case 'settings':
      return 'settings';
    default:
      return 'overview';
  }
};

const getUserSectionFromPath = (pathname: string): UserSection => {
  const normalized = normalizePathname(pathname);
  const pieces = normalized.split('/').filter(Boolean);
  const section = pieces[1];

  switch (section) {
    case 'applications':
      return 'applications';
    case 'documents':
      return 'documents';
    case 'payments':
      return 'payments';
    case 'messages':
      return 'messages';
    case 'profile':
      return 'profile';
    default:
      return 'overview';
  }
};

const toClassToken = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const readAuthSession = (): AuthSession | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed || (parsed.role !== 'admin' && parsed.role !== 'manager' && parsed.role !== 'user')) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeAuthSession = (session: AuthSession): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
};

const clearAuthSession = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(AUTH_SESSION_KEY);
};

export function DashboardExperience({ pathname }: DashboardExperienceProps) {
  const normalizedPath = normalizePathname(pathname);
  const isLoginRoute = normalizedPath === '/dashboard/login' || normalizedPath === '/login';
  const isSignupRoute = normalizedPath === '/dashboard/signup' || normalizedPath === '/signup';
  const isAdminDashboardRoute = normalizedPath.startsWith('/dashboard');
  const isUserDashboardRoute = normalizedPath.startsWith('/user-dashboard');
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setSession(readAuthSession());
    setAuthReady(true);
  }, []);

  if (isLoginRoute) {
    return <DashboardLoginPage />;
  }

  if (isSignupRoute) {
    return <DashboardSignupPage />;
  }

  if (!isAdminDashboardRoute && !isUserDashboardRoute) {
    return null;
  }

  if (!authReady) {
    return null;
  }

  if (!session) {
    if (typeof window !== 'undefined') {
      const next = encodeURIComponent(normalizedPath);
      window.location.replace(`/dashboard/login?next=${next}`);
    }
    return null;
  }

  if (session.role === 'user' && isAdminDashboardRoute) {
    if (typeof window !== 'undefined') {
      window.location.replace('/user-dashboard');
    }
    return null;
  }

  if ((session.role === 'admin' || session.role === 'manager') && isUserDashboardRoute) {
    if (typeof window !== 'undefined') {
      window.location.replace('/dashboard');
    }
    return null;
  }

  if (isUserDashboardRoute) {
    return <UserDashboardWorkspace pathname={normalizedPath} session={session} />;
  }

  return <DashboardWorkspace pathname={normalizedPath} role={session.role} session={session} />;
}

function DashboardWorkspace({ pathname, role, session }: { pathname: string; role: DashboardRole; session: AuthSession }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sectionFromPath = getDashboardSectionFromPath(pathname);
  const canAccessSection = roleScope[role].includes(sectionFromPath);
  const activeSection = canAccessSection ? sectionFromPath : 'overview';

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const pageTitleMap: Record<DashboardSection, string> = {
    overview: 'Executive Overview',
    pages: 'Page Management',
    users: 'User Intelligence',
    'visa-applications': 'Visa Applications',
    documents: 'Document Center',
    payments: 'Payments and Billing',
    settings: 'Application Settings'
  };

  return (
    <div className="dashboard-shell">
      <button
        type="button"
        className={`dashboard-backdrop ${sidebarOpen ? 'is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close sidebar"
      />

      <aside className={`dashboard-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <a href="/dashboard" className="dashboard-brand" aria-label="Dashboard Home">
          <span className="dashboard-brand__logo">AV</span>
          <span className="dashboard-brand__text">
            <strong>AUS Visa Service</strong>
            <small>Premium Admin Suite</small>
          </span>
        </a>

        <nav className="dashboard-menu" aria-label="Dashboard navigation">
          {sidebarItems.map((item) => {
            const allowed = roleScope[role].includes(item.section);
            const active = activeSection === item.section;
            const linkClass = ['dashboard-menu__item', active ? 'is-active' : '', allowed ? '' : 'is-locked'].join(' ').trim();
            return (
              <a key={item.section} href={allowed ? item.href : '#'} className={linkClass} aria-current={active ? 'page' : undefined}>
                <span>{item.label}</span>
                {item.badge ? <small>{item.badge}</small> : null}
              </a>
            );
          })}
        </nav>

        <div className="dashboard-sidebar__foot">
          <p>Security posture: 99.98% uptime this quarter</p>
          <a href="/dashboard/settings">Manage permissions and API keys</a>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <button type="button" className="dashboard-menu-toggle" onClick={() => setSidebarOpen((prev) => !prev)}>
              Menu
            </button>
            <div>
              <p className="dashboard-topbar__eyebrow">Admin Platform</p>
              <h1>{pageTitleMap[activeSection]}</h1>
            </div>
          </div>
          <div className="dashboard-topbar__right">
            <div className="dashboard-role-picker">
              Logged in as
              <strong>{role.toUpperCase()}</strong>
              <small>{session.email}</small>
            </div>
            <a href="/dashboard/login" className="dashboard-ghost-button">
              Switch account
            </a>
            <button
              type="button"
              className="dashboard-ghost-button"
              onClick={() => {
                clearAuthSession();
                if (typeof window !== 'undefined') {
                  window.location.href = '/dashboard/login';
                }
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          {activeSection === 'overview' ? <OverviewPanel role={role} /> : null}
          {activeSection === 'pages' ? <PagesPanel /> : null}
          {activeSection === 'users' ? <UsersPanel /> : null}
          {activeSection === 'visa-applications' ? <VisaApplicationsPanel /> : null}
          {activeSection === 'documents' ? <DocumentsPanel role={role} /> : null}
          {activeSection === 'payments' ? <PaymentsPanel role={role} /> : null}
          {activeSection === 'settings' ? <SettingsPanel /> : null}
        </main>
      </div>
    </div>
  );
}

function OverviewPanel({ role }: { role: DashboardRole }) {
  const cards = useMemo(
    () => [
      { label: 'Total Users', value: '24,381', trend: '+9.4%' },
      { label: 'Active Visa Cases', value: '1,248', trend: '+6.1%' },
      { label: 'Conversion Rate', value: '31.2%', trend: '+2.3%' },
      { label: 'Revenue (30d)', value: '$184,200', trend: '+14.8%' }
    ],
    []
  );

  return (
    <section className="dashboard-stack">
      <div className="dashboard-kpi-grid">
        {cards.map((card) => (
          <article key={card.label} className="dashboard-kpi-card">
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.trend} vs previous month</span>
          </article>
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--2">
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2>Application Pipeline</h2>
            <small>Live status split</small>
          </div>
          <ul className="dashboard-meter-list">
            {[
              ['Submitted', 38],
              ['In Review', 29],
              ['Documents Needed', 12],
              ['Approved', 15],
              ['Completed', 6]
            ].map(([label, value]) => (
              <li key={label}>
                <div>
                  <span>{label}</span>
                  <strong>{value}%</strong>
                </div>
                <div className="dashboard-meter">
                  <div style={{ width: `${value}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2>Ops Priority Queue</h2>
            <small>Requires action in 24h</small>
          </div>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Owner</th>
                <th>Priority</th>
                <th>SLA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>DOC-991</td>
                <td>Nadia R.</td>
                <td>
                  <span className="dashboard-chip dashboard-chip--high">High</span>
                </td>
                <td>3h</td>
              </tr>
              <tr>
                <td>PAY-152</td>
                <td>Finance Ops</td>
                <td>
                  <span className="dashboard-chip dashboard-chip--medium">Medium</span>
                </td>
                <td>7h</td>
              </tr>
              <tr>
                <td>CASE-442</td>
                <td>Intake Team</td>
                <td>
                  <span className="dashboard-chip dashboard-chip--low">Low</span>
                </td>
                <td>18h</td>
              </tr>
            </tbody>
          </table>
        </article>
      </div>

      <div className="dashboard-grid dashboard-grid--2">
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2>Recent Activity</h2>
          </div>
          <ol className="dashboard-timeline">
            <li>
              <strong>Application AUS-24022 moved to Approved</strong>
              <span>14 minutes ago by Jordan M.</span>
            </li>
            <li>
              <strong>Pricing page updated with Q2 package structure</strong>
              <span>2 hours ago by Admin Team</span>
            </li>
            <li>
              <strong>15 abandoned checkouts captured into remarketing list</strong>
              <span>Today at 09:20</span>
            </li>
          </ol>
        </article>

        <article className="dashboard-panel dashboard-panel--accent">
          <div className="dashboard-panel__header">
            <h2>Role Snapshot</h2>
            <small>{role.toUpperCase()} view</small>
          </div>
          <p>
            This role can access <strong>{roleScope[role].length}</strong> modules. Use this dashboard mode for quick permission and layout
            validation before production auth integration.
          </p>
          <a href="/dashboard/settings" className="dashboard-primary-link">
            Open access settings
          </a>
        </article>
      </div>
    </section>
  );
}

function PagesPanel() {
  const [pages, setPages] = useState<CmsPage[]>(initialPages);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PageStatus>('All');
  const [localeFilter, setLocaleFilter] = useState<'All' | string>('All');

  const filteredPages = useMemo(
    () =>
      pages.filter((page) => {
        const searchLower = searchQuery.trim().toLowerCase();
        const matchesSearch =
          searchLower.length === 0 ||
          page.title.toLowerCase().includes(searchLower) ||
          page.slug.toLowerCase().includes(searchLower) ||
          page.updatedBy.toLowerCase().includes(searchLower);
        const matchesStatus = statusFilter === 'All' || page.status === statusFilter;
        const matchesLocale = localeFilter === 'All' || page.locale === localeFilter;
        return matchesSearch && matchesStatus && matchesLocale;
      }),
    [localeFilter, pages, searchQuery, statusFilter]
  );

  const addPage = () => {
    const title = window.prompt('Page title');
    if (!title) {
      return;
    }
    const slug = `/${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const nextPage: CmsPage = {
      id: `page-${Date.now()}`,
      title: title.trim(),
      slug,
      status: 'Draft',
      updatedBy: 'Admin Team',
      updatedAt: '2026-04-12',
      locale: 'EN',
      views: 0
    };
    setPages((previous) => [nextPage, ...previous]);
  };

  const editPage = (id: string) => {
    setPages((previous) =>
      previous.map((page) => {
        if (page.id !== id) {
          return page;
        }
        const nextTitle = window.prompt('Update page title', page.title)?.trim();
        if (!nextTitle) {
          return page;
        }
        return {
          ...page,
          title: nextTitle,
          slug: `/${nextTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          updatedAt: '2026-04-12',
          status: page.status === 'Draft' ? 'Published' : page.status
        };
      })
    );
  };

  const removePage = (id: string) => {
    const shouldDelete = window.confirm('Delete this page? This is a demo action.');
    if (!shouldDelete) {
      return;
    }
    setPages((previous) => previous.filter((page) => page.id !== id));
  };

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header dashboard-panel__header--spread">
          <h2>CMS Pages</h2>
          <button type="button" className="dashboard-primary-button" onClick={addPage}>
            Add New Page
          </button>
        </div>
        <div className="dashboard-filter-grid">
          <label>
            Search
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Find by title, slug, editor" />
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | PageStatus)}>
              <option value="All">All</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </label>
          <label>
            Locale
            <select value={localeFilter} onChange={(event) => setLocaleFilter(event.target.value)}>
              <option value="All">All</option>
              <option value="EN">EN</option>
              <option value="AR">AR</option>
              <option value="UR">UR</option>
            </select>
          </label>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Updated By</th>
                <th>Updated At</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page) => (
                <tr key={page.id}>
                  <td>{page.title}</td>
                  <td>{page.slug}</td>
                  <td>
                    <span className={`dashboard-chip dashboard-chip--${toClassToken(page.status)}`}>{page.status}</span>
                  </td>
                  <td>{page.updatedBy}</td>
                  <td>{page.updatedAt}</td>
                  <td>{page.views.toLocaleString()}</td>
                  <td>
                    <div className="dashboard-actions-inline">
                      <button type="button" onClick={() => editPage(page.id)}>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => removePage(page.id)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function UsersPanel() {
  const [query, setQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'All' | UserSegment>('All');
  const [purchaseFilter, setPurchaseFilter] = useState<'All' | 'Purchased' | 'Abandoned'>('All');

  const users = useMemo(
    () =>
      initialUsers.filter((user) => {
        const queryLower = query.trim().toLowerCase();
        const matchesQuery =
          queryLower.length === 0 ||
          user.fullName.toLowerCase().includes(queryLower) ||
          user.email.toLowerCase().includes(queryLower) ||
          user.country.toLowerCase().includes(queryLower);
        const matchesSegment = segmentFilter === 'All' || user.segment === segmentFilter;
        const matchesPurchase =
          purchaseFilter === 'All' ||
          (purchaseFilter === 'Purchased' && user.purchased) ||
          (purchaseFilter === 'Abandoned' && !user.purchased);
        return matchesQuery && matchesSegment && matchesPurchase;
      }),
    [purchaseFilter, query, segmentFilter]
  );

  const registeredCount = initialUsers.filter((user) => user.segment === 'Registered').length;
  const abandonedCount = initialUsers.filter((user) => !user.purchased).length;

  return (
    <section className="dashboard-stack">
      <div className="dashboard-kpi-grid dashboard-kpi-grid--short">
        <article className="dashboard-kpi-card">
          <p>Registered Users</p>
          <strong>{registeredCount}</strong>
          <span>Active accounts</span>
        </article>
        <article className="dashboard-kpi-card">
          <p>No Purchase Leads</p>
          <strong>{abandonedCount}</strong>
          <span>Retargeting opportunity</span>
        </article>
      </div>

      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>User and Lead Explorer</h2>
        </div>
        <div className="dashboard-filter-grid">
          <label>
            Search
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email or country" />
          </label>
          <label>
            Segment
            <select value={segmentFilter} onChange={(event) => setSegmentFilter(event.target.value as 'All' | UserSegment)}>
              <option value="All">All</option>
              <option value="Registered">Registered</option>
              <option value="Lead">Lead</option>
            </select>
          </label>
          <label>
            Purchase
            <select value={purchaseFilter} onChange={(event) => setPurchaseFilter(event.target.value as 'All' | 'Purchased' | 'Abandoned')}>
              <option value="All">All</option>
              <option value="Purchased">Purchased</option>
              <option value="Abandoned">Abandoned</option>
            </select>
          </label>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Segment</th>
                <th>Purchase</th>
                <th>Source</th>
                <th>Country</th>
                <th>Spent</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.fullName}</strong>
                    <small>{user.email}</small>
                  </td>
                  <td>
                    <span className={`dashboard-chip dashboard-chip--${toClassToken(user.segment)}`}>{user.segment}</span>
                  </td>
                  <td>
                    <span className={`dashboard-chip dashboard-chip--${user.purchased ? 'purchased' : 'abandoned'}`}>
                      {user.purchased ? 'Purchased' : 'Abandoned'}
                    </span>
                  </td>
                  <td>{user.source}</td>
                  <td>{user.country}</td>
                  <td>${user.spentUsd}</td>
                  <td>{user.lastSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function VisaApplicationsPanel() {
  const [statusFilter, setStatusFilter] = useState<'All' | ApplicationStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      initialApplications.filter((application) => {
        const searchValue = search.trim().toLowerCase();
        const matchesSearch =
          searchValue.length === 0 ||
          application.id.toLowerCase().includes(searchValue) ||
          application.applicant.toLowerCase().includes(searchValue) ||
          application.email.toLowerCase().includes(searchValue);
        const matchesStatus = statusFilter === 'All' || application.status === statusFilter;
        const matchesPriority = priorityFilter === 'All' || application.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      }),
    [priorityFilter, search, statusFilter]
  );

  const countByStatus = initialApplications.reduce<Record<ApplicationStatus, number>>(
    (acc, application) => {
      acc[application.status] += 1;
      return acc;
    },
    {
      Submitted: 0,
      'In Review': 0,
      'Documents Needed': 0,
      Approved: 0,
      Completed: 0,
      Rejected: 0
    }
  );

  return (
    <section className="dashboard-stack">
      <div className="dashboard-kpi-grid">
        {(Object.keys(countByStatus) as ApplicationStatus[]).map((status) => (
          <article key={status} className="dashboard-kpi-card">
            <p>{status}</p>
            <strong>{countByStatus[status]}</strong>
            <span>Applications</span>
          </article>
        ))}
      </div>

      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Application Status Board</h2>
        </div>
        <div className="dashboard-filter-grid">
          <label>
            Search
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Case ID, applicant or email" />
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | ApplicationStatus)}>
              <option value="All">All</option>
              <option value="Submitted">Submitted</option>
              <option value="In Review">In Review</option>
              <option value="Documents Needed">Documents Needed</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </label>
          <label>
            Priority
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as 'All' | 'Low' | 'Medium' | 'High')}>
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Applicant</th>
                <th>Visa Type</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((application) => (
                <tr key={application.id}>
                  <td>{application.id}</td>
                  <td>
                    <strong>{application.applicant}</strong>
                    <small>{application.email}</small>
                  </td>
                  <td>{application.visaType}</td>
                  <td>
                    <span className={`dashboard-chip dashboard-chip--${toClassToken(application.status)}`}>{application.status}</span>
                  </td>
                  <td>
                    <span className={`dashboard-chip dashboard-chip--${toClassToken(application.priority)}`}>{application.priority}</span>
                  </td>
                  <td>{application.assignedTo}</td>
                  <td>{application.submittedOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function DocumentsPanel({ role }: { role: DashboardRole }) {
  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Document Verification Hub</h2>
        </div>
        <p>
          Automate passport, photo, and supporting document checks. Current role <strong>{role.toUpperCase()}</strong> can approve and
          request re-upload for files in queue.
        </p>
        <ul className="dashboard-simple-list">
          <li>Queued documents: 217</li>
          <li>Auto-approved today: 143</li>
          <li>Manual review required: 26</li>
        </ul>
      </article>
    </section>
  );
}

function PaymentsPanel({ role }: { role: DashboardRole }) {
  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Payments and Payouts</h2>
        </div>
        <p>
          Track checkout conversions, refunds, and settlement windows. Role <strong>{role.toUpperCase()}</strong> currently has invoice
          visibility and transaction audit controls.
        </p>
        <ul className="dashboard-simple-list">
          <li>Today revenue: $8,420</li>
          <li>Pending settlements: $11,290</li>
          <li>Refund requests: 4</li>
        </ul>
      </article>
    </section>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    requireMfaForAdmins: true,
    autoAssignCases: true,
    abandonedEmailAutomation: true,
    paymentAutoRetry: true,
    supportSlaHours: '8',
    defaultApplicationSla: '48',
    primaryBrand: '#0f172a'
  });

  const updateSetting = (key: keyof typeof settings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Platform Configuration</h2>
        </div>
        <div className="dashboard-settings-grid">
          <label>
            Support SLA (Hours)
            <input value={settings.supportSlaHours} onChange={(event) => updateSetting('supportSlaHours', event.target.value)} />
          </label>
          <label>
            Application SLA (Hours)
            <input value={settings.defaultApplicationSla} onChange={(event) => updateSetting('defaultApplicationSla', event.target.value)} />
          </label>
          <label>
            Primary Brand Color
            <input value={settings.primaryBrand} onChange={(event) => updateSetting('primaryBrand', event.target.value)} />
          </label>
        </div>
      </article>

      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Operational Toggles</h2>
        </div>
        <div className="dashboard-toggle-list">
          <label>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(event) => updateSetting('maintenanceMode', event.target.checked)}
            />
            Maintenance Mode
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.requireMfaForAdmins}
              onChange={(event) => updateSetting('requireMfaForAdmins', event.target.checked)}
            />
            Require MFA for Admins
          </label>
          <label>
            <input type="checkbox" checked={settings.autoAssignCases} onChange={(event) => updateSetting('autoAssignCases', event.target.checked)} />
            Auto Assign New Cases
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.abandonedEmailAutomation}
              onChange={(event) => updateSetting('abandonedEmailAutomation', event.target.checked)}
            />
            Abandoned Lead Email Automation
          </label>
          <label>
            <input type="checkbox" checked={settings.paymentAutoRetry} onChange={(event) => updateSetting('paymentAutoRetry', event.target.checked)} />
            Payment Auto Retry
          </label>
        </div>
        <div className="dashboard-settings-actions">
          <button type="button" className="dashboard-primary-button">
            Save Settings
          </button>
          <button type="button" className="dashboard-ghost-button">
            Reset to Default
          </button>
        </div>
      </article>
    </section>
  );
}

function UserDashboardWorkspace({ pathname, session }: { pathname: string; session: AuthSession }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeSection = getUserSectionFromPath(pathname);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const pageTitleMap: Record<UserSection, string> = {
    overview: 'My Travel Dashboard',
    applications: 'My Visa Applications',
    documents: 'My Documents',
    payments: 'Payments and Receipts',
    messages: 'Support Messages',
    profile: 'My Profile'
  };

  return (
    <div className="dashboard-shell">
      <button
        type="button"
        className={`dashboard-backdrop ${sidebarOpen ? 'is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close sidebar"
      />

      <aside className={`dashboard-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <a href="/user-dashboard" className="dashboard-brand" aria-label="User Dashboard Home">
          <span className="dashboard-brand__logo">ME</span>
          <span className="dashboard-brand__text">
            <strong>My Visa Portal</strong>
            <small>Applicant Workspace</small>
          </span>
        </a>

        <nav className="dashboard-menu" aria-label="User dashboard navigation">
          {userSidebarItems.map((item) => {
            const active = activeSection === item.section;
            return (
              <a key={item.section} href={item.href} className={`dashboard-menu__item ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                <span>{item.label}</span>
                {item.badge ? <small>{item.badge}</small> : null}
              </a>
            );
          })}
        </nav>

        <div className="dashboard-sidebar__foot">
          <p>Need urgent help? Chat with support in Messages.</p>
          <a href="/user-dashboard/messages">Open support center</a>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <button type="button" className="dashboard-menu-toggle" onClick={() => setSidebarOpen((prev) => !prev)}>
              Menu
            </button>
            <div>
              <p className="dashboard-topbar__eyebrow">Applicant Portal</p>
              <h1>{pageTitleMap[activeSection]}</h1>
            </div>
          </div>
          <div className="dashboard-topbar__right">
            <div className="dashboard-role-picker">
              Logged in as
              <strong>USER</strong>
              <small>{session.email}</small>
            </div>
            <button
              type="button"
              className="dashboard-ghost-button"
              onClick={() => {
                clearAuthSession();
                if (typeof window !== 'undefined') {
                  window.location.href = '/dashboard/login';
                }
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          {activeSection === 'overview' ? <UserOverviewPanel /> : null}
          {activeSection === 'applications' ? <UserApplicationsPanel /> : null}
          {activeSection === 'documents' ? <UserDocumentsPanel /> : null}
          {activeSection === 'payments' ? <UserPaymentsPanel /> : null}
          {activeSection === 'messages' ? <UserMessagesPanel /> : null}
          {activeSection === 'profile' ? <UserProfilePanel userEmail={session.email} /> : null}
        </main>
      </div>
    </div>
  );
}

function UserOverviewPanel() {
  return (
    <section className="dashboard-stack">
      <div className="dashboard-kpi-grid dashboard-kpi-grid--short">
        <article className="dashboard-kpi-card">
          <p>Applications In Progress</p>
          <strong>2</strong>
          <span>1 waiting for documents</span>
        </article>
        <article className="dashboard-kpi-card">
          <p>Completed Applications</p>
          <strong>1</strong>
          <span>Ready for travel</span>
        </article>
      </div>

      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Next Actions</h2>
        </div>
        <ul className="dashboard-simple-list">
          <li>Upload updated bank statement for case AUS-24020</li>
          <li>Review payment invoice for premium processing add-on</li>
          <li>Check support reply regarding travel insurance requirement</li>
        </ul>
      </article>
    </section>
  );
}

function UserApplicationsPanel() {
  const myApplications = [
    { id: 'AUS-24020', visaType: 'Business Visa', status: 'Documents Needed', submittedOn: '2026-04-10', eta: '3-5 days' },
    { id: 'AUS-24022', visaType: 'Student Visa', status: 'Approved', submittedOn: '2026-04-06', eta: 'Completed' },
    { id: 'AUS-24023', visaType: 'Tourist Visa', status: 'Completed', submittedOn: '2026-04-04', eta: 'Completed' }
  ];

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Application Tracker</h2>
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Visa Type</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Estimated Timeline</th>
              </tr>
            </thead>
            <tbody>
              {myApplications.map((application) => (
                <tr key={application.id}>
                  <td>{application.id}</td>
                  <td>{application.visaType}</td>
                  <td>
                    <span className={`dashboard-chip dashboard-chip--${toClassToken(application.status)}`}>{application.status}</span>
                  </td>
                  <td>{application.submittedOn}</td>
                  <td>{application.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function UserDocumentsPanel() {
  const docs = [
    { name: 'Passport Bio Page', status: 'Verified', note: 'Approved by reviewer' },
    { name: 'Passport Photo', status: 'Verified', note: 'Meets size requirements' },
    { name: 'Bank Statement', status: 'Action Required', note: 'Upload latest statement (last 3 months)' },
    { name: 'Travel Itinerary', status: 'Pending Review', note: 'Under manual check' }
  ];

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Document Checklist</h2>
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.name}>
                  <td>{doc.name}</td>
                  <td>
                    <span className={`dashboard-chip dashboard-chip--${toClassToken(doc.status)}`}>{doc.status}</span>
                  </td>
                  <td>{doc.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function UserPaymentsPanel() {
  const payments = [
    { invoice: 'INV-1201', package: 'Business Visa Filing', amount: '$149', status: 'Paid', date: '2026-04-10' },
    { invoice: 'INV-1204', package: 'Priority Review Add-on', amount: '$49', status: 'Pending', date: '2026-04-12' }
  ];

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Payments and Receipts</h2>
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Package</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.invoice}>
                  <td>{payment.invoice}</td>
                  <td>{payment.package}</td>
                  <td>{payment.amount}</td>
                  <td>
                    <span className={`dashboard-chip dashboard-chip--${toClassToken(payment.status)}`}>{payment.status}</span>
                  </td>
                  <td>{payment.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function UserMessagesPanel() {
  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Support Inbox</h2>
        </div>
        <ol className="dashboard-timeline">
          <li>
            <strong>Support: Please upload latest financial proof</strong>
            <span>Today at 11:15</span>
          </li>
          <li>
            <strong>You: Uploaded revised itinerary and accommodation voucher</strong>
            <span>Yesterday at 19:42</span>
          </li>
          <li>
            <strong>Support: Application moved to In Review</strong>
            <span>Yesterday at 10:03</span>
          </li>
        </ol>
      </article>
    </section>
  );
}

function UserProfilePanel({ userEmail }: { userEmail: string }) {
  const [fullName, setFullName] = useState('John Doe');
  const [phone, setPhone] = useState('+92 300 0000000');
  const [country, setCountry] = useState('Pakistan');

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Profile and Preferences</h2>
        </div>
        <div className="dashboard-settings-grid">
          <label>
            Full Name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
          <label>
            Email
            <input value={userEmail} disabled />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label>
            Country
            <input value={country} onChange={(event) => setCountry(event.target.value)} />
          </label>
        </div>
        <div className="dashboard-settings-actions">
          <button type="button" className="dashboard-primary-button">
            Save Profile
          </button>
        </div>
      </article>
    </section>
  );
}

function DashboardLoginPage() {
  const [role, setRole] = useState<DashboardRole>('admin');
  const [email, setEmail] = useState(dummyCredentials.admin.email);
  const [password, setPassword] = useState(dummyCredentials.admin.password);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const existing = readAuthSession();
    if (!existing || typeof window === 'undefined') {
      return;
    }
    window.location.replace(existing.role === 'user' ? '/user-dashboard' : '/dashboard');
  }, []);

  useEffect(() => {
    setEmail(dummyCredentials[role].email);
    setPassword(dummyCredentials[role].password);
  }, [role]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const expected = dummyCredentials[role];
    const isValid = email.trim().toLowerCase() === expected.email.toLowerCase() && password === expected.password;

    if (!isValid) {
      setMessageType('error');
      setMessage('Invalid demo credentials selected for this role. Please use the pre-filled credentials.');
      return;
    }

    writeAuthSession({
      role,
      email: expected.email,
      loginAt: new Date().toISOString()
    });

    if (typeof window !== 'undefined') {
      const next = new URLSearchParams(window.location.search).get('next');
      if (next) {
        window.location.href = next;
        return;
      }
      window.location.href = expected.route;
      return;
    }

    setMessageType('success');
    setMessage(`Login successful for ${role.toUpperCase()}.`);
  };

  return (
    <section className="dashboard-auth">
      <div className="dashboard-auth__shell">
        <article className="dashboard-auth__showcase">
          <p className="dashboard-auth__eyebrow">AUS Visa Service</p>
          <h1>Luxury control room for global visa operations</h1>
          <p>
            Secure admin workspace for applications, users, pages, billing, and workflow automation. Designed for premium service
            operations.
          </p>
          <ul>
            <li>Role-based admin, manager, and user experiences</li>
            <li>Visa case tracking with live status workflows</li>
            <li>Lead recovery and payment oversight modules</li>
          </ul>
        </article>

        <article className="dashboard-auth__form-panel">
          <h2>Sign in to dashboard</h2>
          <p>Dummy logins are pre-filled. Switch role cards below.</p>
          <div className="dashboard-auth__roles">
            {roleOptions.map((option) => (
              <button
                key={option.role}
                type="button"
                className={role === option.role ? 'is-active' : ''}
                onClick={() => setRole(option.role)}
                title={option.helper}
              >
                <strong>{option.label}</strong>
                <span>{dummyCredentials[option.role].email}</span>
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button type="submit" className="dashboard-primary-button dashboard-primary-button--wide">
              Sign In
            </button>
          </form>
          {message ? <p className={`dashboard-auth__message ${messageType === 'error' ? 'is-error' : ''}`}>{message}</p> : null}
          <div className="dashboard-auth__links">
            <a href={dummyCredentials[role].route}>Enter {roleOptions.find((item) => item.role === role)?.label} Dashboard</a>
            <a href="/dashboard/signup">Need an account? Sign up</a>
          </div>
        </article>
      </div>
    </section>
  );
}

function DashboardSignupPage() {
  const [organization, setOrganization] = useState('AUS Visa Service Team');
  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [plan, setPlan] = useState('Premium Ops');
  const [acknowledged, setAcknowledged] = useState(false);
  const [notice, setNotice] = useState('');

  const submitSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('Demo signup complete. Proceed to login with dummy credentials.');
  };

  return (
    <section className="dashboard-auth">
      <div className="dashboard-auth__shell">
        <article className="dashboard-auth__showcase">
          <p className="dashboard-auth__eyebrow">Premium Access</p>
          <h1>Create your admin workspace</h1>
          <p>Onboard managers, invite case reviewers, and configure secure operations in minutes.</p>
          <ul>
            <li>Granular role permissions and team seats</li>
            <li>Multi-stage visa workflow management</li>
            <li>Settings for compliance, SEO, and automations</li>
          </ul>
        </article>

        <article className="dashboard-auth__form-panel">
          <h2>Create account</h2>
          <form onSubmit={submitSignup}>
            <label>
              Organization
              <input value={organization} onChange={(event) => setOrganization(event.target.value)} />
            </label>
            <label>
              Full Name
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </label>
            <label>
              Work Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Plan
              <select value={plan} onChange={(event) => setPlan(event.target.value)}>
                <option value="Premium Ops">Premium Ops</option>
                <option value="Enterprise Control">Enterprise Control</option>
                <option value="Starter Team">Starter Team</option>
              </select>
            </label>
            <label className="dashboard-auth__checkbox">
              <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
              I agree with admin security and compliance policy
            </label>
            <button type="submit" className="dashboard-primary-button dashboard-primary-button--wide" disabled={!acknowledged}>
              Create Workspace
            </button>
          </form>
          {notice ? <p className="dashboard-auth__message">{notice}</p> : null}
          <div className="dashboard-auth__links">
            <a href="/dashboard/login">Already registered? Login</a>
          </div>
        </article>
      </div>
    </section>
  );
}
