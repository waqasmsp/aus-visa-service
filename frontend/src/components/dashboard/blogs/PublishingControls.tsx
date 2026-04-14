type PublishingControlsProps = {
  canSubmitReview: boolean;
  canPublish: boolean;
  canArchive: boolean;
  scheduleAt: string;
  timezone: string;
  dirty: boolean;
  status: string;
  onScheduleChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onAction: (action: 'save-draft' | 'submit-review' | 'schedule' | 'publish-now' | 'archive' | 'reset') => void;
};

export function PublishingControls({
  canSubmitReview,
  canPublish,
  canArchive,
  scheduleAt,
  timezone,
  dirty,
  status,
  onScheduleChange,
  onTimezoneChange,
  onAction
}: PublishingControlsProps) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h2>Publishing controls</h2>
        <small>Workflow status: {status}</small>
      </div>

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
          disabled={!canPublish || !scheduleAt}
          onClick={() => onAction('schedule')}
        >
          Confirm schedule
        </button>

        <button
          type="button"
          className="dashboard-primary-button"
          disabled={!canPublish}
          onClick={() => onAction('publish-now')}
        >
          Publish now
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
