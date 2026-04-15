import { PortalUser } from '../../../types/dashboard/users';

type Props = {
  user: PortalUser;
  onClose: () => void;
};

export function UserDetailDrawer({ user, onClose }: Props) {
  const grouped = {
    activity: user.timeline.filter((event) => event.type === 'activity'),
    applications: user.timeline.filter((event) => event.type === 'application'),
    payments: user.timeline.filter((event) => event.type === 'payment'),
    support: user.timeline.filter((event) => event.type === 'support')
  };

  return (
    <aside className="dashboard-panel" aria-label={`${user.fullName} timeline`}>
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <h3>{user.fullName} timeline</h3>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <div className="dashboard-grid dashboard-grid--2">
        <article>
          <h4>Activity</h4>
          <ul className="dashboard-simple-list">
            {grouped.activity.length === 0 ? <li>No activity events.</li> : grouped.activity.map((event) => <li key={event.id}>{event.label} · {event.occurredAt} · {event.actor}</li>)}
          </ul>
        </article>
        <article>
          <h4>Application History</h4>
          <ul className="dashboard-simple-list">
            {grouped.applications.length === 0 ? <li>No application records.</li> : grouped.applications.map((event) => <li key={event.id}>{event.label} · {event.occurredAt} · {event.actor}</li>)}
          </ul>
        </article>
        <article>
          <h4>Payments</h4>
          <ul className="dashboard-simple-list">
            {grouped.payments.length === 0 ? <li>No payment activity.</li> : grouped.payments.map((event) => <li key={event.id}>{event.label} · {event.occurredAt}</li>)}
          </ul>
        </article>
        <article>
          <h4>Support / Contact</h4>
          <ul className="dashboard-simple-list">
            {grouped.support.length === 0 ? <li>No support records.</li> : grouped.support.map((event) => <li key={event.id}>{event.label} · {event.occurredAt}</li>)}
          </ul>
        </article>
      </div>
    </aside>
  );
}
