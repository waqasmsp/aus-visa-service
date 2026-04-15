import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardEmptyState, DashboardErrorState, DashboardLoadingSkeleton } from '../common/asyncUi';
import { useDashboardTableState } from '../common/useDashboardTableState';
import { DashboardQueryState } from '../../../types/dashboard/query';
import { DashboardUserRole } from '../../../types/dashboard/applications';
import { PortalUser, UserImportReport, UserImportRow, UsersFilters } from '../../../types/dashboard/users';
import { usersService } from '../../../services/dashboard/users.service';
import { extractApiErrorMessage } from '../../../services/dashboard/async';
import { canPerform, collectDestructiveApproval } from '../../../services/dashboard/authPolicy';
import { UsersFilterBar } from './UsersFilterBar';
import { UsersTable } from './UsersTable';
import { UserDetailDrawer } from './UserDetailDrawer';
import { UserEditorFormModel, UserEditorModal } from './UserEditorModal';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);
  const [editorSeedSegment, setEditorSeedSegment] = useState<'registered' | 'lead'>('registered');
  const [showEditor, setShowEditor] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importCsv, setImportCsv] = useState('full_name,email,phone,segment,purchased,source,country,role_scope');
  const [importReport, setImportReport] = useState<UserImportReport | null>(null);

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
      setShowEditor(false);
      setEditingUser(null);
      await loadUsers();
    } catch (mutationError) {
      setError(extractApiErrorMessage(mutationError));
    }
  };

  const toggleActive = async (user: PortalUser, active: boolean) => {
    const confirmed = window.confirm(`${active ? 'Reactivate' : 'Deactivate'} ${user.fullName}? This action will be recorded.`);
    if (!confirmed) return;
    try {
      await usersService.setActive(user.id, active, role);
      await loadUsers();
    } catch (mutationError) {
      setError(extractApiErrorMessage(mutationError));
    }
  };

  const softDelete = async (user: PortalUser) => {
    const approval = collectDestructiveApproval('users', 'delete', user.fullName);
    if (!approval) return;
    try {
      await usersService.softDelete(user.id, role, approval);
      await loadUsers();
    } catch (mutationError) {
      setError(extractApiErrorMessage(mutationError));
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
    } catch (mutationError) {
      setError(extractApiErrorMessage(mutationError));
    }
  };

  const importFromCsv = async () => {
    try {
      const rows = parseCsvRows(importCsv);
      const report = await usersService.importRows(rows, role);
      setImportReport(report);
      await loadUsers();
    } catch (mutationError) {
      setError(extractApiErrorMessage(mutationError));
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
              <DashboardEmptyState title="No users found" description="Try broadening your filter criteria." />
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
                onToggleActive={(user, active) => void toggleActive(user, active)}
                onDelete={(user) => void softDelete(user)}
              />
            )}
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
        </>
      ) : null}
    </section>
  );
}
