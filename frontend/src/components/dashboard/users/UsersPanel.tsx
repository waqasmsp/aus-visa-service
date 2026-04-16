import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardEmptyState, DashboardErrorState, DashboardLoadingSkeleton, DashboardNoResultsState } from '../common/asyncUi';
import { useDashboardNotifications } from '../common/DashboardNotificationsProvider';
import { useDashboardTableState } from '../common/useDashboardTableState';
import { ConfirmActionModal } from '../common/ConfirmActionModal';
import { DashboardQueryState } from '../../../types/dashboard/query';
import { DashboardUserRole } from '../../../types/dashboard/applications';
import { PortalUser, UserImportReport, UserImportRow, UsersFilters } from '../../../types/dashboard/users';
import { usersService } from '../../../services/dashboard/users.service';
import { extractApiErrorMessage } from '../../../services/dashboard/async';
import { canPerform } from '../../../services/dashboard/authPolicy';
import { UsersFilterBar } from './UsersFilterBar';
import { UsersTable } from './UsersTable';
import { UserDetailDrawer } from './UserDetailDrawer';
import { UserEditorFormModel, UserEditorModal } from './UserEditorModal';
import { DataTablePaginationFooter } from '../common/DataTablePrimitives';

type Props = {
  role: DashboardUserRole;
  basePath: string;
};

const defaultFilters: UsersFilters = {
  segment: 'All',
  purchase: 'All',
  source: 'All',
  country: 'All',
  lastSeenDays: 'All',
  spendBand: 'All',
  includeDeleted: 'false'
};

const parseCsvRows = (csv: string): UserImportRow[] => {
  const lines = csv.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) return [];

  return lines.slice(1).map((line) => {
    const [full_name, email, phone, segment, purchased, source, country, role_scope] = line.split(',').map((value) => value.trim());
    return {
      full_name,
      email,
      phone,
      segment: segment as 'registered' | 'lead',
      purchased: purchased.toLowerCase() === 'true' || purchased.toLowerCase() === 'purchased',
      source,
      country,
      role_scope: role_scope as 'admin' | 'manager' | 'editor'
    };
  });
};

