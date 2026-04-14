import { useState } from 'react';

type DashboardRole = 'admin' | 'manager' | 'user';
type BlogWorkflowStatus = 'Draft' | 'In Review' | 'Scheduled' | 'Published' | 'Archived';

type RevisionEntry = {
  id: string;
  version: string;
  editor: string;
  timestamp: string;
  fromStatus: BlogWorkflowStatus;
  toStatus: BlogWorkflowStatus;
};

type ReviewComment = {
  id: string;
  author: string;
  role: 'Manager' | 'Admin' | 'Editor';
  createdAt: string;
  note: string;
};

type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
};

export function BlogReviewPanel({
  role,
  canSubmitReview,
  canApproveReview,
  canPublish,
  canArchive,
  canDelete,
  canOverride,
  canRestoreRevision,
  revisions,
  comments,
  auditEvents,
  onRestoreRevision,
  onAddComment
}: {
  role: DashboardRole;
  canSubmitReview: boolean;
  canApproveReview: boolean;
  canPublish: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canOverride: boolean;
  canRestoreRevision: boolean;
  revisions: RevisionEntry[];
  comments: ReviewComment[];
  auditEvents: AuditEvent[];
  onRestoreRevision: (revisionId: string) => void;
  onAddComment: (note: string) => void;
}) {
  const [note, setNote] = useState('');

  return (
    <article className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h2>Review & Publishing</h2>
        <small>{role.toUpperCase()} workflow</small>
      </div>
      <ul className="dashboard-simple-list">
        <li>Submit for review: {canSubmitReview ? 'Allowed' : 'Restricted'}</li>
        <li>Approve review: {canApproveReview ? 'Allowed' : 'Restricted'}</li>
        <li>Publish: {canPublish ? 'Allowed' : 'Restricted'}</li>
        <li>Archive: {canArchive ? 'Allowed' : 'Restricted'}</li>
        <li>Admin override: {canOverride ? 'Allowed' : 'Restricted'}</li>
        <li>Delete: {canDelete ? 'Allowed' : 'Restricted'}</li>
      </ul>

      <div className="dashboard-blog-review-grid">
        <section>
          <h3>Revision history</h3>
          <ul className="dashboard-timeline">
            {revisions.map((revision) => (
              <li key={revision.id}>
                <strong>
                  {revision.version} · {revision.editor}
                </strong>
                <span>
                  {revision.timestamp} · {revision.fromStatus} → {revision.toStatus}
                </span>
                <button
                  type="button"
                  className="dashboard-ghost-button"
                  disabled={!canRestoreRevision}
                  onClick={() => onRestoreRevision(revision.id)}
                >
                  Restore revision
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Internal notes</h3>
          <ul className="dashboard-timeline">
            {comments.map((comment) => (
              <li key={comment.id}>
                <strong>
                  {comment.author} · {comment.role}
                </strong>
                <span>{comment.createdAt}</span>
                <p>{comment.note}</p>
              </li>
            ))}
          </ul>
          <label className="dashboard-settings-grid-label">
            <span>Add review note</span>
            <textarea rows={3} placeholder="Add internal guidance for reviewers." value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <button
            type="button"
            className="dashboard-primary-button"
            onClick={() => {
              if (!note.trim()) return;
              onAddComment(note.trim());
              setNote('');
            }}
          >
            Save note
          </button>
        </section>
      </div>

      <section>
        <h3>Post activity timeline</h3>
        <ul className="dashboard-timeline">
          {auditEvents.map((event) => (
            <li key={event.id}>
              <strong>{event.action}</strong>
              <span>
                {event.actor} · {event.timestamp}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
