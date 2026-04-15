import { VisaApplication } from '../../../types/dashboard/applications';

type Props = {
  application: VisaApplication;
  onClose: () => void;
};

export function ApplicationDetailsDrawer({ application, onClose }: Props) {
  return (
    <aside className="dashboard-panel" aria-label={`Details for ${application.id}`}>
      <div className="dashboard-panel__header">
        <h3>{application.id} details</h3>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <div className="dashboard-grid dashboard-grid--2">
        <article>
          <h4>Timeline</h4>
          <ul className="dashboard-simple-list">
            {application.timeline.map((event) => <li key={event.id}>{event.label} · {event.actor} · {event.occurredAt}</li>)}
          </ul>
        </article>
        <article>
          <h4>Notes</h4>
          <ul className="dashboard-simple-list">
            {application.notes.length === 0 ? <li>No notes yet.</li> : application.notes.map((note) => <li key={note.id}>{note.author}: {note.message}</li>)}
          </ul>
        </article>
        <article>
          <h4>Document summary</h4>
          <ul className="dashboard-simple-list">
            <li>Total: {application.documentSummary.total}</li>
            <li>Verified: {application.documentSummary.verified}</li>
            <li>Pending: {application.documentSummary.pending}</li>
            <li>Rejected: {application.documentSummary.rejected}</li>
          </ul>
        </article>
        <article>
          <h4>Audit events</h4>
          <ul className="dashboard-simple-list">
            {application.auditEvents.map((event) => <li key={event.id}>{event.action} · {event.actor} · {event.timestamp}</li>)}
          </ul>
        </article>
      </div>
    </aside>
  );
}
