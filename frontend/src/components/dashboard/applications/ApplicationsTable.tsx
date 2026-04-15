import { DashboardSort } from '../../../types/dashboard/query';
import { VisaApplication } from '../../../types/dashboard/applications';

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

const sortable: Array<{ label: string; field: string }> = [
  { label: 'Case ID', field: 'id' },
  { label: 'Applicant', field: 'applicant' },
  { label: 'Visa Type', field: 'visa_type' },
  { label: 'Status', field: 'status' },
  { label: 'Priority', field: 'priority' },
  { label: 'Assigned', field: 'assigned_to' },
  { label: 'Submitted', field: 'submitted_on' }
];

export function ApplicationsTable({ applications, selectedIds, sort, canEdit, canDelete, onSelect, onToggleSelectAll, onSort, onViewDetails, onEdit, onDelete, onRestore }: Props) {
  const allSelected = applications.length > 0 && applications.every((item) => selectedIds.includes(item.id));

  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th><input type="checkbox" checked={allSelected} onChange={(event) => onToggleSelectAll(event.target.checked)} /></th>
            {sortable.map((column) => (
              <th key={column.field}>
                <button
                  type="button"
                  onClick={() =>
                    onSort({ field: column.field, direction: sort?.field === column.field && sort.direction === 'asc' ? 'desc' : 'asc' })
                  }
                >
                  {column.label}
                </button>
              </th>
            ))}
            <th>SLA Risk</th>
            <th>Actions</th>
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
              <td>{application.id}</td>
              <td>
                <strong>{application.applicant}</strong>
                <small>{application.email}</small>
              </td>
              <td>{application.visaType}</td>
              <td><span className={`dashboard-chip dashboard-chip--${application.status.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{application.status}</span></td>
              <td><span className={`dashboard-chip dashboard-chip--${application.priority.toLowerCase()}`}>{application.priority}</span></td>
              <td>{application.assignedTo}</td>
              <td>{application.submittedOn}</td>
              <td><span className={`dashboard-chip dashboard-chip--${application.slaRisk.toLowerCase()}`}>{application.slaRisk}</span></td>
              <td>
                <button type="button" onClick={() => onViewDetails(application)}>Details</button>
                {canEdit ? <button type="button" onClick={() => onEdit(application)}>Edit</button> : null}
                {canDelete && !application.isDeleted ? <button type="button" onClick={() => onDelete(application)}>Delete</button> : null}
                {canDelete && application.isDeleted ? <button type="button" onClick={() => onRestore(application)}>Restore</button> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
