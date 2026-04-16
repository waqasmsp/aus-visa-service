import { UserChatConversation } from '../../../types/dashboard/chats';
import { DataTableColumn, DataTableColumnVisibility, DataTableRowActions, useDataTablePreferences } from '../common/DataTablePrimitives';

type Props = {
  conversations: UserChatConversation[];
  canManage: boolean;
  onViewThread: (conversation: UserChatConversation) => void;
  onSoftDelete: (conversation: UserChatConversation) => void;
  onExportThread: (conversation: UserChatConversation) => void;
  onAssignOwner: (conversation: UserChatConversation) => void;
};

const columns: DataTableColumn[] = [
  { id: 'user', label: 'User' },
  { id: 'lastMessage', label: 'Last message' },
  { id: 'agent', label: 'Assigned agent' },
  { id: 'status', label: 'Status' },
  { id: 'unread', label: 'Unread count' },
  { id: 'activity', label: 'Last activity' },
  { id: 'actions', label: 'Actions' }
];

export function UserChatsTable({ conversations, canManage, onViewThread, onSoftDelete, onExportThread, onAssignOwner }: Props) {
  const { visibleColumnIds, toggleColumn, resetColumns } = useDataTablePreferences('dashboard-table-chats', columns.map((column) => column.id));
  const isVisible = (columnId: string) => visibleColumnIds.includes(columnId);

  return (
    <>
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <small>Table preferences are saved to this browser.</small>
        <DataTableColumnVisibility columns={columns} visibleColumnIds={visibleColumnIds} onToggle={toggleColumn} onReset={resetColumns} />
      </div>
      <div className="dashboard-table-wrap dashboard-table-wrap--sticky">
        <table className="dashboard-table" aria-label="User chat conversations table">
          <thead className="dashboard-table__thead--sticky">
            <tr>
              {columns.filter((column) => isVisible(column.id)).map((column) => <th key={column.id} scope="col">{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {conversations.map((conversation) => (
              <tr key={conversation.id}>
                {isVisible('user') ? (
                  <th scope="row">
                    <strong>{conversation.userName}</strong>
                    <small>{conversation.userEmail}</small>
                  </th>
                ) : null}
                {isVisible('lastMessage') ? (
                  <td>
                    <span>{conversation.lastMessage}</span>
                    <small>{conversation.channel} · {conversation.priority}</small>
                  </td>
                ) : null}
                {isVisible('agent') ? <td>{conversation.assignedAgent}</td> : null}
                {isVisible('status') ? <td><span className={`dashboard-chip dashboard-chip--${conversation.status.toLowerCase()}`}>{conversation.status}</span></td> : null}
                {isVisible('unread') ? (
                  <td>
                    <span className={conversation.unreadCount > 0 ? 'dashboard-chip dashboard-chip--warning' : 'dashboard-chip'}>{conversation.unreadCount}</span>
                  </td>
                ) : null}
                {isVisible('activity') ? <td>{new Date(conversation.lastActivity).toLocaleString()}</td> : null}
                {isVisible('actions') ? (
                  <td>
                    <DataTableRowActions>
                      <button type="button" onClick={() => onViewThread(conversation)}>View thread</button>
                      <button type="button" onClick={() => onExportThread(conversation)}>Export transcript</button>
                      <button type="button" onClick={() => onAssignOwner(conversation)} disabled={!canManage}>Assign owner</button>
                      <button type="button" className="danger" onClick={() => onSoftDelete(conversation)} disabled={!canManage || !!conversation.deletedAt}>Soft-delete</button>
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
