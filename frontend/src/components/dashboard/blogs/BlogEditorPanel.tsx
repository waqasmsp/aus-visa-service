type DashboardRole = 'admin' | 'manager' | 'user';

export function BlogEditorPanel({
  role,
  canCreate,
  canEdit,
  canManageSettings
}: {
  role: DashboardRole;
  canCreate: boolean;
  canEdit: boolean;
  canManageSettings: boolean;
}) {
  return (
    <article className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h2>Blog Editor</h2>
        <small>{role === 'admin' ? 'Blog Management' : 'Blog Editorial'}</small>
      </div>
      <ul className="dashboard-simple-list">
        <li>Create drafts: {canCreate ? 'Allowed' : 'Restricted'}</li>
        <li>Edit content: {canEdit ? 'Allowed' : 'Restricted'}</li>
        <li>SEO/settings controls: {canManageSettings ? 'Allowed' : 'Restricted'}</li>
      </ul>
    </article>
  );
}
