import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardEmptyState, DashboardErrorState, DashboardLoadingSkeleton, DashboardNoResultsState } from '../common/asyncUi';
import { useDashboardNotifications } from '../common/DashboardNotificationsProvider';
import { useDashboardTableState } from '../common/useDashboardTableState';
import { ConfirmActionModal } from '../common/ConfirmActionModal';
import {
  ApplicationFilters,
  ApplicationStatus,
  DashboardUserRole,
  VisaApplication
} from '../../../types/dashboard/applications';
import { DashboardQueryState } from '../../../types/dashboard/query';
import { applicationsService } from '../../../services/dashboard/applications.service';
import { extractApiErrorMessage } from '../../../services/dashboard/async';
import { canPerform } from '../../../services/dashboard/authPolicy';
import { ApplicationsFilterBar } from './ApplicationsFilterBar';
import { ApplicationsBulkActionBar } from './ApplicationsBulkActionBar';
import { ApplicationsTable } from './ApplicationsTable';
import { ApplicationFormModal } from './ApplicationFormModal';
import { ApplicationDetailsDrawer } from './ApplicationDetailsDrawer';
import { DataTablePaginationFooter } from '../common/DataTablePrimitives';

type Props = {
  role: DashboardUserRole;
  basePath: string;
};

const presetStorageKey = 'dashboard-applications-preset-v1';

const defaultFilters: ApplicationFilters = {
  status: 'All',
  priority: 'All',
  assignedAgent: 'All',
  visaType: 'All',
  destinationCountry: 'All',
  submissionDateFrom: '',
  submissionDateTo: '',
  slaRisk: 'All',
  includeDeleted: 'false'
};

