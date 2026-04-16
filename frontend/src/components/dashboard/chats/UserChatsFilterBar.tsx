import { ChatChannel, ChatConversationStatus, ChatPriority, UserChatsFilters } from '../../../types/dashboard/chats';

type Props = {
  search: string;
  filters: UserChatsFilters;
  availableAgents: string[];
  statuses: ChatConversationStatus[];
  priorities: ChatPriority[];
  channels: ChatChannel[];
  onSearchChange: (value: string) => void;
  onFilterChange: <K extends keyof UserChatsFilters>(key: K, value: UserChatsFilters[K]) => void;
};

export function UserChatsFilterBar({
  search,
  filters,
  availableAgents,
  statuses,
  priorities,
  channels,
  onSearchChange,
  onFilterChange
}: Props) {
  return (
    <>
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <h2>User chats</h2>
      </div>

      <div className="dashboard-filter-grid">
        <label>
          Search user/email
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by user name or email"
          />
        </label>

        <label>
          Date from
          <input type="date" value={filters.dateFrom} onChange={(event) => onFilterChange('dateFrom', event.target.value)} />
        </label>

        <label>
          Date to
          <input type="date" value={filters.dateTo} onChange={(event) => onFilterChange('dateTo', event.target.value)} />
        </label>

        <label>
          Status
          <select value={filters.status} onChange={(event) => onFilterChange('status', event.target.value as UserChatsFilters['status'])}>
            <option value="All">All</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label>
          Priority
          <select value={filters.priority} onChange={(event) => onFilterChange('priority', event.target.value as UserChatsFilters['priority'])}>
            <option value="All">All</option>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </label>

        <label>
          Agent
          <select value={filters.agent} onChange={(event) => onFilterChange('agent', event.target.value as UserChatsFilters['agent'])}>
            <option value="All">All</option>
            {availableAgents.map((agent) => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>
        </label>

        <label>
          Channel
          <select value={filters.channel} onChange={(event) => onFilterChange('channel', event.target.value as UserChatsFilters['channel'])}>
            <option value="All">All</option>
            {channels.map((channel) => (
              <option key={channel} value={channel}>{channel}</option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
