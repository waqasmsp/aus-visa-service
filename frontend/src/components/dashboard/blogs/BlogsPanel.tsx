import { useMemo, useState } from 'react';
import { Card } from '../../primitives/Card';
import { PrimaryButton } from '../../primitives/PrimaryButton';
import { ConfirmActionModal } from '../common/ConfirmActionModal';
import { useDashboardNotifications } from '../common/DashboardNotificationsProvider';

type DashboardRole = 'admin' | 'manager' | 'user';
type BlogAction = 'create' | 'edit' | 'submit-review' | 'approve-review' | 'publish' | 'archive' | 'delete' | 'settings' | 'override';
type BlogWorkflowStatus = 'Draft' | 'In Review' | 'Scheduled' | 'Published' | 'Archived';
type BulkActionType = 'schedule' | 'publish' | 'archive' | 'apply-category' | 'apply-tag';

type BlogRow = {
  id: string;
  title: string;
  owner: string;
  updatedAt: string;
  status: BlogWorkflowStatus;
  category: string;
  tags: string[];
  publishAt: string;
  seoScore: number | null;
  ctr?: number | null;
  impressions?: number | null;
  conversionAttribution?: number | null;
};

const EMPTY_PLACEHOLDER = '—';

const formatRatio = (value?: number | null): string => {
  if (value == null || Number.isNaN(value)) {
    return EMPTY_PLACEHOLDER;
  }
  return `${(value * 100).toFixed(1)}%`;
};

const formatNumber = (value?: number | null): string => {
  if (value == null || Number.isNaN(value)) {
    return EMPTY_PLACEHOLDER;
  }
  return value.toLocaleString();
};