export function VisaApplicationsPanel({ role, basePath }: Props) {
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [totalApplicationsCount, setTotalApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingApplication, setEditingApplication] = useState<VisaApplication | null>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [detailsApplication, setDetailsApplication] = useState<VisaApplication | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VisaApplication | null>(null);
  const [activePreset, setActivePreset] = useState(() => (typeof window === 'undefined' ? '' : window.localStorage.getItem(presetStorageKey) ?? ''));
  const { notifyError, notifyInfo, notifySuccess, formatNotificationMessage } = useDashboardNotifications();

  const table = useDashboardTableState<ApplicationFilters>({
    basePath,
    defaultState: {
      search: '',
      pagination: { page: 1, pageSize: 10 },
      sort: { field: 'submitted_on', direction: 'desc' },
      filters: defaultFilters
    } as DashboardQueryState<ApplicationFilters>
  });

  const roleActions = useMemo(() => ({
    canCreate: canPerform(role, 'applications', 'create'),
    canEdit: canPerform(role, 'applications', 'edit'),
    canDelete: canPerform(role, 'applications', 'delete'),
    canBulk: canPerform(role, 'applications', 'edit')
  }), [role]);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await applicationsService.list({
        page: table.state.pagination.page,
        page_size: table.state.pagination.pageSize,
        search: table.state.search,
        sort_field: table.state.sort?.field,
        sort_direction: table.state.sort?.direction,
        filters: table.state.filters
      });
      setApplications(response.items);
      setTotalApplicationsCount(response.meta.total);
      setSelectedIds((prev) => prev.filter((id) => response.items.some((item) => item.id === id)));
    } catch (loadError) {
      setError(extractApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [table.state]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const slaRisk = params.get('slaRisk');
    const priority = params.get('priority');

    if (status && ['Submitted', 'In Review', 'Documents Needed', 'Approved', 'Completed', 'Rejected'].includes(status)) {
      table.setFilter('status', status as ApplicationFilters['status']);
    }
    if (slaRisk && ['Low', 'Medium', 'High', 'Critical'].includes(slaRisk)) {
      table.setFilter('slaRisk', slaRisk as ApplicationFilters['slaRisk']);
    }
    if (priority && ['Low', 'Medium', 'High'].includes(priority)) {
      table.setFilter('priority', priority as ApplicationFilters['priority']);
    }
  }, []);

  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(presetStorageKey, preset);
    }

    if (preset === 'my-queue') {
      table.setFilter('assignedAgent', role === 'user' ? 'Mikael D.' : 'Nadia R.');
    } else if (preset === 'high-priority') {
      table.setFilter('priority', 'High');
    } else if (preset === 'needs-docs') {
      table.setFilter('status', 'Documents Needed');
    }
  };

  const upsertApplication = async (payload: {
    applicant: string;
    email: string;
    visaType: string;
    destinationCountry: string;
    priority: 'Low' | 'Medium' | 'High';
    assignedTo: string;
    status: ApplicationStatus;
  }) => {
    try {
      if (editingApplication) {
        await applicationsService.update(
          editingApplication.id,
          {
            applicant: payload.applicant,
            email: payload.email,
            visa_type: payload.visaType,
            destination_country: payload.destinationCountry,
            priority: payload.priority.toLowerCase() as 'low' | 'medium' | 'high',
            assigned_to: payload.assignedTo,
            status: payload.status.toLowerCase().replace(/\s+/g, '_') as never
          },
          role
        );
      } else {
        await applicationsService.create(
          {
            applicant: payload.applicant,
            email: payload.email,
            visa_type: payload.visaType,
            destination_country: payload.destinationCountry,
            priority: payload.priority.toLowerCase() as 'low' | 'medium' | 'high',
            assigned_to: payload.assignedTo,
            status: payload.status.toLowerCase().replace(/\s+/g, '_') as never,
            owner_id: role === 'user' ? 'user@ausvisaservice.com' : 'manager@ausvisaservice.com'
          },
          role
        );
      }
      notifySuccess(formatNotificationMessage({ entity: 'application', action: editingApplication ? 'edit' : 'create', result: 'success', id: editingApplication?.id }, editingApplication ? 'Application updated.' : 'Application created.'));
      setOpenCreateModal(false);
      setEditingApplication(null);
      await loadApplications();
    } catch (mutationError) {
      const message = extractApiErrorMessage(mutationError);
      setError(message);
      notifyError(formatNotificationMessage({ entity: 'application', action: editingApplication ? 'edit' : 'create', result: 'error', id: editingApplication?.id }, message));
    }
  };

  const softDeleteApplication = async (application: VisaApplication) => {
    try {
      await applicationsService.softDelete(application.id, role, {
        reason: `Deleted via applications dashboard by ${role}`
      });
      notifySuccess(formatNotificationMessage({ entity: 'application', action: 'delete', result: 'success', id: application.id }, 'Application deleted.'));
      await loadApplications();
    } catch (mutationError) {
      const message = extractApiErrorMessage(mutationError);
      setError(message);
      notifyError(formatNotificationMessage({ entity: 'application', action: 'delete', result: 'error', id: application.id }, message));
    }
  };

  const restoreApplication = async (application: VisaApplication) => {
    try {
      await applicationsService.restore(application.id, role);
      notifyInfo(formatNotificationMessage({ entity: 'application', action: 'status_change', result: 'success', id: application.id }, 'Application restored.'));
      await loadApplications();
    } catch (mutationError) {
      const message = extractApiErrorMessage(mutationError);
      setError(message);
      notifyError(formatNotificationMessage({ entity: 'application', action: 'status_change', result: 'error', id: application.id }, message));
    }
  };

  const countByStatus = applications.reduce<Record<ApplicationStatus, number>>(
    (acc, application) => {
      acc[application.status] += 1;
      return acc;
    },
    { Submitted: 0, 'In Review': 0, 'Documents Needed': 0, Approved: 0, Completed: 0, Rejected: 0 }
  );

  return (
    <section className="dashboard-stack">
      {loading ? <DashboardLoadingSkeleton rows={4} /> : null}
      {!loading && error ? <DashboardErrorState message={error} onRetry={() => void loadApplications()} /> : null}
      {!loading && !error ? (
        <>
          <div className="dashboard-kpi-grid">
            {(Object.keys(countByStatus) as ApplicationStatus[]).map((status) => (
              <article key={status} className="dashboard-kpi-card"><p>{status}</p><strong>{countByStatus[status]}</strong><span>Applications</span></article>
            ))}
          </div>
          <ApplicationsBulkActionBar
            selectedCount={selectedIds.length}
            canMutate={roleActions.canBulk}
            onAssignOwner={async (owner) => {
              await applicationsService.bulkAssignOwner({ ids: selectedIds, owner }, role);
              notifyInfo(formatNotificationMessage({ entity: 'application', action: 'status_change', result: 'success' }, `Assigned owner ${owner} to ${selectedIds.length} application(s).`));
              await loadApplications();
            }}
            onUpdateStatus={async (status) => {
              await applicationsService.bulkStatusUpdate({ ids: selectedIds, status }, role);
              notifyInfo(formatNotificationMessage({ entity: 'application', action: 'status_change', result: 'success' }, `Updated status to ${status} for ${selectedIds.length} application(s).`));
              await loadApplications();
            }}
            onExport={async () => {
              const uri = await applicationsService.exportSelected(selectedIds, role);
              notifyInfo(formatNotificationMessage({ entity: 'application', action: 'export', result: 'success' }, `Export ready: ${uri}`));
            }}
          />
          <article className="dashboard-panel">
            <ApplicationsFilterBar
              search={table.state.search}
              filters={table.state.filters}
              preset={activePreset}
              onSearchChange={table.setSearch}
              onFilterChange={table.setFilter}
              onPresetChange={applyPreset}
              onCreate={() => { setEditingApplication(null); setOpenCreateModal(true); }}
              canCreate={roleActions.canCreate}
              roleLabel={role}
              applications={applications}
            />
            {applications.length === 0 ? (
              table.state.search || Object.values(table.state.filters).some((value) => value && value !== 'All' && value !== 'false') ? (
                <DashboardNoResultsState description="No applications match your filters." onReset={() => table.setState((prev) => ({ ...prev, search: '', filters: defaultFilters, pagination: { ...prev.pagination, page: 1 } }))} />
              ) : (
                <DashboardEmptyState title="No applications found" description="Try different filter criteria or preset combinations." />
              )
            ) : (
              <>
                <ApplicationsTable
                  applications={applications}
                  selectedIds={selectedIds}
                  sort={table.state.sort}
                  canEdit={roleActions.canEdit}
                  canDelete={roleActions.canDelete}
                  onSelect={(id, selected) => setSelectedIds((prev) => (selected ? [...prev, id] : prev.filter((item) => item !== id)))}
                  onToggleSelectAll={(selected) => setSelectedIds(selected ? applications.map((item) => item.id) : [])}
                  onSort={table.setSort}
                  onViewDetails={setDetailsApplication}
                  onEdit={(application) => { setEditingApplication(application); setOpenCreateModal(true); }}
                  onDelete={(application) => setDeleteTarget(application)}
                  onRestore={(application) => void restoreApplication(application)}
                />
                <DataTablePaginationFooter
                  page={table.state.pagination.page}
                  pageSize={table.state.pagination.pageSize}
                  total={totalApplicationsCount}
                  onPageChange={table.setPage}
                  onPageSizeChange={table.setPageSize}
                />
              </>
            )}
          </article>
          {openCreateModal ? <ApplicationFormModal editingApplication={editingApplication} onClose={() => { setOpenCreateModal(false); setEditingApplication(null); }} onSubmit={(payload) => void upsertApplication(payload)} /> : null}
          {detailsApplication ? <ApplicationDetailsDrawer application={detailsApplication} onClose={() => setDetailsApplication(null)} /> : null}
          <ConfirmActionModal
            open={Boolean(deleteTarget)}
            variant="danger"
            title="Delete visa application?"
            description="Removing this application will hide it from active queues and require restore workflows to recover it."
            entityName={deleteTarget?.id ?? 'Unknown application'}
            irreversibleWarning="This action is irreversible from standard queue views. Confirm only if this record should be removed."
            confirmLabel="Delete application"
            onCancel={() => setDeleteTarget(null)}
            onConfirm={async () => {
              if (!deleteTarget) return;
              await softDeleteApplication(deleteTarget);
              setDeleteTarget(null);
            }}
            preventCloseWhilePending
          />
        </>
      ) : null}
    </section>
  );
}
