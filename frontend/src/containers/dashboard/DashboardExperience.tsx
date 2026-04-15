import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ContactEntry } from '../../types/contact';
import { getContactEntries } from '../../utils/contactEntries';
import { BlogEditorPanel } from '../../components/dashboard/blogs/BlogEditorPanel';
import { BlogReviewPanel } from '../../components/dashboard/blogs/BlogReviewPanel';
import { BlogsPanel } from '../../components/dashboard/blogs/BlogsPanel';
import { BlogPerformanceWidgets } from '../../components/dashboard/blogs/BlogPerformanceWidgets';
import { useBlogAdminTable } from '../../hooks/useBlogAdminTable';
import { getBlogPerformanceSnapshot } from '../../services/blogAnalyticsService';
import { applyThemeSettings, defaultThemeSettings, loadThemeSettings, saveThemeSettings, ThemeSettings } from '../../utils/themeSettings';
import { getThemeContrastWarnings, sanitizeThemeColorValue } from '../../utils/themeColors';

type DashboardExperienceProps = {
  pathname: string;
};

type DashboardRole = 'admin' | 'manager' | 'user';
type AuthSession = {
  role: DashboardRole;
  email: string;
  loginAt: string;
};
type DashboardSection = 'overview' | 'pages' | 'blogs' | 'users' | 'visa-applications' | 'documents' | 'payments' | 'contact-entries' | 'settings';
type ManagerSection = 'overview' | 'team' | 'applications' | 'blogs' | 'documents' | 'payments' | 'contact-entries' | 'settings';
type UserSection = 'overview' | 'applications' | 'documents' | 'payments' | 'messages' | 'profile';
type BlogAction = 'create' | 'edit' | 'submit-review' | 'approve-review' | 'publish' | 'archive' | 'delete' | 'settings' | 'override';
type BlogWorkflowStatus = 'Draft' | 'In Review' | 'Scheduled' | 'Published' | 'Archived';
type BlogRevision = {
  id: string;
  version: string;
  editor: string;
  timestamp: string;
  fromStatus: BlogWorkflowStatus;
  toStatus: BlogWorkflowStatus;
};
type BlogComment = {
  id: string;
  author: string;
  role: 'Manager' | 'Admin' | 'Editor';
  createdAt: string;
  note: string;
};
type BlogAuditEvent = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
};
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
const DASHBOARD_ACCESS_NOTICE_KEY = 'aus-visa-dashboard-access-notice';
const DASHBOARD_SETTINGS_STORAGE_KEY = 'aus-visa-dashboard-settings';

const roleScope: Record<DashboardRole, DashboardSection[]> = {
  admin: ['overview', 'pages', 'blogs', 'users', 'visa-applications', 'documents', 'payments', 'contact-entries', 'settings'],
  manager: ['overview', 'pages', 'blogs', 'users', 'visa-applications', 'documents', 'payments', 'contact-entries', 'settings'],
  user: ['overview', 'visa-applications', 'documents', 'settings']
};

const roleBlogActions: Record<DashboardRole, BlogAction[]> = {
  admin: ['create', 'edit', 'submit-review', 'publish', 'archive', 'delete', 'settings', 'override'],
  manager: ['create', 'edit', 'submit-review', 'approve-review'],
  user: []
};

const sidebarItems: Array<{ section: DashboardSection; label: string; href: string; badge?: string }> = [
  { section: 'overview', label: 'Dashboard', href: '/dashboard' },
  { section: 'pages', label: 'Pages', href: '/dashboard/pages', badge: 'CMS' },
  { section: 'blogs', label: 'Blogs', href: '/dashboard/blogs', badge: 'SEO' },
  { section: 'users', label: 'Users', href: '/dashboard/users', badge: 'CRM' },
  { section: 'visa-applications', label: 'Visa Applications', href: '/dashboard/visa-applications', badge: 'Core' },
  { section: 'documents', label: 'Documents', href: '/dashboard/documents' },
  { section: 'payments', label: 'Payments', href: '/dashboard/payments' },
  { section: 'contact-entries', label: 'Contact Entries', href: '/dashboard/contact-entries', badge: 'Inbox' },
  { section: 'settings', label: 'Settings', href: '/dashboard/settings' }
];

const managerSidebarItems: Array<{ section: ManagerSection; label: string; href: string; badge?: string }> = [
  { section: 'overview', label: 'Overview', href: '/dashboard' },
  { section: 'team', label: 'Team Queue', href: '/dashboard/team', badge: 'Ops' },
  { section: 'applications', label: 'Applications', href: '/dashboard/applications', badge: 'Core' },
  { section: 'blogs', label: 'Blogs', href: '/dashboard/blogs', badge: 'SEO' },
  { section: 'documents', label: 'Documents', href: '/dashboard/documents' },
  { section: 'payments', label: 'Payments', href: '/dashboard/payments' },
  { section: 'contact-entries', label: 'Contact Entries', href: '/dashboard/contact-entries', badge: 'Inbox' },
  { section: 'settings', label: 'Settings', href: '/dashboard/settings' }
];

