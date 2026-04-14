type DashboardRole = 'admin' | 'manager' | 'user';
type BlogAction = 'create' | 'edit' | 'submit-review' | 'approve-review' | 'publish' | 'archive' | 'delete' | 'settings' | 'override';
type BlogWorkflowStatus = 'Draft' | 'In Review' | 'Scheduled' | 'Published' | 'Archived';

type BlogRow = {
  id: string;
  title: string;
  owner: string;
  updatedAt: string;
  status: BlogWorkflowStatus;
};

export function BlogsPanel({
  role,
  actions,
  posts
}: {
  role: DashboardRole;
  actions: BlogAction[];
  posts: BlogRow[];
}) {
  return (
    <article className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h2>Blogs Workspace</h2>
        <small>{role.toUpperCase()} permissions</small>
      </div>
      <p className="dashboard-panel__note">Manage editorial content, SEO metadata, and publication workflow for blog content.</p>
      <ul className="dashboard-simple-list">
        <li>Allowed actions: {actions.join(', ') || 'None'}</li>
        <li>Workflow states: Draft, In Review, Scheduled, Published, Archived</li>
        <li>Route: /dashboard/blogs</li>
      </ul>

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Owner</th>
              <th>Last updated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>
                  <strong>{post.title}</strong>
                  <small>{post.id}</small>
                </td>
                <td>{post.owner}</td>
                <td>{post.updatedAt}</td>
                <td>
                  <span className={`dashboard-chip dashboard-chip--${post.status.toLowerCase().replace(/\s+/g, '-')}`}>{post.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
