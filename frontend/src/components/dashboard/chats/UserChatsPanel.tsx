import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardEmptyState, DashboardErrorState, DashboardLoadingSkeleton, DashboardNoResultsState } from '../common/asyncUi';
import { useDashboardNotifications } from '../common/DashboardNotificationsProvider';
import { useDashboardTableState } from '../common/useDashboardTableState';
import { ConfirmActionModal } from '../common/ConfirmActionModal';
import { DashboardQueryState } from '../../../types/dashboard/query';
import { DashboardUserRole } from '../../../types/dashboard/applications';
import { UserChatConversation, UserChatsFilters } from '../../../types/dashboard/chats';
import { chatsService } from '../../../services/dashboard/chats.service';
import { canPerform } from '../../../services/dashboard/authPolicy';
import { extractApiErrorMessage } from '../../../services/dashboard/async';
import { UserChatsFilterBar } from './UserChatsFilterBar';
import { DataTablePaginationFooter } from '../common/DataTablePrimitives';

type Props = {
  role: DashboardUserRole;
  basePath: string;
};

const defaultFilters: UserChatsFilters = {
  dateFrom: '',
  dateTo: '',
  status: 'All',
  priority: 'All',
  agent: 'All',
  channel: 'All',
  includeDeleted: 'false'
};