const userSidebarItems: Array<{ section: UserSection; label: string; href: string; badge?: string }> = [
  { section: 'overview', label: 'Overview', href: '/dashboard' },
  { section: 'applications', label: 'My Applications', href: '/dashboard/applications', badge: 'Core' },
  { section: 'documents', label: 'My Documents', href: '/dashboard/documents' },
  { section: 'payments', label: 'Payments', href: '/dashboard/payments' },
  { section: 'messages', label: 'Support', href: '/dashboard/messages' },
  { section: 'profile', label: 'Profile', href: '/dashboard/profile' }
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
    route: '/dashboard'
  },
  user: {
    email: 'user@ausvisaservice.com',
    password: 'User@123',
    route: '/dashboard'
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
    case 'blogs':
      return 'blogs';
    case 'users':
      return 'users';
    case 'visa-applications':
      return 'visa-applications';
    case 'documents':
      return 'documents';
    case 'payments':
      return 'payments';
    case 'contact-entries':
      return 'contact-entries';
    case 'settings':
      return 'settings';
    default:
      return 'overview';
  }
};

const getManagerSectionFromPath = (pathname: string): ManagerSection => {
  const normalized = normalizePathname(pathname);
  const pieces = normalized.split('/').filter(Boolean);
  const section = pieces[1];

  switch (section) {
    case 'team':
      return 'team';
    case 'applications':
      return 'applications';
    case 'blogs':
      return 'blogs';
    case 'documents':
      return 'documents';
    case 'payments':
      return 'payments';
    case 'contact-entries':
      return 'contact-entries';
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

const readDashboardAccessNotice = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const notice = window.sessionStorage.getItem(DASHBOARD_ACCESS_NOTICE_KEY) ?? '';
  if (notice) {
    window.sessionStorage.removeItem(DASHBOARD_ACCESS_NOTICE_KEY);
  }
  return notice;
};

const writeDashboardAccessNotice = (notice: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.setItem(DASHBOARD_ACCESS_NOTICE_KEY, notice);
};

const navigateClient = (to: string, replace = false): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (replace) {
    window.history.replaceState(null, '', to);
  } else {
    window.history.pushState(null, '', to);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export function DashboardExperience({ pathname }: DashboardExperienceProps) {
  const normalizedPath = normalizePathname(pathname);
  const isLoginRoute = normalizedPath === '/dashboard/login' || normalizedPath === '/login';
  const isSignupRoute = normalizedPath === '/dashboard/signup' || normalizedPath === '/signup';
  const isDashboardRoute = normalizedPath.startsWith('/dashboard');
  const isLegacyManagerRoute = normalizedPath.startsWith('/manager-dashboard');
  const isLegacyUserRoute = normalizedPath.startsWith('/user-dashboard');
  const session = readAuthSession();

  if (isLoginRoute) {
    return <DashboardLoginPage />;
  }

  if (isSignupRoute) {
    return <DashboardSignupPage />;
  }

  if (isLegacyManagerRoute || isLegacyUserRoute) {
    const legacySuffix = normalizedPath.replace(/^\/(?:manager|user)-dashboard/, '');
    const target = `/dashboard${legacySuffix || ''}`;
    navigateClient(target, true);
    return null;
  }

  if (!isDashboardRoute) {
    return null;
  }

  if (!session) {
    const next = encodeURIComponent(normalizedPath);
    navigateClient(`/dashboard/login?next=${next}`, true);
    return null;
  }

  if (session.role === 'user' && normalizedPath.startsWith('/dashboard/blogs')) {
    writeDashboardAccessNotice('You do not have access to blog management features.');
    navigateClient('/dashboard', true);
    return null;
  }

  if (session.role === 'manager') {
    return <ManagerDashboardWorkspace pathname={normalizedPath} session={session} />;
  }

  if (session.role === 'user') {
    return <UserDashboardWorkspace pathname={normalizedPath} session={session} />;
  }

  return <DashboardWorkspace pathname={normalizedPath} role={session.role} session={session} />;
}

function DashboardWorkspace({ pathname, role, session }: { pathname: string; role: DashboardRole; session: AuthSession }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessNotice, setAccessNotice] = useState('');
  const sectionFromPath = getDashboardSectionFromPath(pathname);
  const canAccessSection = roleScope[role].includes(sectionFromPath);
  const activeSection = canAccessSection ? sectionFromPath : 'overview';

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const notice = readDashboardAccessNotice();
    if (!notice) {
      return;
    }
    setAccessNotice(notice);
  }, [pathname]);

  const pageTitleMap: Record<DashboardSection, string> = {
    overview: 'Executive Overview',
    pages: 'Page Management',
    blogs: 'Blog Management',
    users: 'User Intelligence',
    'visa-applications': 'Visa Applications',
    documents: 'Document Center',
    payments: 'Payments and Billing',
    'contact-entries': 'Contact Form Inbox',
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
                navigateClient('/dashboard/login', true);
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          {accessNotice ? <p className="dashboard-auth__message is-error">{accessNotice}</p> : null}
          {activeSection === 'overview' ? <OverviewPanel role={role} /> : null}
          {activeSection === 'pages' ? <PagesPanel /> : null}
          {activeSection === 'blogs' ? <RoleBasedBlogsPanel role={role} /> : null}
          {activeSection === 'users' ? <UsersPanel /> : null}
          {activeSection === 'visa-applications' ? <VisaApplicationsPanel /> : null}
          {activeSection === 'documents' ? <DocumentsPanel role={role} /> : null}
          {activeSection === 'payments' ? <PaymentsPanel role={role} /> : null}
          {activeSection === 'contact-entries' ? <ContactEntriesPanel audience="admin" /> : null}
          {activeSection === 'settings' ? <SettingsPanel role={role} /> : null}
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

type PlatformSettings = {
  maintenanceMode: boolean;
  requireMfaForAdmins: boolean;
  autoAssignCases: boolean;
  abandonedEmailAutomation: boolean;
  paymentAutoRetry: boolean;
  supportSlaHours: string;
  defaultApplicationSla: string;
  primaryBrand: string;
};

const defaultPlatformSettings: PlatformSettings = {
  maintenanceMode: false,
  requireMfaForAdmins: true,
  autoAssignCases: true,
  abandonedEmailAutomation: true,
  paymentAutoRetry: true,
  supportSlaHours: '8',
  defaultApplicationSla: '48',
  primaryBrand: 'var(--color-text)'
};

const loadPlatformSettings = (): PlatformSettings => {
  if (typeof window === 'undefined') {
    return defaultPlatformSettings;
  }

  try {
    const raw = window.localStorage.getItem(DASHBOARD_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return defaultPlatformSettings;
    }
    const parsed = JSON.parse(raw) as Partial<PlatformSettings>;
    return {
      maintenanceMode: typeof parsed.maintenanceMode === 'boolean' ? parsed.maintenanceMode : defaultPlatformSettings.maintenanceMode,
      requireMfaForAdmins:
        typeof parsed.requireMfaForAdmins === 'boolean' ? parsed.requireMfaForAdmins : defaultPlatformSettings.requireMfaForAdmins,
      autoAssignCases: typeof parsed.autoAssignCases === 'boolean' ? parsed.autoAssignCases : defaultPlatformSettings.autoAssignCases,
      abandonedEmailAutomation:
        typeof parsed.abandonedEmailAutomation === 'boolean' ? parsed.abandonedEmailAutomation : defaultPlatformSettings.abandonedEmailAutomation,
      paymentAutoRetry: typeof parsed.paymentAutoRetry === 'boolean' ? parsed.paymentAutoRetry : defaultPlatformSettings.paymentAutoRetry,
      supportSlaHours: typeof parsed.supportSlaHours === 'string' ? parsed.supportSlaHours : defaultPlatformSettings.supportSlaHours,
      defaultApplicationSla:
        typeof parsed.defaultApplicationSla === 'string' ? parsed.defaultApplicationSla : defaultPlatformSettings.defaultApplicationSla,
      primaryBrand: typeof parsed.primaryBrand === 'string' ? parsed.primaryBrand : defaultPlatformSettings.primaryBrand
    };
  } catch {
    return defaultPlatformSettings;
  }
};

function SettingsPanel({ role }: { role: DashboardRole }) {
  const isAdmin = role === 'admin';
  const [settings, setSettings] = useState<PlatformSettings>(() => loadPlatformSettings());
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => loadThemeSettings());
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  const updateSetting = (key: keyof PlatformSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateThemeGlobalSetting = (key: keyof ThemeSettings['global'], value: string) => {
    setThemeSettings((prev) => ({ ...prev, global: { ...prev.global, [key]: value } }));
  };

  const updateThemeSectionSetting = <K extends keyof ThemeSettings['sections']>(key: K, value: ThemeSettings['sections'][K]) => {
    setThemeSettings((prev) => ({ ...prev, sections: { ...prev.sections, [key]: value } }));
  };

  const sanitizedThemeSettings = useMemo<ThemeSettings>(
    () => ({
      global: {
        appBackground: sanitizeThemeColorValue(themeSettings.global.appBackground, defaultThemeSettings.global.appBackground).sanitized,
        headerBackground: sanitizeThemeColorValue(themeSettings.global.headerBackground, defaultThemeSettings.global.headerBackground).sanitized,
        buttonBackground: sanitizeThemeColorValue(themeSettings.global.buttonBackground, defaultThemeSettings.global.buttonBackground).sanitized,
        buttonText: sanitizeThemeColorValue(themeSettings.global.buttonText, defaultThemeSettings.global.buttonText).sanitized,
        footerBackground: sanitizeThemeColorValue(themeSettings.global.footerBackground, defaultThemeSettings.global.footerBackground).sanitized
      },
      sections: {
        enableHeroBackground: false,
        pageHeroBackground: sanitizeThemeColorValue(
          themeSettings.sections.pageHeroBackground,
          defaultThemeSettings.sections.pageHeroBackground
        ).sanitized,
        enableApplicationSectionBackground: themeSettings.sections.enableApplicationSectionBackground,
        applicationSectionBackground: sanitizeThemeColorValue(
          themeSettings.sections.applicationSectionBackground,
          defaultThemeSettings.sections.applicationSectionBackground
        ).sanitized
      }
    }),
    [themeSettings]
  );

  const sanitizationWarnings = useMemo(() => {
    const checks: Array<{ label: string; result: ReturnType<typeof sanitizeThemeColorValue> }> = [
      {
        label: 'App Background',
        result: sanitizeThemeColorValue(themeSettings.global.appBackground, defaultThemeSettings.global.appBackground)
      },
      {
        label: 'Header Background',
        result: sanitizeThemeColorValue(themeSettings.global.headerBackground, defaultThemeSettings.global.headerBackground)
      },
      {
        label: 'Button Background',
        result: sanitizeThemeColorValue(themeSettings.global.buttonBackground, defaultThemeSettings.global.buttonBackground)
      },
      {
        label: 'Button Text Color',
        result: sanitizeThemeColorValue(themeSettings.global.buttonText, defaultThemeSettings.global.buttonText)
      },
      {
        label: 'Footer Background',
        result: sanitizeThemeColorValue(themeSettings.global.footerBackground, defaultThemeSettings.global.footerBackground)
      }
    ];

    return checks
      .filter(({ result }) => result.usedFallback)
      .map(({ label, result }) => `${label}: ${result.reason ?? 'Invalid value replaced with default.'}`);
  }, [themeSettings]);

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

  const blockingContrastWarnings = useMemo(
    () => contrastWarnings.filter((warning) => warning.severity === 'error'),
    [contrastWarnings]
  );

  const resetThemeDefaults = () => {
    setThemeSettings(defaultThemeSettings);
    setSaveMessage('');
    setSaveError('');
  };

  const saveSettings = () => {
    try {
      window.localStorage.setItem(DASHBOARD_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      if (isAdmin) {
        if (blockingContrastWarnings.length > 0) {
          setSaveMessage('');
          setSaveError('Cannot save: fix theme contrast warnings (minimum 4.5:1) before applying changes.');
          return;
        }

        saveThemeSettings(sanitizedThemeSettings);
        applyThemeSettings(sanitizedThemeSettings);
      }
      setSaveError('');
      if (isAdmin && sanitizationWarnings.length > 0) {
        setSaveMessage(`Settings saved. ${sanitizationWarnings.length} invalid theme value(s) were replaced with defaults.`);
      } else {
        setSaveMessage('Settings saved successfully.');
      }
    } catch {
      setSaveMessage('');
      setSaveError('Unable to save settings. Please try again.');
    }
  };

  const resetSettings = () => {
    setSettings(defaultPlatformSettings);
    if (isAdmin) {
      setThemeSettings(defaultThemeSettings);
      saveThemeSettings(defaultThemeSettings);
      applyThemeSettings(defaultThemeSettings);
    }
    setSaveMessage('');
    setSaveError('');
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
      </article>

      {isAdmin ? (
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2>Theme &amp; Colors</h2>
            <small>Admin only</small>
          </div>
          <div className="dashboard-settings-grid">
            <label>
              App Background
              <input
                type="text"
                value={themeSettings.global.appBackground}
                onChange={(event) => updateThemeGlobalSetting('appBackground', event.target.value)}
                placeholder="#f8fafc or CSS var()/gradient"
              />
            </label>
            <label>
              Header Background
              <input
                type="text"
                value={themeSettings.global.headerBackground}
                onChange={(event) => updateThemeGlobalSetting('headerBackground', event.target.value)}
                placeholder="#ffffff or CSS var()/gradient"
              />
            </label>
            <label>
              Button Background
              <input
                type="text"
                value={themeSettings.global.buttonBackground}
                onChange={(event) => updateThemeGlobalSetting('buttonBackground', event.target.value)}
                placeholder="#1d4ed8 or CSS var()/gradient"
              />
            </label>
            <label>
              Button Text Color
              <input
                type="text"
                value={themeSettings.global.buttonText}
                onChange={(event) => updateThemeGlobalSetting('buttonText', event.target.value)}
                placeholder="#ffffff"
              />
            </label>
            <label>
              Footer Background
              <input
                type="text"
                value={themeSettings.global.footerBackground}
                onChange={(event) => updateThemeGlobalSetting('footerBackground', event.target.value)}
                placeholder="#04101f or CSS var()/gradient"
              />
            </label>
          </div>
          <div className="dashboard-toggle-list">
            <label>
              <input
                type="checkbox"
                checked={themeSettings.sections.enableApplicationSectionBackground}
                onChange={(event) => updateThemeSectionSetting('enableApplicationSectionBackground', event.target.checked)}
              />
              Override Application Section Background
            </label>
            <label>
              Application Section Background
              <input
                type="text"
                value={themeSettings.sections.applicationSectionBackground}
                onChange={(event) => updateThemeSectionSetting('applicationSectionBackground', event.target.value)}
                placeholder="#eef2f5 or CSS var()/gradient"
                disabled={!themeSettings.sections.enableApplicationSectionBackground}
              />
            </label>
            <label>
              <input type="checkbox" checked={themeSettings.sections.enableHeroBackground} disabled />
              Override Page Hero Background (Locked for now)
            </label>
          </div>
          <p className="dashboard-panel__note">
            Hero token remains unchanged by global palette updates unless a future explicit toggle is enabled.
          </p>
          {contrastWarnings.length ? (
            <div className="dashboard-settings-warnings" role="status" aria-live="polite">
              {contrastWarnings.map((warning) => (
                <p
                  key={warning.id}
                  className={`dashboard-auth__message ${warning.severity === 'error' ? 'is-error' : 'is-warning'}`}
                >
                  {warning.message}
                </p>
              ))}
            </div>
          ) : null}
          {sanitizationWarnings.length ? (
            <div className="dashboard-settings-warnings" role="status" aria-live="polite">
              {sanitizationWarnings.map((warning) => (
                <p key={warning} className="dashboard-auth__message is-warning">
                  {warning}
                </p>
              ))}
            </div>
          ) : null}
          <div className="dashboard-settings-actions">
            <button type="button" className="dashboard-ghost-button" onClick={resetThemeDefaults}>
              Reset Theme Defaults
            </button>
          </div>
        </article>
      ) : (
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2>Theme &amp; Colors</h2>
            <small>Admin only</small>
          </div>
          <p className="dashboard-panel__note">Theme controls are hidden for non-admin roles.</p>
        </article>
      )}

      <article className="dashboard-panel">
        <div className="dashboard-settings-actions">
          <button type="button" className="dashboard-primary-button" onClick={saveSettings}>
            Save Settings
          </button>
          <button type="button" className="dashboard-ghost-button" onClick={resetSettings}>
            Reset to Default
          </button>
        </div>
        {saveMessage ? <p className="dashboard-auth__message is-success">{saveMessage}</p> : null}
        {saveError ? <p className="dashboard-auth__message is-error">{saveError}</p> : null}
      </article>
    </section>
  );
}

function ContactEntriesPanel({ audience }: { audience: 'admin' | 'manager' }) {
  const [entries, setEntries] = useState<ContactEntry[]>([]);

  useEffect(() => {
    setEntries(getContactEntries());
  }, []);

  const subtitle =
    audience === 'admin'
      ? 'Messages submitted from the Contact Us page are shown below.'
      : 'Track and triage customer inquiries from the public contact form.';

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Contact Form Submissions</h2>
          <small>{entries.length} total messages</small>
        </div>
        <p className="dashboard-panel__note">{subtitle}</p>

        {entries.length ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.name}</td>
                    <td>
                      <strong>{entry.email}</strong>
                      <small>{entry.phone}</small>
                    </td>
                    <td>{entry.subject}</td>
                    <td className="dashboard-cell-message">{entry.message}</td>
                    <td>{formatDashboardDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="dashboard-empty-state">
            No contact messages yet. New submissions from `/contact-us` will appear here.
          </p>
        )}
      </article>
    </section>
  );
}

function formatDashboardDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function toWorkflowStatus(status: string): BlogWorkflowStatus {
  if (status === 'in_review') return 'In Review';
  if (status === 'scheduled') return 'Scheduled';
  if (status === 'published') return 'Published';
  if (status === 'archived') return 'Archived';
  return 'Draft';
}

function RoleBasedBlogsPanel({ role }: { role: DashboardRole }) {
  const actions = roleBlogActions[role];
  const canCreate = actions.includes('create');
  const canEdit = actions.includes('edit');
  const canApproveReview = actions.includes('approve-review');
  const canPublish = actions.includes('publish');
  const canArchive = actions.includes('archive');
  const canDelete = actions.includes('delete');
  const canOverride = actions.includes('override');
  const canManageSettings = actions.includes('settings');
  const canSubmitReview = actions.includes('submit-review');
  const canRestoreRevision = role === 'admin';
  const { filters, setFilters, posts: adminPosts, loading, error, onPublish, onSchedule, onArchive } = useBlogAdminTable();
  const [revisions, setRevisions] = useState<BlogRevision[]>([
    { id: 'rev-18', version: 'v1.8', editor: 'Noah Farooq', timestamp: '2026-04-13 11:10 UTC', fromStatus: 'In Review' as const, toStatus: 'In Review' as const },
    { id: 'rev-17', version: 'v1.7', editor: 'Olivia Brown', timestamp: '2026-04-12 09:42 UTC', fromStatus: 'Draft' as const, toStatus: 'In Review' as const },
    { id: 'rev-16', version: 'v1.6', editor: 'Emma Wilson', timestamp: '2026-04-11 16:24 UTC', fromStatus: 'Draft' as const, toStatus: 'Draft' as const }
  ]);
  const [comments, setComments] = useState<BlogComment[]>([
    { id: 'cmt-1', author: 'Olivia Brown', role: 'Manager' as const, createdAt: '2026-04-12 09:50 UTC', note: 'Add stronger context around financial sufficiency calculations.' },
    { id: 'cmt-2', author: 'Admin Team', role: 'Admin' as const, createdAt: '2026-04-13 08:22 UTC', note: 'Legal check complete. Ready for publish checklist verification.' }
  ]);
  const [auditEvents, setAuditEvents] = useState<BlogAuditEvent[]>([
    { id: 'evt-1', actor: 'Olivia Brown', action: 'create', timestamp: '2026-04-12 09:30 UTC' },
    { id: 'evt-2', actor: 'Olivia Brown', action: 'update', timestamp: '2026-04-12 09:42 UTC' },
    { id: 'evt-3', actor: 'Noah Farooq', action: 'status change → In Review', timestamp: '2026-04-13 11:10 UTC' }
  ]);

  const actorName = role === 'admin' ? 'Admin Team' : role === 'manager' ? 'Manager Reviewer' : 'Editor';

  const posts = adminPosts.map((post) => ({
    id: post.id,
    title: post.title,
    owner: post.authorName,
    updatedAt: formatDashboardDate(post.updatedAt),
    status: toWorkflowStatus(post.status)
  }));

  const staleThresholdDays = 45;
  const performanceSnapshot = useMemo(
    () => getBlogPerformanceSnapshot(adminPosts, { staleThresholdDays }),
    [adminPosts]
  );

  const handleGovernanceEvent = async (event: { action: string; status: 'Draft' | 'In Review' | 'Scheduled' | 'Published' | 'Archived' }) => {
    const firstPost = adminPosts[0];

    if (firstPost) {
      if (event.status === 'Published') {
        await onPublish(firstPost.id);
      } else if (event.status === 'Scheduled') {
        await onSchedule(firstPost.id, new Date(Date.now() + 3600000).toISOString());
      } else if (event.status === 'Archived') {
        await onArchive(firstPost.id);
      }
    }

    setAuditEvents((current) => [
      { id: `evt-${current.length + 1}`, actor: actorName, action: event.action.toLowerCase().includes('publish') ? 'publish' : `status change → ${event.status}`, timestamp: '2026-04-14 12:00 UTC' },
      ...current
    ]);
    setRevisions((current) => [
      { id: `rev-${current.length + 19}`, version: `v1.${current.length + 9}`, editor: actorName, timestamp: '2026-04-14 12:00 UTC', fromStatus: current[0]?.toStatus ?? 'Draft', toStatus: event.status },
      ...current
    ]);
  };

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel dashboard-panel--accent">
        <div className="dashboard-actions-inline" style={{ flexWrap: 'wrap' }}>
          <input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            placeholder="Search dashboard posts"
            aria-label="Search dashboard posts"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as typeof current.status }))}
            aria-label="Filter dashboard post status"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </article>

      <BlogPerformanceWidgets snapshot={performanceSnapshot} staleThresholdDays={staleThresholdDays} />
      <BlogsPanel role={role} actions={actions} posts={posts} loading={loading} error={error} />
      <div className="dashboard-grid dashboard-grid--2">
        <BlogEditorPanel
          role={role}
          canCreate={canCreate}
          canEdit={canEdit}
          canManageSettings={canManageSettings}
          canSubmitReview={canSubmitReview}
          canApproveReview={canApproveReview}
          canPublish={canPublish}
          canArchive={canArchive}
          canOverride={canOverride}
          onGovernanceEvent={(event) => {
            void handleGovernanceEvent(event);
          }}
        />
        <BlogReviewPanel
          role={role}
          canSubmitReview={canSubmitReview}
          canApproveReview={canApproveReview}
          canPublish={canPublish}
          canArchive={canArchive}
          canDelete={canDelete}
          canOverride={canOverride}
          canRestoreRevision={canRestoreRevision}
          revisions={revisions}
          comments={comments}
          auditEvents={auditEvents}
          onRestoreRevision={(revisionId) => {
            if (!canRestoreRevision) return;
            const revision = revisions.find((item) => item.id === revisionId);
            if (!revision) return;
            setAuditEvents((current) => [
              { id: `evt-${current.length + 1}`, actor: actorName, action: `restore ${revision.version}`, timestamp: '2026-04-14 12:10 UTC' },
              ...current
            ]);
          }}
          onAddComment={(note) =>
            setComments((current) => [
              { id: `cmt-${current.length + 1}`, author: actorName, role: role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : 'Editor', createdAt: '2026-04-14 12:05 UTC', note },
              ...current
            ])
          }
        />
      </div>
    </section>
  );
}

