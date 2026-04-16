import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ContactEntry } from '../../types/contact';
import { getContactEntries } from '../../utils/contactEntries';
import { BlogEditorPanel } from '../../components/dashboard/blogs/BlogEditorPanel';
import { BlogReviewPanel } from '../../components/dashboard/blogs/BlogReviewPanel';
import { BlogsPanel } from '../../components/dashboard/blogs/BlogsPanel';
import { BlogPerformanceWidgets } from '../../components/dashboard/blogs/BlogPerformanceWidgets';
import { DashboardTopNavProfileMenu } from '../../components/dashboard/navigation/DashboardTopNavProfileMenu';
import { VisaApplicationsPanel } from '../../components/dashboard/applications/VisaApplicationsPanel';
import { UsersPanel } from '../../components/dashboard/users/UsersPanel';
import { PagesPanel } from '../../components/dashboard/pages/PagesPanel';
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingSkeleton,
  MutationToastRegion,
  useMutationToasts
} from '../../components/dashboard/common/asyncUi';
import { useDashboardTableState } from '../../components/dashboard/common/useDashboardTableState';
import { useBlogAdminTable } from '../../hooks/useBlogAdminTable';
import { getBlogPerformanceSnapshot } from '../../services/blogAnalyticsService';
import { SettingsPanel } from '../../components/dashboard/settings/SettingsPanel';
import { TransactionCenterPanel } from '../../components/dashboard/payments/TransactionCenterPanel';
import { canPerform, collectDestructiveApproval } from '../../services/dashboard/authPolicy';
import { writeAuditEvent } from '../../services/dashboard/audit.service';
import { isModuleEnabled, listModuleFlags } from '../../services/dashboard/featureFlags.service';

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

const AUTH_SESSION_KEY = 'aus-visa-auth-session';
const DASHBOARD_ACCESS_NOTICE_KEY = 'aus-visa-dashboard-access-notice';

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

const isProfileRoute = (pathname: string): boolean => normalizePathname(pathname).startsWith('/dashboard/profile');
const isProfileSettingsRoute = (pathname: string): boolean => normalizePathname(pathname).startsWith('/dashboard/profile/settings');

const toClassToken = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const sectionFlagMap: Partial<Record<DashboardSection, 'applications' | 'users' | 'pages' | 'blogs' | 'settings' | 'webhooks' | 'rbac-audit'>> = {
  pages: 'pages',
  blogs: 'blogs',
  users: 'users',
  'visa-applications': 'applications',
  settings: 'settings'
};