export function UsersPanel({ role, basePath }: Props) {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);
  const [editorSeedSegment, setEditorSeedSegment] = useState<'registered' | 'lead'>('registered');
  const [showEditor, setShowEditor] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importCsv, setImportCsv] = useState('full_name,email,phone,segment,purchased,source,country,role_scope');
  const [importReport, setImportReport] = useState<UserImportReport | null>(null);
  const [toggleTarget, setToggleTarget] = useState<{ user: PortalUser; nextActive: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortalUser | null>(null);
  const { notifyError, notifyInfo, notifySuccess, formatNotificationMessage } = useDashboardNotifications();

  const table = useDashboardTableState<UsersFilters>({
    basePath,
    defaultState: {
      search: '',
      pagination: { page: 1, pageSize: 20 },
      filters: defaultFilters
    } as DashboardQueryState<UsersFilters>
  });

  const permissions = useMemo(
    () => ({
      canMutate: canPerform(role, 'users', 'edit') || canPerform(role, 'users', 'create'),
      canDelete: canPerform(role, 'users', 'delete'),
      canAssignAdmin: role === 'admin'
    }),
    [role]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await usersService.list({
        page: table.state.pagination.page,
        page_size: table.state.pagination.pageSize,
        search: table.state.search,
        filters: table.state.filters
      });
      setUsers(response.items);
      setTotalUsersCount(response.meta.total);
    } catch (loadError) {
      setError(extractApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [table.state]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const registeredCount = users.filter((item) => item.segment === 'Registered').length;
  const leadCount = users.filter((item) => item.segment === 'Lead').length;
  const deletedCount = users.filter((item) => item.status === 'deleted').length;

  const saveUser = async (payload: UserEditorFormModel) => {
    try {
      if (editingUser) {
        await usersService.update(
          editingUser.id,
          {
            full_name: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            segment: payload.segment,
            purchased: payload.purchased,
            source: payload.source,
            country: payload.country,
            role_scope: payload.roleScope
          },
          role
        );
      } else {
        await usersService.create(
          {
            full_name: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            segment: payload.segment,
            purchased: payload.purchased,
            source: payload.source,
            country: payload.country,
            role_scope: payload.roleScope
          },
          role
        );
      }
      notifySuccess(formatNotificationMessage({ entity: 'user', action: editingUser ? 'edit' : 'create', result: 'success', id: editingUser?.id }, editingUser ? 'User updated.' : 'User created.'));
      setShowEditor(false);
      setEditingUser(null);
      await loadUsers();
    } catch (mutationError) {
      const message = extractApiErrorMessage(mutationError);
      setError(message);
      notifyError(formatNotificationMessage({ entity: 'user', action: editingUser ? 'edit' : 'create', result: 'error', id: editingUser?.id }, message));
    }
  };

  const toggleActive = async (user: PortalUser, active: boolean) => {
    try {
      await usersService.setActive(user.id, active, role);
      notifyInfo(formatNotificationMessage({ entity: 'user', action: 'status_change', result: 'success', id: user.id }, active ? 'User reactivated.' : 'User deactivated.'));
      await loadUsers();
    } catch (mutationError) {
      const message = extractApiErrorMessage(mutationError);
      setError(message);
      notifyError(formatNotificationMessage({ entity: 'user', action: 'status_change', result: 'error', id: user.id }, message));
    }
  };

  const softDelete = async (user: PortalUser) => {
    try {
      await usersService.softDelete(user.id, role, {
        reason: `Deleted from dashboard by ${role}`,
        secondApprover: 'compliance@ausvisaservice.com'
      });
      notifySuccess(formatNotificationMessage({ entity: 'user', action: 'delete', result: 'success', id: user.id }, 'User deleted.'));
      await loadUsers();
    } catch (mutationError) {
      const message = extractApiErrorMessage(mutationError);
      setError(message);
      notifyError(formatNotificationMessage({ entity: 'user', action: 'delete', result: 'error', id: user.id }, message));
    }
  };

  const exportCsv = async () => {
    try {
      const csv = await usersService.exportCsv(table.state.filters);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      notifyInfo(formatNotificationMessage({ entity: 'user', action: 'export', result: 'success' }, 'Users CSV export started.'));
    } catch (mutationError) {
      const message = extractApiErrorMessage(mutationError);
      setError(message);
      notifyError(formatNotificationMessage({ entity: 'user', action: 'export', result: 'error' }, message));
    }
  };

  const importFromCsv = async () => {
    try {
      const rows = parseCsvRows(importCsv);
      const report = await usersService.importRows(rows, role);
      setImportReport(report);
      notifyInfo(formatNotificationMessage({ entity: 'user', action: 'import', result: 'success' }, `Imported ${report.importedCount} row(s), rejected ${report.rejectedCount}.`));
      await loadUsers();
    } catch (mutationError) {
      const message = extractApiErrorMessage(mutationError);
      setError(message);
      notifyError(formatNotificationMessage({ entity: 'user', action: 'import', result: 'error' }, message));
    }
  };

  return (
    <section className="dashboard-stack">
      {loading ? <DashboardLoadingSkeleton rows={4} /> : null}
      {!loading && error ? <DashboardErrorState message={error} onRetry={() => void loadUsers()} /> : null}
      {!loading && !error ? (
        <>
          <div className="dashboard-kpi-grid dashboard-kpi-grid--short">
            <article className="dashboard-kpi-card"><p>Registered Users</p><strong>{registeredCount}</strong><span>Profiles</span></article>
            <article className="dashboard-kpi-card"><p>Lead Records</p><strong>{leadCount}</strong><span>Potential clients</span></article>
            <article className="dashboard-kpi-card"><p>Soft Deleted</p><strong>{deletedCount}</strong><span>Archived records</span></article>
          </div>

          <article className="dashboard-panel">
            <UsersFilterBar
              search={table.state.search}
              filters={table.state.filters}
              users={users}
              canMutate={permissions.canMutate}
              onSearchChange={table.setSearch}
              onFilterChange={table.setFilter}
              onCreateUser={(segment) => {
                setEditingUser(null);
                setEditorSeedSegment(segment);
                setShowEditor(true);
              }}
              onImportCsv={() => setShowImportPanel((prev) => !prev)}
              onExportCsv={() => void exportCsv()}
            />

            {showImportPanel ? (
              <div className="dashboard-panel dashboard-panel--accent">
                <div className="dashboard-panel__header dashboard-panel__header--spread">
                  <h3>CSV import workflow</h3>
                  <button type="button" onClick={() => setShowImportPanel(false)}>Close</button>
                </div>
                <p>Schema: full_name,email,phone,segment,purchased,source,country,role_scope</p>
                <textarea value={importCsv} onChange={(event) => setImportCsv(event.target.value)} rows={6} style={{ width: '100%' }} />
                <div className="dashboard-actions-inline">
                  <button type="button" onClick={() => void importFromCsv()} disabled={!permissions.canMutate}>Validate + Import</button>
                </div>
                {importReport ? (
                  <div>
                    <p>Imported: {importReport.importedCount} · Rejected fields: {importReport.rejectedCount}</p>
                    {importReport.errors.length ? (
                      <ul className="dashboard-simple-list">
                        {importReport.errors.map((rowError, index) => (
                          <li key={`${rowError.row}-${rowError.field}-${index}`}>Row {rowError.row} · {rowError.field}: {rowError.message}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No row-level schema errors.</p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            {users.length === 0 ? (
              table.state.search || Object.values(table.state.filters).some((value) => value && value !== 'All' && value !== 'false') ? (
                <DashboardNoResultsState
                  description="No users match your filters."
                  onReset={() => table.setState((prev) => ({ ...prev, search: '', filters: defaultFilters, pagination: { ...prev.pagination, page: 1 } }))}
                />
              ) : (
                <DashboardEmptyState title="No users found" description="Try broadening your filter criteria." />
              )
            ) : (
              <UsersTable
                users={users}
                canManage={permissions.canMutate}
                canDelete={permissions.canDelete}
                onView={setSelectedUser}
                onEdit={(user) => {
                  setEditingUser(user);
                  setShowEditor(true);
                }}
                onToggleActive={(user, active) => setToggleTarget({ user, nextActive: active })}
                onDelete={(user) => setDeleteTarget(user)}
              />
            )}
            <DataTablePaginationFooter
              page={table.state.pagination.page}
              pageSize={table.state.pagination.pageSize}
              total={totalUsersCount}
              onPageChange={table.setPage}
              onPageSizeChange={table.setPageSize}
            />
          </article>

          {showEditor ? (
            <UserEditorModal
              editingUser={editingUser}
              preferredSegment={editorSeedSegment}
              canSetAdminRole={permissions.canAssignAdmin}
              onClose={() => {
                setShowEditor(false);
                setEditingUser(null);
              }}
              onSubmit={(payload) => void saveUser(payload)}
            />
          ) : null}
          {selectedUser ? <UserDetailDrawer user={selectedUser} onClose={() => setSelectedUser(null)} /> : null}
          <ConfirmActionModal
            open={Boolean(toggleTarget)}
            variant={toggleTarget?.nextActive ? 'info' : 'warning'}
            title={toggleTarget?.nextActive ? 'Reactivate user account?' : 'Deactivate user account?'}
            description={toggleTarget?.nextActive ? 'This user will regain access to dashboard features.' : 'The user will lose dashboard access until reactivated.'}
            entityName={toggleTarget?.user.fullName ?? 'Unknown user'}
            irreversibleWarning={toggleTarget?.nextActive ? 'This action is auditable and will be logged.' : 'Warning: this may interrupt active internal workflows.'}
            confirmLabel={toggleTarget?.nextActive ? 'Reactivate user' : 'Deactivate user'}
            onCancel={() => setToggleTarget(null)}
            onConfirm={async () => {
              if (!toggleTarget) return;
              await toggleActive(toggleTarget.user, toggleTarget.nextActive);
              setToggleTarget(null);
            }}
            preventCloseWhilePending={!toggleTarget?.nextActive}
          />
          <ConfirmActionModal
            open={Boolean(deleteTarget)}
            variant="danger"
            title="Delete user record permanently?"
            description="This will remove the user from active records and enforce policy audit annotations."
            entityName={deleteTarget?.fullName ?? 'Unknown user'}
            irreversibleWarning="This action is irreversible from this dashboard view. Continue only if you are certain."
            confirmLabel="Delete user"
            onCancel={() => setDeleteTarget(null)}
            onConfirm={async () => {
              if (!deleteTarget) return;
              await softDelete(deleteTarget);
              setDeleteTarget(null);
            }}
            preventCloseWhilePending
          />
        </>
      ) : null}
    </section>
  );
}
