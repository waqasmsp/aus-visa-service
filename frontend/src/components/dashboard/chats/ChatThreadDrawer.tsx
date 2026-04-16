import { useId, useRef } from 'react';
import { UserChatConversation } from '../../../types/dashboard/chats';
import { DashboardButton } from '../common/DashboardButton';
import { useFocusTrap } from '../common/useFocusTrap';

type Props = {
  conversation: UserChatConversation;
  onClose: () => void;
};

export function ChatThreadDrawer({ conversation, onClose }: Props) {
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  useFocusTrap({ active: true, containerRef: drawerRef, initialFocusRef: closeRef, onClose });

  return (
    <aside ref={drawerRef} className="dashboard-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <h3 id={titleId}>{conversation.userName} · thread</h3>
        <DashboardButton ref={closeRef} type="button" variant="ghost" size="sm" onClick={onClose}>Close</DashboardButton>
      </div>

      <p id={descriptionId} className="dashboard-panel__note">
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
