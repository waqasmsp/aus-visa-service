type DashboardRole = 'admin' | 'manager' | 'user';
type BlogAction = 'create' | 'edit' | 'submit-review' | 'publish' | 'archive' | 'delete' | 'settings';

export function BlogsPanel({ role, actions }: { role: DashboardRole; actions: BlogAction[] }) {
  return (
    <article className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h2>Blogs Workspace</h2>
        <small>{role.toUpperCase()} permissions</small>
      </div>
      <p className="dashboard-panel__note">Manage editorial content, SEO metadata, and publication workflow for blog content.</p>
      <ul className="dashboard-simple-list">
        <li>Allowed actions: {actions.join(', ') || 'None'}</li>
        <li>Route: /dashboard/blogs</li>
      </ul>
    </article>
  );
}
