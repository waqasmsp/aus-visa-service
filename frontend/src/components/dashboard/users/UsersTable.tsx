import { PortalUser } from '../../../types/dashboard/users';
import { DataTableColumn, DataTableColumnVisibility, DataTableRowActions, useDataTablePreferences } from '../common/DataTablePrimitives';

type Props = {
  users: PortalUser[];
  canManage: boolean;
  canDelete: boolean;
  onView: (user: PortalUser) => void;
  onEdit: (user: PortalUser) => void;
  onToggleActive: (user: PortalUser, active: boolean) => void;
  onDelete: (user: PortalUser) => void;
};

const columns: DataTableColumn[] = [
  { id: 'user', label: 'User' },
  { id: 'segment', label: 'Segment' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'source', label: 'Source' },
  { id: 'country', label: 'Country' },
  { id: 'spent', label: 'Spent' },
  { id: 'lastSeen', label: 'Last Seen' },
  { id: 'status', label: 'Status' },
  { id: 'role', label: 'Role Scope' },
  { id: 'actions', label: 'Actions' }
];

export function UsersTable({ users, canManage, canDelete, onView, onEdit, onToggleActive, onDelete }: Props) {
  const { visibleColumnIds, toggleColumn, resetColumns } = useDataTablePreferences('dashboard-table-users', columns.map((column) => column.id));
  const isVisible = (columnId: string) => visibleColumnIds.includes(columnId);

  return (
    <>
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <small>Table preferences are saved to this browser.</small>
        <DataTableColumnVisibility columns={columns} visibleColumnIds={visibleColumnIds} onToggle={toggleColumn} onReset={resetColumns} />
      </div>
      <div className="dashboard-table-wrap dashboard-table-wrap--sticky">
        <table className="dashboard-table" aria-label="Users data table">
          <thead className="dashboard-table__thead--sticky">
            <tr>
              {columns.filter((column) => isVisible(column.id)).map((column) => <th key={column.id} scope="col">{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                {isVisible('user') ? (
                  <th scope="row">
                    <strong>{user.fullName}</strong>
                    <small>{user.email}</small>
                    <small>{user.phone}</small>
                  </th>
                ) : null}
                {isVisible('segment') ? <td><span className={`dashboard-chip dashboard-chip--${user.segment.toLowerCase()}`}>{user.segment}</span></td> : null}
                {isVisible('purchase') ? <td><span className={`dashboard-chip dashboard-chip--${user.purchased ? 'purchased' : 'abandoned'}`}>{user.purchased ? 'Purchased' : 'Abandoned'}</span></td> : null}
                {isVisible('source') ? <td>{user.source}</td> : null}
                {isVisible('country') ? <td>{user.country}</td> : null}
                {isVisible('spent') ? <td>${user.spentUsd}</td> : null}
                {isVisible('lastSeen') ? <td>{user.lastSeen}</td> : null}
                {isVisible('status') ? <td><span className={`dashboard-chip dashboard-chip--${user.status}`}>{user.status}</span></td> : null}
                {isVisible('role') ? <td>{user.roleScope}</td> : null}
                {isVisible('actions') ? (
                  <td>
                    <DataTableRowActions>
                      <button type="button" onClick={() => onView(user)}>Timeline</button>
                      <button type="button" onClick={() => onEdit(user)} disabled={!canManage}>Edit</button>
                      {user.status === 'active' ? (
                        <button type="button" onClick={() => onToggleActive(user, false)} disabled={!canManage}>Deactivate</button>
                      ) : (
                        <button type="button" onClick={() => onToggleActive(user, true)} disabled={!canManage || user.status === 'deleted'}>Reactivate</button>
                      )}
                      <button type="button" className="danger" onClick={() => onDelete(user)} disabled={!canDelete || user.status === 'deleted'}>Soft Delete</button>
                    </DataTableRowActions>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
