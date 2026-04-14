type PublishChecklist = {
  title: boolean;
  slug: boolean;
  content: boolean;
  featuredImageAlt: boolean;
  metaDescription: boolean;
};

type PublishingControlsProps = {
  canSubmitReview: boolean;
  canApproveReview: boolean;
  canPublish: boolean;
  canArchive: boolean;
  canOverride: boolean;
  scheduleAt: string;
  timezone: string;
  dirty: boolean;
  status: string;
  checklist: PublishChecklist;
  onScheduleChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onAction: (action: 'save-draft' | 'submit-review' | 'approve-review' | 'schedule' | 'publish-now' | 'archive' | 'override-publish' | 'reset') => void;
};

export function PublishingControls({
  canSubmitReview,
  canApproveReview,
  canPublish,
  canArchive,
  canOverride,
  scheduleAt,
  timezone,
  dirty,
  status,
  checklist,
  onScheduleChange,
  onTimezoneChange,
  onAction
}: PublishingControlsProps) {
  const checklistItems: Array<{ label: string; done: boolean }> = [
    { label: 'Title', done: checklist.title },
    { label: 'Slug', done: checklist.slug },
    { label: 'Content', done: checklist.content },
    { label: 'Featured image alt text', done: checklist.featuredImageAlt },
    { label: 'Meta description', done: checklist.metaDescription }
  ];
  const canPassChecklist = checklistItems.every((item) => item.done);

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h2>Publishing controls</h2>
        <small>Workflow status: {status}</small>
      </div>

      <section className="dashboard-blog-checklist">
        <h3>Publish checklist gate</h3>
        <ul className="dashboard-simple-list">
          {checklistItems.map((item) => (
            <li key={item.label}>{item.done ? '✅' : '❌'} {item.label}</li>
          ))}
        </ul>
      </section>

      <div className="dashboard-blog-actions">
        <button type="button" className="dashboard-primary-button" onClick={() => onAction('save-draft')}>
          Save draft
        </button>

        <button
          type="button"
          className="dashboard-ghost-button"
          disabled={!canSubmitReview}
          onClick={() => onAction('submit-review')}
        >
          Submit for review
        </button>

        <button
          type="button"
          className="dashboard-ghost-button"
          disabled={!canApproveReview}
          onClick={() => onAction('approve-review')}
        >
          Approve review
        </button>

        <label className="dashboard-settings-grid-label">
          <span>Schedule publish</span>
          <input type="datetime-local" value={scheduleAt} onChange={(event) => onScheduleChange(event.target.value)} />
        </label>

        <label className="dashboard-settings-grid-label">
          <span>Timezone</span>
          <select value={timezone} onChange={(event) => onTimezoneChange(event.target.value)}>
            <option value="UTC">UTC</option>
            <option value="Australia/Sydney">Australia/Sydney</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </label>

        <button
          type="button"
          className="dashboard-ghost-button"
          disabled={!canPublish || !scheduleAt || !canPassChecklist}
          onClick={() => onAction('schedule')}
        >
          Confirm schedule
        </button>

        <button
          type="button"
          className="dashboard-primary-button"
          disabled={!canPublish || !canPassChecklist}
          onClick={() => onAction('publish-now')}
        >
          Publish now
        </button>

        <button
          type="button"
          className="dashboard-ghost-button"
          disabled={!canOverride || !canPassChecklist}
          onClick={() => onAction('override-publish')}
        >
          Override publish
        </button>

        <button
          type="button"
          className="dashboard-ghost-button"
          disabled={!canArchive}
          onClick={() => onAction('archive')}
        >
          Archive
        </button>

        <button type="button" className="dashboard-ghost-button" disabled={!dirty} onClick={() => onAction('reset')}>
          Discard unsaved changes
        </button>
      </div>
    </section>
  );
}
