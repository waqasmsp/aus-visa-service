import { PortalUser } from '../../../types/dashboard/users';

type Props = {
  users: PortalUser[];
  canManage: boolean;
  canDelete: boolean;
  onView: (user: PortalUser) => void;
  onEdit: (user: PortalUser) => void;
  onToggleActive: (user: PortalUser, active: boolean) => void;
  onDelete: (user: PortalUser) => void;
};

export function UsersTable({ users, canManage, canDelete, onView, onEdit, onToggleActive, onDelete }: Props) {
  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Segment</th>
            <th>Purchase</th>
            <th>Source</th>
            <th>Country</th>
            <th>Spent</th>
            <th>Last Seen</th>
            <th>Status</th>
            <th>Role Scope</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <strong>{user.fullName}</strong>
                <small>{user.email}</small>
                <small>{user.phone}</small>
              </td>
              <td><span className={`dashboard-chip dashboard-chip--${user.segment.toLowerCase()}`}>{user.segment}</span></td>
              <td><span className={`dashboard-chip dashboard-chip--${user.purchased ? 'purchased' : 'abandoned'}`}>{user.purchased ? 'Purchased' : 'Abandoned'}</span></td>
              <td>{user.source}</td>
              <td>{user.country}</td>
              <td>${user.spentUsd}</td>
              <td>{user.lastSeen}</td>
              <td><span className={`dashboard-chip dashboard-chip--${user.status}`}>{user.status}</span></td>
              <td>{user.roleScope}</td>
              <td>
                <div className="dashboard-actions-inline">
                  <button type="button" onClick={() => onView(user)}>Timeline</button>
                  <button type="button" onClick={() => onEdit(user)} disabled={!canManage}>Edit</button>
                  {user.status === 'active' ? (
                    <button type="button" onClick={() => onToggleActive(user, false)} disabled={!canManage}>Deactivate</button>
                  ) : (
                    <button type="button" onClick={() => onToggleActive(user, true)} disabled={!canManage || user.status === 'deleted'}>Reactivate</button>
                  )}
                  <button type="button" className="danger" onClick={() => onDelete(user)} disabled={!canDelete || user.status === 'deleted'}>Soft Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