export function BlogsPanel({
  role,
  actions,
  posts,
  loading = false,
  error = null,
  onCreate,
  onEdit,
  onArchive,
  onBulkAction,
  onDelete
}: {
  role: DashboardRole;
  actions: BlogAction[];
  posts: BlogRow[];
  loading?: boolean;
  error?: string | null;
  onCreate?: () => void;
  onEdit?: (postId: string) => void;
  onArchive?: (postId: string) => void;
  onBulkAction?: (payload: { action: BulkActionType; postIds: string[]; value?: string }) => Promise<string | void> | string | void;
  onDelete?: (postId: string) => Promise<string | void> | string | void;
}) {
  const canEdit = actions.includes('edit');
  const canArchive = actions.includes('archive');
  const canDelete = actions.includes('delete');
  const canPublish = actions.includes('publish');

  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkActionType>('publish');
  const [bulkValue, setBulkValue] = useState('');
  const [trashLog, setTrashLog] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<BlogRow | null>(null);
  const { notifyError, notifyInfo, formatNotificationMessage } = useDashboardNotifications();

  const allSelected = useMemo(
    () => posts.length > 0 && posts.every((post) => selectedPostIds.includes(post.id)),
    [posts, selectedPostIds]
  );

  const toggleSelectAll = () => {
    setSelectedPostIds(allSelected ? [] : posts.map((post) => post.id));
  };

  const toggleSelected = (postId: string) => {
    setSelectedPostIds((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]
    );
  };

  const runBulkAction = async () => {
    if (!selectedPostIds.length || !onBulkAction) {
      return;
    }
    const outcome = await onBulkAction({
      action: bulkAction,
      postIds: selectedPostIds,
      value: bulkValue.trim() ? bulkValue.trim() : undefined
    });
    notifyInfo(formatNotificationMessage({ entity: 'blog', action: bulkAction === 'publish' || bulkAction === 'archive' || bulkAction === 'schedule' ? 'status_change' : 'edit', result: 'success' }, outcome ?? `Bulk action "${bulkAction}" applied to ${selectedPostIds.length} post(s).`));
  };

  const runDeleteWorkflow = async (post: BlogRow) => {
    const dependencyCount = post.status === 'Published' || post.status === 'In Review' ? 1 : 0;
    if (dependencyCount > 0) {
      notifyError(formatNotificationMessage({ entity: 'blog', action: 'delete', result: 'error', id: post.id }, `Delete blocked: ${post.title} has ${dependencyCount} active dependency. Unpublish/review-close before delete.`));
      return;
    }

    if (post.status !== 'Archived') {
      notifyInfo(formatNotificationMessage({ entity: 'blog', action: 'status_change', result: 'info', id: post.id }, `Archive-first policy: ${post.title} must be archived before moving to trash.`));
      if (onArchive) {
        onArchive(post.id);
      }
      return;
    }

    const recoveryUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    setTrashLog((current) => ({ ...current, [post.id]: recoveryUntil }));
    const outcome = onDelete ? await onDelete(post.id) : undefined;
    notifyInfo(formatNotificationMessage({ entity: 'blog', action: 'delete', result: 'success', id: post.id }, outcome ?? `${post.title} moved to trash. Recoverable until ${new Date(recoveryUntil).toLocaleDateString('en-US')}.`));
  };

  return (
    <Card className="dashboard-panel dashboard-blog-list-panel" as="article">
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

      <div className="dashboard-actions-inline" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={bulkAction} onChange={(event) => setBulkAction(event.target.value as BulkActionType)} aria-label="Bulk action type">
          <option value="publish">Bulk publish</option>
          <option value="schedule">Bulk schedule</option>
          <option value="archive">Bulk archive</option>
          <option value="apply-category">Apply category</option>
          <option value="apply-tag">Apply tag</option>
        </select>
        <input
          value={bulkValue}
          onChange={(event) => setBulkValue(event.target.value)}
          placeholder="Optional category, tag, or schedule datetime"
          aria-label="Bulk action value"
        />
        <button type="button" onClick={() => void runBulkAction()} disabled={selectedPostIds.length === 0}>
          Apply to {selectedPostIds.length || 0}
        </button>
      </div>

      {loading ? <p className="dashboard-panel__note">Loading dashboard posts...</p> : null}
      {error ? <p className="dashboard-auth__message is-error">{error}</p> : null}

      <div className="dashboard-table-wrap dashboard-blog-list-table-wrap">
        <table className="dashboard-table dashboard-blog-list-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all posts" />
              </th>
              <th>Post</th>
              <th>Owner</th>
              <th>Category / Tags</th>
              <th>Publish Date</th>
              <th>SEO Score</th>
              <th>CTR</th>
              <th>Impressions</th>
              <th>Conversion</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !error && posts.length === 0 ? (
              <tr>
                <td colSpan={11}>No posts available for the current filter.</td>
              </tr>
            ) : null}
            {posts.map((post) => (
              <tr key={post.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedPostIds.includes(post.id)}
                    onChange={() => toggleSelected(post.id)}
                    aria-label={`Select ${post.title}`}
                  />
                </td>
                <td>
                  <strong>{post.title}</strong>
                  <small>{post.id}</small>
                  {trashLog[post.id] ? <small>Trash recovery window: {new Date(trashLog[post.id]).toLocaleDateString('en-US')}</small> : null}
                </td>
                <td>
                  {post.owner}
                  <small>{post.updatedAt}</small>
                </td>
                <td>
                  <strong>{post.category}</strong>
                  <small>{post.tags.join(', ') || EMPTY_PLACEHOLDER}</small>
                </td>
                <td>{post.publishAt}</td>
                <td>{post.seoScore ?? EMPTY_PLACEHOLDER}</td>
                <td>{formatRatio(post.ctr)}</td>
                <td>{formatNumber(post.impressions)}</td>
                <td>{formatRatio(post.conversionAttribution)}</td>
                <td>
                  <span className={`dashboard-chip dashboard-chip--${post.status.toLowerCase().replace(/\s+/g, '-')}`}>{post.status}</span>
                </td>
                <td>
                  <div className="dashboard-actions-inline">
                    {canEdit ? <button type="button" onClick={() => onEdit?.(post.id)}>Edit</button> : null}
                    {canPublish ? <button type="button">Review</button> : null}
                    {canArchive ? <button type="button" onClick={() => onArchive?.(post.id)}>Archive</button> : null}
                    {canDelete ? <button type="button" className="danger" onClick={() => setDeleteTarget(post)}>Delete</button> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dashboard-blog-list-cta">
        <PrimaryButton type="button" onClick={onCreate} disabled={!actions.includes('create')}>Create new post</PrimaryButton>
      </div>

      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        variant="danger"
        title="Delete blog post?"
        description="Deleting a blog post moves it to trash with a limited recovery window."
        entityName={deleteTarget?.title ?? 'Unknown post'}
        irreversibleWarning="This is irreversible after the trash recovery window expires."
        confirmLabel="Delete post"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await runDeleteWorkflow(deleteTarget);
          setDeleteTarget(null);
        }}
        preventCloseWhilePending
      />
    </Card>
  );
}