function ManagerDashboardWorkspace({ pathname, session }: { pathname: string; session: AuthSession }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeSection = getManagerSectionFromPath(pathname);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const titleMap: Record<ManagerSection, string> = {
    overview: 'Manager Overview',
    team: 'Team Queue',
    applications: 'Application Pipeline',
    blogs: 'Blog Editorial',
    documents: 'Document Review',
    payments: 'Payment Oversight',
    'contact-entries': 'Contact Form Inbox',
    settings: 'Manager Settings'
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
        <a href="/dashboard" className="dashboard-brand" aria-label="Manager Dashboard Home">
          <span className="dashboard-brand__logo">MG</span>
          <span className="dashboard-brand__text">
            <strong>Manager Console</strong>
            <small>Operations Control</small>
          </span>
        </a>

        <nav className="dashboard-menu" aria-label="Manager dashboard navigation">
          {managerSidebarItems.map((item) => {
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
          <p>Escalations due in next 24h: 7</p>
          <a href="/dashboard/team">Review team assignments</a>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <button type="button" className="dashboard-menu-toggle" onClick={() => setSidebarOpen((prev) => !prev)}>
              Menu
            </button>
            <div>
              <p className="dashboard-topbar__eyebrow">Manager Portal</p>
              <h1>{titleMap[activeSection]}</h1>
            </div>
          </div>
          <div className="dashboard-topbar__right">
            <div className="dashboard-role-picker">
              Logged in as
              <strong>MANAGER</strong>
              <small>{session.email}</small>
            </div>
            <button
              type="button"
              className="dashboard-ghost-button"
              onClick={() => {
                clearAuthSession();
                navigateClient('/dashboard/login', true);
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          {activeSection === 'overview' ? <ManagerOverviewPanel /> : null}
          {activeSection === 'team' ? <ManagerTeamPanel /> : null}
          {activeSection === 'applications' ? <ManagerApplicationsPanel /> : null}
          {activeSection === 'blogs' ? <RoleBasedBlogsPanel role="manager" /> : null}
          {activeSection === 'documents' ? <ManagerDocumentsPanel /> : null}
          {activeSection === 'payments' ? <ManagerPaymentsPanel /> : null}
          {activeSection === 'contact-entries' ? <ContactEntriesPanel audience="manager" /> : null}
          {activeSection === 'settings' ? <ManagerSettingsPanel /> : null}
        </main>
      </div>
    </div>
  );
}

function ManagerOverviewPanel() {
  return (
    <section className="dashboard-stack">
      <div className="dashboard-kpi-grid">
        <article className="dashboard-kpi-card">
          <p>Cases Assigned Today</p>
          <strong>46</strong>
          <span>+8 vs yesterday</span>
        </article>
        <article className="dashboard-kpi-card">
          <p>Pending Reviews</p>
          <strong>19</strong>
          <span>Documents + compliance</span>
        </article>
        <article className="dashboard-kpi-card">
          <p>Team SLA Breaches</p>
          <strong>3</strong>
          <span>Immediate escalation</span>
        </article>
        <article className="dashboard-kpi-card">
          <p>Avg Turnaround</p>
          <strong>31h</strong>
          <span>Target: under 36h</span>
        </article>
      </div>
      <div className="dashboard-grid dashboard-grid--2">
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2>Team Capacity</h2>
          </div>
          <ul className="dashboard-simple-list">
            <li>Intake Team: 82% utilized</li>
            <li>Verification Team: 91% utilized</li>
            <li>Final Review Team: 69% utilized</li>
          </ul>
        </article>
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h2>Priority Alerts</h2>
          </div>
          <ul className="dashboard-simple-list">
            <li>7 high-priority files pending manager action</li>
            <li>3 cases near SLA breach threshold</li>
            <li>2 payment disputes awaiting final decision</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

function ManagerTeamPanel() {
  const team = [
    { name: 'Nadia R.', openCases: 12, completedToday: 5, slaRisk: 'Low' },
    { name: 'Jordan M.', openCases: 17, completedToday: 6, slaRisk: 'Medium' },
    { name: 'Nina K.', openCases: 21, completedToday: 4, slaRisk: 'High' }
  ];

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Team Workload Board</h2>
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Open Cases</th>
                <th>Completed Today</th>
                <th>SLA Risk</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.name}>
                  <td>{member.name}</td>
                  <td>{member.openCases}</td>
                  <td>{member.completedToday}</td>
                  <td>
                    <span className={`dashboard-chip dashboard-chip--${toClassToken(member.slaRisk)}`}>{member.slaRisk}</span>
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

function ManagerApplicationsPanel() {
  return <VisaApplicationsPanel />;
}

function ManagerDocumentsPanel() {
  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Document Escalation Queue</h2>
        </div>
        <ul className="dashboard-simple-list">
          <li>9 passport scans rejected due to low quality</li>
          <li>5 financial proof documents flagged for mismatch</li>
          <li>3 applications blocked pending manual verification</li>
        </ul>
      </article>
    </section>
  );
}

function ManagerPaymentsPanel() {
  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Payment Reconciliation</h2>
        </div>
        <ul className="dashboard-simple-list">
          <li>Settlements pending: $11,290</li>
          <li>Failed transactions (24h): 8</li>
          <li>Refund approvals required: 3</li>
        </ul>
      </article>
    </section>
  );
}

function ManagerSettingsPanel() {
  const [autoEscalation, setAutoEscalation] = useState(true);
  const [slaTarget, setSlaTarget] = useState('36');
  const [reviewThreshold, setReviewThreshold] = useState('High Priority Only');

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Operations Preferences</h2>
        </div>
        <div className="dashboard-settings-grid">
          <label>
            SLA Target (hours)
            <input value={slaTarget} onChange={(event) => setSlaTarget(event.target.value)} />
          </label>
          <label>
            Review Threshold
            <input value={reviewThreshold} onChange={(event) => setReviewThreshold(event.target.value)} />
          </label>
        </div>
        <div className="dashboard-toggle-list">
          <label>
            <input type="checkbox" checked={autoEscalation} onChange={(event) => setAutoEscalation(event.target.checked)} />
            Enable auto-escalation for SLA risk
          </label>
        </div>
        <div className="dashboard-settings-actions">
          <button type="button" className="dashboard-primary-button">
            Save Manager Settings
          </button>
        </div>
      </article>
    </section>
  );
}

function UserDashboardWorkspace({ pathname, session }: { pathname: string; session: AuthSession }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessNotice, setAccessNotice] = useState('');
  const activeSection = getUserSectionFromPath(pathname);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const notice = readDashboardAccessNotice();
    if (!notice) {
      return;
    }
    setAccessNotice(notice);
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
        <a href="/dashboard" className="dashboard-brand" aria-label="User Dashboard Home">
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
          <a href="/dashboard/messages">Open support center</a>
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
                navigateClient('/dashboard/login', true);
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          {accessNotice ? <p className="dashboard-auth__message is-error">{accessNotice}</p> : null}
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
  const [email, setEmail] = useState(dummyCredentials.admin.email);
  const [password, setPassword] = useState(dummyCredentials.admin.password);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const existing = readAuthSession();
    if (!existing) {
      return;
    }
    navigateClient('/dashboard', true);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const matchedRole = (Object.keys(dummyCredentials) as DashboardRole[]).find((role) => {
      const credentials = dummyCredentials[role];
      return email.trim().toLowerCase() === credentials.email.toLowerCase() && password === credentials.password;
    });

    if (!matchedRole) {
      setMessageType('error');
      setMessage('Invalid credentials. Use one of the dummy accounts listed below.');
      return;
    }

    const expected = dummyCredentials[matchedRole];
    writeAuthSession({
      role: matchedRole,
      email: expected.email,
      loginAt: new Date().toISOString()
    });

    if (typeof window !== 'undefined') {
      const next = new URLSearchParams(window.location.search).get('next');
      if (next) {
        navigateClient(next, true);
        return;
      }
      navigateClient(expected.route, true);
      return;
    }

    setMessageType('success');
    setMessage('Login successful.');
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
          <p>Use your credentials. Role will be detected automatically.</p>
          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input className="dashboard-auth__input" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Password
              <input className="dashboard-auth__input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button type="submit" className="dashboard-primary-button dashboard-primary-button--wide">
              Sign In
            </button>
          </form>
          <div className="dashboard-auth__dummy-list">
            <strong>Dummy Logins</strong>
            <p>Admin: admin@ausvisaservice.com / Admin@123</p>
            <p>Manager: manager@ausvisaservice.com / Manager@123</p>
            <p>User: user@ausvisaservice.com / User@123</p>
          </div>
          {message ? <p className={`dashboard-auth__message ${messageType === 'error' ? 'is-error' : ''}`}>{message}</p> : null}
          <div className="dashboard-auth__links">
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