const isSectionEnabled = (section: DashboardSection): boolean => {
  const moduleKey = sectionFlagMap[section];
  return moduleKey ? isModuleEnabled(moduleKey) : true;
};
const managerSectionFlagMap: Partial<Record<ManagerSection, 'applications' | 'blogs' | 'settings'>> = {
  applications: 'applications',
  blogs: 'blogs',
  settings: 'settings'
};
const userSectionFlagMap: Partial<Record<UserSection, 'applications'>> = {
  applications: 'applications'
};

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
  const activeSection = canAccessSection && isSectionEnabled(sectionFromPath) ? sectionFromPath : 'overview';
  const profileRoute = isProfileRoute(pathname);
  const moduleFlags = useMemo(() => listModuleFlags(), []);
  const enabledModuleCount = moduleFlags.filter((flag) => flag.enabled && flag.rollout > 0).length;

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
  const currentTitle = profileRoute ? 'Profile Settings' : pageTitleMap[activeSection];

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
            const enabled = isSectionEnabled(item.section);
            const active = activeSection === item.section;
            const linkClass = ['dashboard-menu__item', active ? 'is-active' : '', allowed && enabled ? '' : 'is-locked'].join(' ').trim();
            return (
              <a key={item.section} href={allowed && enabled ? item.href : '#'} className={linkClass} aria-current={active ? 'page' : undefined}>
                <span>{item.label}</span>
                {enabled ? (item.badge ? <small>{item.badge}</small> : null) : <small>Paused</small>}
              </a>
            );
          })}
        </nav>

        <div className="dashboard-sidebar__foot">
          <p>Security posture: 99.98% uptime this quarter · {enabledModuleCount}/{moduleFlags.length} modules enabled</p>
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
              <h1>{currentTitle}</h1>
            </div>
          </div>
          <div className="dashboard-topbar__right">
            <DashboardTopNavProfileMenu
              roleLabel={role.toUpperCase()}
              email={session.email}
              onViewProfile={() => navigateClient('/dashboard/profile', false)}
              onEditProfileSettings={() => navigateClient('/dashboard/profile/settings', false)}
              onLogout={() => {
                clearAuthSession();
                navigateClient('/dashboard/login', true);
              }}
            />
          </div>
        </header>

        <main className="dashboard-content">
          {accessNotice ? <p className="dashboard-auth__message is-error">{accessNotice}</p> : null}
          {!profileRoute && !isSectionEnabled(sectionFromPath) ? (
            <p className="dashboard-auth__message is-error">This module is temporarily disabled by release toggle. Use Overview while rollout is paused.</p>
          ) : null}
          {profileRoute ? <ProfileSettingsPanel role={role} userEmail={session.email} /> : null}
          {!profileRoute && activeSection === 'overview' ? <OverviewPanel role={role} /> : null}
          {!profileRoute && activeSection === 'pages' ? <PagesPanel role={session.role} /> : null}
          {!profileRoute && activeSection === 'blogs' ? <RoleBasedBlogsPanel role={role} /> : null}
          {!profileRoute && activeSection === 'users' ? <UsersPanel role={session.role} basePath="/dashboard/users" /> : null}
          {!profileRoute && activeSection === 'visa-applications' ? <VisaApplicationsPanel role={session.role} basePath="/dashboard/visa-applications" /> : null}
          {!profileRoute && activeSection === 'documents' ? <DocumentsPanel role={role} /> : null}
          {!profileRoute && activeSection === 'payments' ? <PaymentsPanel role={role} /> : null}
          {!profileRoute && activeSection === 'contact-entries' ? <ContactEntriesPanel audience="admin" /> : null}
          {!profileRoute && activeSection === 'settings' ? <SettingsPanel role={role} actorEmail={session.email} /> : null}
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
  return <TransactionCenterPanel role={role} />;
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
  const { filters, setFilters, posts: adminPosts, loading, error, onPublish, onSchedule, onArchive, onBatchUpdate, getSeoScore, filterOptions } = useBlogAdminTable(role);
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

  const staleThresholdDays = 45;
  const performanceSnapshot = useMemo(
    () => getBlogPerformanceSnapshot(adminPosts, { staleThresholdDays }),
    [adminPosts]
  );
  const metricsBySlug = useMemo(
    () => new Map(performanceSnapshot.topPerformingPosts.map((item) => [item.slug, item])),
    [performanceSnapshot.topPerformingPosts]
  );

  const posts = adminPosts.map((post) => {
    const metrics = metricsBySlug.get(post.slug);
    const publishAt = post.publishedAt ?? post.scheduledAt ?? '';
    return {
      id: post.id,
      title: post.title,
      owner: post.authorName,
      updatedAt: formatDashboardDate(post.updatedAt),
      status: toWorkflowStatus(post.status),
      category: post.categoryIds[0] ?? 'Uncategorized',
      tags: post.tagIds,
      publishAt: publishAt ? formatDashboardDate(publishAt) : '—',
      seoScore: getSeoScore(post),
      ctr: metrics?.ctr ?? null,
      impressions: metrics?.views ?? null,
      conversionAttribution: metrics?.ctaClicks != null && metrics?.views ? metrics.ctaClicks / metrics.views : null
    };
  });

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

  const handleBulkAction = async ({
    action,
    postIds,
    value
  }: {
    action: 'schedule' | 'publish' | 'archive' | 'apply-category' | 'apply-tag';
    postIds: string[];
    value?: string;
  }): Promise<string> => {
    if (action === 'publish') {
      if (!canPerform(role, 'blogs', 'publish')) {
        return 'Permission denied for publish.';
      }
      const approval = collectDestructiveApproval('blogs', 'publish', `${postIds.length} blog posts`);
      if (!approval) return 'Publish canceled by policy safeguard.';
      await Promise.all(postIds.map((postId) => onPublish(postId)));
      writeAuditEvent({ actor: actorName, action: 'batch_publish', entityType: 'blogs', entityId: postIds.join(','), before: null, after: { postIds, approval } });
      return `Published ${postIds.length} post(s).`;
    }
    if (action === 'schedule') {
      const scheduledAt = value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toISOString() : new Date(Date.now() + 3600000).toISOString();
      await Promise.all(postIds.map((postId) => onSchedule(postId, scheduledAt)));
      return `Scheduled ${postIds.length} post(s).`;
    }
    if (action === 'archive') {
      if (!canPerform(role, 'blogs', 'edit')) {
        return 'Permission denied for archive.';
      }
      await Promise.all(postIds.map((postId) => onArchive(postId)));
      return `Archived ${postIds.length} post(s).`;
    }
    if (action === 'apply-category') {
      if (!value) return 'Category is required for batch apply.';
      const sourceMap = new Map(adminPosts.map((post) => [post.id, post]));
      await onBatchUpdate(
        postIds
          .map((postId) => {
            const post = sourceMap.get(postId);
            if (!post) return null;
            return { postId, updates: { categoryIds: [value, ...post.categoryIds.filter((item) => item !== value)] } };
          })
          .filter((entry): entry is { postId: string; updates: { categoryIds: string[] } } => Boolean(entry))
      );
      return `Applied category \"${value}\" to ${postIds.length} post(s).`;
    }
    if (!value) return 'Tag is required for batch apply.';
    const sourceMap = new Map(adminPosts.map((post) => [post.id, post]));
    await onBatchUpdate(
      postIds
        .map((postId) => {
          const post = sourceMap.get(postId);
          if (!post) return null;
          const nextTags = post.tagIds.includes(value) ? post.tagIds : [...post.tagIds, value];
          return { postId, updates: { tagIds: nextTags } };
        })
        .filter((entry): entry is { postId: string; updates: { tagIds: string[] } } => Boolean(entry))
    );
    return `Applied tag \"${value}\" to ${postIds.length} post(s).`;
  };

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel dashboard-panel--accent">
        <div className="dashboard-filter-grid">
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
          <select
            value={filters.author}
            onChange={(event) => setFilters((current) => ({ ...current, author: event.target.value }))}
            aria-label="Filter by author"
          >
            <option value="">All authors</option>
            {filterOptions.authors.map((author) => (
              <option key={author} value={author}>{author}</option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {filterOptions.categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={filters.tag}
            onChange={(event) => setFilters((current) => ({ ...current, tag: event.target.value }))}
            aria-label="Filter by tag"
          >
            <option value="">All tags</option>
            {filterOptions.tags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <input type="date" value={filters.publishDateFrom} onChange={(event) => setFilters((current) => ({ ...current, publishDateFrom: event.target.value }))} aria-label="Publish date from" />
          <input type="date" value={filters.publishDateTo} onChange={(event) => setFilters((current) => ({ ...current, publishDateTo: event.target.value }))} aria-label="Publish date to" />
          <input type="number" min={0} max={100} placeholder="SEO score min" value={filters.seoScoreMin} onChange={(event) => setFilters((current) => ({ ...current, seoScoreMin: event.target.value }))} aria-label="SEO score minimum" />
          <input type="number" min={0} max={100} placeholder="SEO score max" value={filters.seoScoreMax} onChange={(event) => setFilters((current) => ({ ...current, seoScoreMax: event.target.value }))} aria-label="SEO score maximum" />
        </div>
      </article>

      <BlogPerformanceWidgets snapshot={performanceSnapshot} staleThresholdDays={staleThresholdDays} />
      <BlogsPanel
        role={role}
        actions={actions}
        posts={posts}
        loading={loading}
        error={error}
        onArchive={(postId) => void onArchive(postId)}
        onBulkAction={handleBulkAction}
      />
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
  const routedSection = getManagerSectionFromPath(pathname);
  const activeSection = managerSectionFlagMap[routedSection] && !isModuleEnabled(managerSectionFlagMap[routedSection]!) ? 'overview' : routedSection;
  const profileRoute = isProfileRoute(pathname);

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
  const currentTitle = profileRoute ? 'Profile Settings' : titleMap[activeSection];

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
            const moduleKey = managerSectionFlagMap[item.section];
            const enabled = moduleKey ? isModuleEnabled(moduleKey) : true;
            return (
              <a key={item.section} href={enabled ? item.href : '#'} className={`dashboard-menu__item ${active ? 'is-active' : ''} ${enabled ? '' : 'is-locked'}`} aria-current={active ? 'page' : undefined}>
                <span>{item.label}</span>
                {enabled ? (item.badge ? <small>{item.badge}</small> : null) : <small>Paused</small>}
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
              <h1>{currentTitle}</h1>
            </div>
          </div>
          <div className="dashboard-topbar__right">
            <DashboardTopNavProfileMenu
              roleLabel="MANAGER"
              email={session.email}
              onViewProfile={() => navigateClient('/dashboard/profile', false)}
              onEditProfileSettings={() => navigateClient('/dashboard/profile/settings', false)}
              onLogout={() => {
                clearAuthSession();
                navigateClient('/dashboard/login', true);
              }}
            />
          </div>
        </header>

        <main className="dashboard-content">
          {managerSectionFlagMap[routedSection] && !isModuleEnabled(managerSectionFlagMap[routedSection]!) ? (
            <p className="dashboard-auth__message is-error">This manager module is paused by feature flag during progressive rollout.</p>
          ) : null}
          {profileRoute ? <ProfileSettingsPanel role="manager" userEmail={session.email} /> : null}
          {!profileRoute && activeSection === 'overview' ? <ManagerOverviewPanel /> : null}
          {!profileRoute && activeSection === 'team' ? <ManagerTeamPanel /> : null}
          {!profileRoute && activeSection === 'applications' ? <ManagerApplicationsPanel /> : null}
          {!profileRoute && activeSection === 'blogs' ? <RoleBasedBlogsPanel role="manager" /> : null}
          {!profileRoute && activeSection === 'documents' ? <ManagerDocumentsPanel /> : null}
          {!profileRoute && activeSection === 'payments' ? <ManagerPaymentsPanel /> : null}
          {!profileRoute && activeSection === 'contact-entries' ? <ContactEntriesPanel audience="manager" /> : null}
          {!profileRoute && activeSection === 'settings' ? <ManagerSettingsPanel /> : null}
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
  return <VisaApplicationsPanel role="manager" basePath="/dashboard/applications" />;
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
  return <TransactionCenterPanel role="manager" />;
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
  const profileSettingsRoute = isProfileSettingsRoute(pathname);
  const flagAwareSection = userSectionFlagMap[activeSection] && !isModuleEnabled(userSectionFlagMap[activeSection]!) ? 'overview' : activeSection;

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
            const active = flagAwareSection === item.section;
            const moduleKey = userSectionFlagMap[item.section];
            const enabled = moduleKey ? isModuleEnabled(moduleKey) : true;
            return (
              <a key={item.section} href={enabled ? item.href : '#'} className={`dashboard-menu__item ${active ? 'is-active' : ''} ${enabled ? '' : 'is-locked'}`} aria-current={active ? 'page' : undefined}>
                <span>{item.label}</span>
                {enabled ? (item.badge ? <small>{item.badge}</small> : null) : <small>Paused</small>}
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
              <h1>{pageTitleMap[flagAwareSection]}</h1>
            </div>
          </div>
          <div className="dashboard-topbar__right">
            <DashboardTopNavProfileMenu
              roleLabel="USER"
              email={session.email}
              onViewProfile={() => navigateClient('/dashboard/profile', false)}
              onEditProfileSettings={() => navigateClient('/dashboard/profile/settings', false)}
              onLogout={() => {
                clearAuthSession();
                navigateClient('/dashboard/login', true);
              }}
            />
          </div>
        </header>

        <main className="dashboard-content">
          {accessNotice ? <p className="dashboard-auth__message is-error">{accessNotice}</p> : null}
          {userSectionFlagMap[activeSection] && !isModuleEnabled(userSectionFlagMap[activeSection]!) ? (
            <p className="dashboard-auth__message is-error">This module is temporarily paused while release flags are updated.</p>
          ) : null}
          {flagAwareSection === 'overview' ? <UserOverviewPanel /> : null}
          {flagAwareSection === 'applications' ? <UserApplicationsPanel /> : null}
          {flagAwareSection === 'documents' ? <UserDocumentsPanel /> : null}
          {flagAwareSection === 'payments' ? <UserPaymentsPanel /> : null}
          {flagAwareSection === 'messages' ? <UserMessagesPanel /> : null}
          {flagAwareSection === 'profile' ? <UserProfilePanel userEmail={session.email} isSettingsView={profileSettingsRoute} /> : null}
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
  return <VisaApplicationsPanel role="user" basePath="/dashboard/applications" />;
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

function UserProfilePanel({ userEmail, isSettingsView = false }: { userEmail: string; isSettingsView?: boolean }) {
  const [fullName, setFullName] = useState('John Doe');
  const [phone, setPhone] = useState('+92 300 0000000');
  const [country, setCountry] = useState('Pakistan');

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>{isSettingsView ? 'Edit Profile Settings' : 'Profile and Preferences'}</h2>
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

function ProfileSettingsPanel({ role, userEmail }: { role: DashboardRole; userEmail: string }) {
  const roleDescriptions: Record<DashboardRole, string> = {
    admin: 'Manage your admin identity and account preferences used across dashboards.',
    manager: 'Manage your manager identity and account preferences used across team workflows.',
    user: 'Manage your personal profile settings.'
  };

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h2>Profile Settings</h2>
          <small>{roleDescriptions[role]}</small>
        </div>
        <div className="dashboard-settings-grid">
          <label>
            Account Role
            <input value={role.toUpperCase()} disabled />
          </label>
          <label>
            Email
            <input value={userEmail} disabled />
          </label>
          <label>
            Notification Preference
            <input defaultValue="Email + In-app alerts" />
          </label>
          <label>
            Time Zone
            <input defaultValue="UTC+00:00" />
          </label>
        </div>
        <div className="dashboard-settings-actions">
          <button type="button" className="dashboard-primary-button">
            Save Profile Settings
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
