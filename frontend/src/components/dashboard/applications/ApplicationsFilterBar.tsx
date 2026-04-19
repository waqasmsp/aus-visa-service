import { ApplicationFilters, ApplicationSlaRisk, ApplicationStatus, VisaApplication } from '../../../types/dashboard/applications';

type Props = {
  search: string;
  filters: ApplicationFilters;
  preset: string;
  onSearchChange: (value: string) => void;
  onFilterChange: <K extends keyof ApplicationFilters>(key: K, value: ApplicationFilters[K]) => void;
  onPresetChange: (preset: string) => void;
  onCreate: () => void;
  onCreateFullApplication: () => void;
  canCreate: boolean;
  roleLabel: string;
  applications: VisaApplication[];
};

const SLA_RISKS: Array<'All' | ApplicationSlaRisk> = ['All', 'Low', 'Medium', 'High', 'Critical'];
const STATUSES: Array<'All' | ApplicationStatus> = ['All', 'Submitted', 'In Review', 'Documents Needed', 'Approved', 'Completed', 'Rejected'];
const PRIORITIES = ['All', 'Low', 'Medium', 'High'] as const;

export function ApplicationsFilterBar({
  search,
  filters,
  preset,
  onSearchChange,
  onFilterChange,
  onPresetChange,
  onCreate,
  onCreateFullApplication,
  canCreate,
  roleLabel,
  applications
}: Props) {
  const assignedAgents = Array.from(new Set(applications.map((item) => item.assignedTo))).sort();
  const visaTypes = Array.from(new Set(applications.map((item) => item.visaType))).sort();
  const destinations = Array.from(new Set(applications.map((item) => item.destinationCountry))).sort();

  return (
    <>
      <div className="dashboard-panel__header">
        <h2>Application Status Board</h2>
        <div>
          <label>
            Preset
            <select value={preset} onChange={(event) => onPresetChange(event.target.value)}>
              <option value="">Custom</option>
              <option value="my-queue">My Queue</option>
              <option value="high-priority">High Priority</option>
              <option value="needs-docs">Needs Docs</option>
            </select>
          </label>
          {canCreate ? (
            <div className="dashboard-actions-inline">
              <button type="button" className="dashboard-button" onClick={onCreate}>
                Add Application
              </button>
              <button type="button" className="dashboard-button" onClick={onCreateFullApplication}>
                Add Full Application
              </button>
            </div>
          ) : (
            <small>Read-only actions for {roleLabel}</small>
          )}
        </div>
      </div>
      <div className="dashboard-filter-grid">
        <label>
          Search
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Case ID, applicant or email" />
        </label>
        <label>
          Status
          <select value={filters.status} onChange={(event) => onFilterChange('status', event.target.value as ApplicationFilters['status'])}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select value={filters.priority} onChange={(event) => onFilterChange('priority', event.target.value as ApplicationFilters['priority'])}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </label>
        <label>
          Assigned agent
          <select value={filters.assignedAgent} onChange={(event) => onFilterChange('assignedAgent', event.target.value)}>
            <option value="All">All</option>
            {assignedAgents.map((agent) => <option key={agent} value={agent}>{agent}</option>)}
          </select>
        </label>
        <label>
          Visa type
          <select value={filters.visaType} onChange={(event) => onFilterChange('visaType', event.target.value)}>
            <option value="All">All</option>
            {visaTypes.map((visaType) => <option key={visaType} value={visaType}>{visaType}</option>)}
          </select>
        </label>
        <label>
          Destination country
          <select value={filters.destinationCountry} onChange={(event) => onFilterChange('destinationCountry', event.target.value)}>
            <option value="All">All</option>
            {destinations.map((country) => <option key={country} value={country}>{country}</option>)}
          </select>
        </label>
        <label>
          Submission from
          <input type="date" value={filters.submissionDateFrom} onChange={(event) => onFilterChange('submissionDateFrom', event.target.value)} />
        </label>
        <label>
          Submission to
          <input type="date" value={filters.submissionDateTo} onChange={(event) => onFilterChange('submissionDateTo', event.target.value)} />
        </label>
        <label>
          SLA risk
          <select value={filters.slaRisk} onChange={(event) => onFilterChange('slaRisk', event.target.value as ApplicationFilters['slaRisk'])}>
            {SLA_RISKS.map((risk) => <option key={risk} value={risk}>{risk}</option>)}
          </select>
        </label>
      </div>
    </>
  );
}
