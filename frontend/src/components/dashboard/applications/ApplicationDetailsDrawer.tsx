import { useId, useRef } from 'react';
import { VisaApplication } from '../../../types/dashboard/applications';
import { DashboardButton } from '../common/DashboardButton';
import { useFocusTrap } from '../common/useFocusTrap';

type Props = {
  application: VisaApplication;
  onClose: () => void;
};

export function ApplicationDetailsDrawer({ application, onClose }: Props) {
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  useFocusTrap({ active: true, containerRef: drawerRef, initialFocusRef: closeRef, onClose });

  return (
    <aside ref={drawerRef} className="dashboard-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <div className="dashboard-panel__header">
        <h3 id={titleId}>{application.id} details</h3>
        <DashboardButton ref={closeRef} type="button" variant="ghost" size="sm" onClick={onClose}>Close</DashboardButton>
      </div>
      <p id={descriptionId} className="sr-only">Application timeline, notes, document summary, and audit events.</p>
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
