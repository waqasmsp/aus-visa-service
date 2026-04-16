import { DashboardSort } from '../../../types/dashboard/query';
import { VisaApplication } from '../../../types/dashboard/applications';
import { DataTableColumn, DataTableColumnVisibility, DataTableRowActions, useDataTablePreferences } from '../common/DataTablePrimitives';

type Props = {
  applications: VisaApplication[];
  selectedIds: string[];
  sort?: DashboardSort;
  canEdit: boolean;
  canDelete: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onToggleSelectAll: (selected: boolean) => void;
  onSort: (sort: DashboardSort) => void;
  onViewDetails: (application: VisaApplication) => void;
  onEdit: (application: VisaApplication) => void;
  onDelete: (application: VisaApplication) => void;
  onRestore: (application: VisaApplication) => void;
};

const columns: DataTableColumn[] = [
  { id: 'id', label: 'Case ID', sortable: true },
  { id: 'applicant', label: 'Applicant', sortable: true },
  { id: 'visa_type', label: 'Visa Type', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'priority', label: 'Priority', sortable: true },
  { id: 'assigned_to', label: 'Assigned', sortable: true },
  { id: 'submitted_on', label: 'Submitted', sortable: true },
  { id: 'sla', label: 'SLA Risk' },
  { id: 'actions', label: 'Actions' }
];

export function ApplicationsTable({ applications, selectedIds, sort, canEdit, canDelete, onSelect, onToggleSelectAll, onSort, onViewDetails, onEdit, onDelete, onRestore }: Props) {
  const allSelected = applications.length > 0 && applications.every((item) => selectedIds.includes(item.id));
  const { visibleColumnIds, toggleColumn, resetColumns } = useDataTablePreferences('dashboard-table-applications', columns.map((column) => column.id));
  const isVisible = (columnId: string) => visibleColumnIds.includes(columnId);

  return (
    <>
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <small>Table preferences are saved to this browser.</small>
        <DataTableColumnVisibility columns={columns} visibleColumnIds={visibleColumnIds} onToggle={toggleColumn} onReset={resetColumns} />
      </div>
      <div className="dashboard-table-wrap dashboard-table-wrap--sticky">
        <table className="dashboard-table" aria-label="Visa applications data table">
          <thead className="dashboard-table__thead--sticky">
            <tr>
              <th scope="col"><input type="checkbox" checked={allSelected} onChange={(event) => onToggleSelectAll(event.target.checked)} aria-label="Select all applications" /></th>
              {columns.filter((column) => isVisible(column.id)).map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={column.sortable && sort?.field === column.id ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {column.sortable ? (
                    <button type="button" className="dashboard-table-sort" aria-label={`Sort applications by ${column.label}`} onClick={() => onSort({ field: column.id, direction: sort?.field === column.id && sort.direction === 'asc' ? 'desc' : 'asc' })}>
                      {column.label}
                      <span>{sort?.field === column.id ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                    </button>
                  ) : column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(application.id)}
                    onChange={(event) => onSelect(application.id, event.target.checked)}
                  />
                </td>
                {isVisible('id') ? <th scope="row">{application.id}</th> : null}
                {isVisible('applicant') ? (
                  <td>
                    <strong>{application.applicant}</strong>
                    <small>{application.email}</small>
                  </td>
                ) : null}
                {isVisible('visa_type') ? <td>{application.visaType}</td> : null}
                {isVisible('status') ? <td><span className={`dashboard-chip dashboard-chip--${application.status.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{application.status}</span></td> : null}
                {isVisible('priority') ? <td><span className={`dashboard-chip dashboard-chip--${application.priority.toLowerCase()}`}>{application.priority}</span></td> : null}
                {isVisible('assigned_to') ? <td>{application.assignedTo}</td> : null}
                {isVisible('submitted_on') ? <td>{application.submittedOn}</td> : null}
                {isVisible('sla') ? <td><span className={`dashboard-chip dashboard-chip--${application.slaRisk.toLowerCase()}`}>{application.slaRisk}</span></td> : null}
                {isVisible('actions') ? (
                  <td>
                    <DataTableRowActions>
                      <button type="button" onClick={() => onViewDetails(application)}>Details</button>
                      {canEdit ? <button type="button" onClick={() => onEdit(application)}>Edit</button> : null}
                      {canDelete && !application.isDeleted ? <button type="button" onClick={() => onDelete(application)}>Delete</button> : null}
                      {canDelete && application.isDeleted ? <button type="button" onClick={() => onRestore(application)}>Restore</button> : null}
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
