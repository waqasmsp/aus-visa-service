import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardEmptyState, DashboardErrorState, DashboardLoadingSkeleton } from '../common/asyncUi';
import { useDashboardTableState } from '../common/useDashboardTableState';
import {
  ApplicationFilters,
  ApplicationStatus,
  DashboardUserRole,
  VisaApplication
} from '../../../types/dashboard/applications';
import { DashboardQueryState } from '../../../types/dashboard/query';
import { applicationsService } from '../../../services/dashboard/applications.service';
import { extractApiErrorMessage } from '../../../services/dashboard/async';
import { canPerform, collectDestructiveApproval } from '../../../services/dashboard/authPolicy';
import { ApplicationsFilterBar } from './ApplicationsFilterBar';
import { ApplicationsBulkActionBar } from './ApplicationsBulkActionBar';
import { ApplicationsTable } from './ApplicationsTable';
import { ApplicationFormModal } from './ApplicationFormModal';
import { ApplicationDetailsDrawer } from './ApplicationDetailsDrawer';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingApplication, setEditingApplication] = useState<VisaApplication | null>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [detailsApplication, setDetailsApplication] = useState<VisaApplication | null>(null);
  const [activePreset, setActivePreset] = useState(() => (typeof window === 'undefined' ? '' : window.localStorage.getItem(presetStorageKey) ?? ''));

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
      setOpenCreateModal(false);
      setEditingApplication(null);
      await loadApplications();
    } catch (mutationError) {
      setError(extractApiErrorMessage(mutationError));
    }
  };

  const softDeleteApplication = async (application: VisaApplication) => {
    const approval = collectDestructiveApproval('applications', 'delete', application.id);
    if (!approval) return;

    try {
      await applicationsService.softDelete(application.id, role, approval);
      await loadApplications();
    } catch (mutationError) {
      setError(extractApiErrorMessage(mutationError));
    }
  };

  const restoreApplication = async (application: VisaApplication) => {
    try {
      await applicationsService.restore(application.id, role);
      await loadApplications();
    } catch (mutationError) {
      setError(extractApiErrorMessage(mutationError));
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
            onAssignOwner={async (owner) => { await applicationsService.bulkAssignOwner({ ids: selectedIds, owner }, role); await loadApplications(); }}
            onUpdateStatus={async (status) => { await applicationsService.bulkStatusUpdate({ ids: selectedIds, status }, role); await loadApplications(); }}
            onExport={async () => {
              const uri = await applicationsService.exportSelected(selectedIds, role);
              window.alert(`Export ready: ${uri}`);
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
              <DashboardEmptyState title="No applications found" description="Try different filter criteria or preset combinations." />
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
                  onDelete={(application) => void softDeleteApplication(application)}
                  onRestore={(application) => void restoreApplication(application)}
                />
                <div className="dashboard-panel__header">
                  <small>Page {table.state.pagination.page}</small>
                  <div>
                    <button type="button" disabled={table.state.pagination.page === 1} onClick={() => table.setPage(table.state.pagination.page - 1)}>Prev</button>
                    <button type="button" onClick={() => table.setPage(table.state.pagination.page + 1)}>Next</button>
                    <select value={table.state.pagination.pageSize} onChange={(event) => table.setPageSize(Number(event.target.value))}>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </article>
          {openCreateModal ? <ApplicationFormModal editingApplication={editingApplication} onClose={() => { setOpenCreateModal(false); setEditingApplication(null); }} onSubmit={(payload) => void upsertApplication(payload)} /> : null}
          {detailsApplication ? <ApplicationDetailsDrawer application={detailsApplication} onClose={() => setDetailsApplication(null)} /> : null}
        </>
      ) : null}
    </section>
  );
}
