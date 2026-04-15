import { PortalUser, UsersFilters } from '../../../types/dashboard/users';

type Props = {
  search: string;
  filters: UsersFilters;
  users: PortalUser[];
  canMutate: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: <K extends keyof UsersFilters>(key: K, value: UsersFilters[K]) => void;
  onCreateUser: (segment: 'registered' | 'lead') => void;
  onImportCsv: () => void;
  onExportCsv: () => void;
};

export function UsersFilterBar({
  search,
  filters,
  users,
  canMutate,
  onSearchChange,
  onFilterChange,
  onCreateUser,
  onImportCsv,
  onExportCsv
}: Props) {
  const uniqueSources = ['All', ...new Set(users.map((item) => item.source))];
  const uniqueCountries = ['All', ...new Set(users.map((item) => item.country))];

  return (
    <>
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <h2>Users CRM</h2>
        <div className="dashboard-actions-inline">
          <button type="button" onClick={() => onCreateUser('registered')} disabled={!canMutate}>Create User</button>
          <button type="button" onClick={() => onCreateUser('lead')} disabled={!canMutate}>Create Lead</button>
          <button type="button" onClick={onImportCsv} disabled={!canMutate}>Import CSV</button>
          <button type="button" onClick={onExportCsv}>Export CSV</button>
        </div>
      </div>

      <div className="dashboard-filter-grid">
        <label>
          Search
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Name, email, phone, country" />
        </label>
        <label>
          Segment
          <select value={filters.segment} onChange={(event) => onFilterChange('segment', event.target.value as UsersFilters['segment'])}>
            <option value="All">All</option>
            <option value="Registered">Registered</option>
            <option value="Lead">Lead</option>
          </select>
        </label>
        <label>
          Purchase state
          <select value={filters.purchase} onChange={(event) => onFilterChange('purchase', event.target.value as UsersFilters['purchase'])}>
            <option value="All">All</option>
            <option value="Purchased">Purchased</option>
            <option value="Abandoned">Abandoned</option>
          </select>
        </label>
        <label>
          Acquisition source
          <select value={filters.source} onChange={(event) => onFilterChange('source', event.target.value)}>
            {uniqueSources.map((source) => <option key={source}>{source}</option>)}
          </select>
        </label>
        <label>
          Country
          <select value={filters.country} onChange={(event) => onFilterChange('country', event.target.value)}>
            {uniqueCountries.map((country) => <option key={country}>{country}</option>)}
          </select>
        </label>
        <label>
          Last seen
          <select value={filters.lastSeenDays} onChange={(event) => onFilterChange('lastSeenDays', event.target.value as UsersFilters['lastSeenDays'])}>
            <option value="All">All</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </label>
        <label>
          Spend band
          <select value={filters.spendBand} onChange={(event) => onFilterChange('spendBand', event.target.value as UsersFilters['spendBand'])}>
            <option value="All">All</option>
            <option value="0-99">$0 - $99</option>
            <option value="100-499">$100 - $499</option>
            <option value="500+">$500+</option>
          </select>
        </label>
      </div>
    </>
  );
}
