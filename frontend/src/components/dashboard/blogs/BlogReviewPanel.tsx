type DashboardRole = 'admin' | 'manager' | 'user';

export function BlogReviewPanel({
  role,
  canSubmitReview,
  canPublish,
  canArchive,
  canDelete
}: {
  role: DashboardRole;
  canSubmitReview: boolean;
  canPublish: boolean;
  canArchive: boolean;
  canDelete: boolean;
}) {
  return (
    <article className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h2>Review & Publishing</h2>
        <small>{role.toUpperCase()} workflow</small>
      </div>
      <ul className="dashboard-simple-list">
        <li>Submit for review: {canSubmitReview ? 'Allowed' : 'Restricted'}</li>
        <li>Publish: {canPublish ? 'Allowed' : 'Restricted'}</li>
        <li>Archive: {canArchive ? 'Allowed' : 'Restricted'}</li>
        <li>Delete: {canDelete ? 'Allowed' : 'Restricted'}</li>
      </ul>
    </article>
  );
}