export function UserChatsPanel({ role, basePath }: Props) {
  const [items, setItems] = useState<UserChatConversation[]>([]);
  const [totalConversationsCount, setTotalConversationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedThread, setSelectedThread] = useState<UserChatConversation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserChatConversation | null>(null);
  const [assignTarget, setAssignTarget] = useState<UserChatConversation | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const { notifyError, notifyInfo, notifySuccess, formatNotificationMessage } = useDashboardNotifications();

  const table = useDashboardTableState<UserChatsFilters>({
    basePath,
    defaultState: {
      search: '',
      pagination: { page: 1, pageSize: 20 },
      filters: defaultFilters
    } as DashboardQueryState<UserChatsFilters>
  });

  const canManage = useMemo(() => canPerform(role, 'users', 'edit') || canPerform(role, 'users', 'delete'), [role]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await chatsService.list({
        page: table.state.pagination.page,
        page_size: table.state.pagination.pageSize,
        search: table.state.search,
        filters: table.state.filters
      });
      setItems(response.items);
      setTotalConversationsCount(response.meta.total);
    } catch (loadError) {
      setError(extractApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [table.state]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const stats = useMemo(() => ({
    open: items.filter((item) => item.status === 'Open').length,
    pending: items.filter((item) => item.status === 'Pending').length,
    unread: items.reduce((acc, item) => acc + item.unreadCount, 0)
  }), [items]);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedThread(null);
      return;
    }

    setSelectedThread((current) => {
      if (!current) return items[0];
      return items.find((item) => item.id === current.id) ?? items[0];
    });
  }, [items]);

  const exportThread = async (conversation: UserChatConversation) => {
    try {
      const transcript = await chatsService.exportThreadTranscript(conversation.id);
      const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${conversation.id}-transcript.txt`;
      link.click();
      URL.revokeObjectURL(url);
      notifyInfo(formatNotificationMessage({ entity: 'user_chats', action: 'export', result: 'success', id: conversation.id }, 'Transcript export started.'));
    } catch (mutationError) {
      notifyError(formatNotificationMessage({ entity: 'user_chats', action: 'export', result: 'error', id: conversation.id }, extractApiErrorMessage(mutationError)));
    }
  };

  const assignOwner = async () => {
    if (!assignTarget) return;
    if (!ownerName.trim() || !ownerEmail.trim()) {
      notifyError('Owner name and owner email are required.');
      return;
    }
    try {
      await chatsService.assignOwner({ conversationId: assignTarget.id, ownerName: ownerName.trim(), ownerEmail: ownerEmail.trim() });
      notifySuccess(formatNotificationMessage({ entity: 'user_chats', action: 'reassign', result: 'success', id: assignTarget.id }, 'Conversation owner updated.'));
      setAssignTarget(null);
      setOwnerEmail('');
      setOwnerName('');
      await loadConversations();
    } catch (mutationError) {
      notifyError(formatNotificationMessage({ entity: 'user_chats', action: 'reassign', result: 'error', id: assignTarget.id }, extractApiErrorMessage(mutationError)));
    }
  };

  const softDelete = async (conversation: UserChatConversation) => {
    try {
      await chatsService.softDelete(conversation.id);
      notifySuccess(formatNotificationMessage({ entity: 'user_chats', action: 'delete', result: 'success', id: conversation.id }, 'Conversation soft-deleted.'));
      setDeleteTarget(null);
      await loadConversations();
    } catch (mutationError) {
      notifyError(formatNotificationMessage({ entity: 'user_chats', action: 'delete', result: 'error', id: conversation.id }, extractApiErrorMessage(mutationError)));
    }
  };

  return (
    <section className="dashboard-stack">
      {loading ? <DashboardLoadingSkeleton rows={4} /> : null}
      {!loading && error ? <DashboardErrorState message={error} onRetry={() => void loadConversations()} /> : null}
      {!loading && !error ? (
        <>
          <div className="dashboard-kpi-grid dashboard-kpi-grid--short">
            <article className="dashboard-kpi-card"><p>Open conversations</p><strong>{stats.open}</strong><span>Needs response</span></article>
            <article className="dashboard-kpi-card"><p>Pending escalations</p><strong>{stats.pending}</strong><span>Awaiting internal team</span></article>
            <article className="dashboard-kpi-card"><p>Total unread</p><strong>{stats.unread}</strong><span>User follow-ups</span></article>
          </div>

          <article className="dashboard-panel">
            <UserChatsFilterBar
              search={table.state.search}
              filters={table.state.filters}
              availableAgents={chatsService.listAgents(items)}
              statuses={chatsService.listStatuses()}
              priorities={chatsService.listPriorities()}
              channels={chatsService.listChannels()}
              onSearchChange={table.setSearch}
              onFilterChange={table.setFilter}
            />

            {items.length === 0 ? (
              table.state.search || Object.values(table.state.filters).some((value) => value && value !== 'All' && value !== 'false') ? (
                <DashboardNoResultsState description="No conversations match your filters." onReset={() => table.setState((prev) => ({ ...prev, search: '', filters: defaultFilters, pagination: { ...prev.pagination, page: 1 } }))} />
              ) : (
                <DashboardEmptyState title="No conversations found" description="Try broader filters or date range." />
              )
            ) : (
              <div className="dashboard-chat-layout">
                <aside className="dashboard-chat-sidebar" aria-label="Conversation list">
                  <ul className="dashboard-chat-list">
                    {items.map((conversation) => {
                      const isActive = selectedThread?.id === conversation.id;
                      return (
                        <li key={conversation.id}>
                          <button
                            type="button"
                            className={`dashboard-chat-list__item${isActive ? ' is-active' : ''}`}
                            onClick={() => setSelectedThread(conversation)}
                          >
                            <div className="dashboard-chat-list__row">
                              <strong>{conversation.userName}</strong>
                              <span>{new Date(conversation.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p>{conversation.lastMessage}</p>
                            <div className="dashboard-chat-list__meta">
                              <small>{conversation.channel}</small>
                              {conversation.unreadCount > 0 ? <span className="dashboard-chip dashboard-chip--warning">{conversation.unreadCount}</span> : null}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </aside>

                <section className="dashboard-chat-thread" aria-live="polite">
                  {selectedThread ? (
                    <>
                      <header className="dashboard-chat-thread__header">
                        <div>
                          <h3>{selectedThread.userName}</h3>
                          <p>{selectedThread.userEmail} · Assigned to {selectedThread.assignedAgent}</p>
                        </div>
                        <div className="dashboard-chat-thread__chips">
                          <span className={`dashboard-chip dashboard-chip--${selectedThread.status.toLowerCase()}`}>{selectedThread.status}</span>
                          <span className={`dashboard-chip dashboard-chip--${selectedThread.priority.toLowerCase()}`}>{selectedThread.priority}</span>
                        </div>
                      </header>

                      <ul className="dashboard-chat-bubbles">
                        {selectedThread.transcript.map((message) => (
                          <li key={message.id} className={`dashboard-chat-bubbles__message dashboard-chat-bubbles__message--${message.direction}`}>
                            <small>{message.senderName} · {new Date(message.sentAt).toLocaleString()}</small>
                            <p>{message.message}</p>
                          </li>
                        ))}
                      </ul>

                      <div className="dashboard-chat-thread__actions">
                        <button type="button" onClick={() => void exportThread(selectedThread)}>Export transcript</button>
                        <button
                          type="button"
                          onClick={() => {
                            setAssignTarget(selectedThread);
                            setOwnerName(selectedThread.assignedAgent);
                            setOwnerEmail(selectedThread.assignedOwnerEmail);
                          }}
                          disabled={!canManage}
                        >
                          Assign owner
                        </button>
                        <button type="button" className="danger" onClick={() => setDeleteTarget(selectedThread)} disabled={!canManage || !!selectedThread.deletedAt}>Soft-delete</button>
                      </div>
                    </>
                  ) : null}
                </section>
              </div>
            )}
            <DataTablePaginationFooter page={table.state.pagination.page} pageSize={table.state.pagination.pageSize} total={totalConversationsCount} onPageChange={table.setPage} onPageSizeChange={table.setPageSize} />
          </article>

          {assignTarget ? (
            <aside className="dashboard-panel dashboard-panel--accent">
              <div className="dashboard-panel__header dashboard-panel__header--spread">
                <h3>Assign / reassign owner</h3>
                <button type="button" onClick={() => setAssignTarget(null)}>Close</button>
              </div>
              <div className="dashboard-filter-grid">
                <label>
                  Agent name
                  <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder="e.g. Nadia R." />
                </label>
                <label>
                  Agent email
                  <input value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} placeholder="agent@ausvisaservice.com" />
                </label>
              </div>
              <div className="dashboard-actions-inline">
                <button type="button" onClick={() => void assignOwner()}>Save owner</button>
              </div>
            </aside>
          ) : null}

          <ConfirmActionModal
            open={!!deleteTarget}
            variant="danger"
            title="Soft-delete conversation"
            description={deleteTarget ? `This will archive ${deleteTarget.id} for ${deleteTarget.userName}. You can keep history for audit and reporting.` : ''}
            entityName={deleteTarget?.id ?? 'conversation'}
            confirmLabel="Soft-delete"
            onConfirm={() => deleteTarget ? void softDelete(deleteTarget) : undefined}
            onCancel={() => setDeleteTarget(null)}
          />
        </>
      ) : null}
    </section>
  );
}
