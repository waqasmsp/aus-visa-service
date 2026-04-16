import { UserChatConversation } from '../../../types/dashboard/chats';

type Props = {
  conversations: UserChatConversation[];
  canManage: boolean;
  onViewThread: (conversation: UserChatConversation) => void;
  onSoftDelete: (conversation: UserChatConversation) => void;
  onExportThread: (conversation: UserChatConversation) => void;
  onAssignOwner: (conversation: UserChatConversation) => void;
};

export function UserChatsTable({ conversations, canManage, onViewThread, onSoftDelete, onExportThread, onAssignOwner }: Props) {
  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Last message</th>
            <th>Assigned agent</th>
            <th>Status</th>
            <th>Unread count</th>
            <th>Last activity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {conversations.map((conversation) => (
            <tr key={conversation.id}>
              <td>
                <strong>{conversation.userName}</strong>
                <small>{conversation.userEmail}</small>
              </td>
              <td>
                <span>{conversation.lastMessage}</span>
                <small>{conversation.channel} · {conversation.priority}</small>
              </td>
              <td>{conversation.assignedAgent}</td>
              <td><span className={`dashboard-chip dashboard-chip--${conversation.status.toLowerCase()}`}>{conversation.status}</span></td>
              <td>
                <span className={conversation.unreadCount > 0 ? 'dashboard-chip dashboard-chip--warning' : 'dashboard-chip'}>{conversation.unreadCount}</span>
              </td>
              <td>{new Date(conversation.lastActivity).toLocaleString()}</td>
              <td>
                <div className="dashboard-actions-inline">
                  <button type="button" onClick={() => onViewThread(conversation)}>View thread</button>
                  <button type="button" onClick={() => onExportThread(conversation)}>Export transcript</button>
                  <button type="button" onClick={() => onAssignOwner(conversation)} disabled={!canManage}>Assign owner</button>
                  <button type="button" className="danger" onClick={() => onSoftDelete(conversation)} disabled={!canManage || !!conversation.deletedAt}>Soft-delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
