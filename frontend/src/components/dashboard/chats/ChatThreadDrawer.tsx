import { UserChatConversation } from '../../../types/dashboard/chats';

type Props = {
  conversation: UserChatConversation;
  onClose: () => void;
};

export function ChatThreadDrawer({ conversation, onClose }: Props) {
  return (
    <aside className="dashboard-panel" aria-label={`Conversation thread ${conversation.id}`}>
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <h3>{conversation.userName} · thread</h3>
        <button type="button" onClick={onClose}>Close</button>
      </div>

      <p className="dashboard-panel__note">
        {conversation.userEmail} · Assigned to {conversation.assignedAgent} · {conversation.status}
      </p>

      <ul className="dashboard-simple-list">
        {conversation.transcript.map((message) => (
          <li key={message.id}>
            <strong>{message.senderName}</strong> <small>{new Date(message.sentAt).toLocaleString()}</small>
            <p>{message.message}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
