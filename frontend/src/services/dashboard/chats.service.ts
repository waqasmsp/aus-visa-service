import {
  AssignConversationOwnerRequest,
  ChatChannel,
  ChatConversationStatus,
  ChatMessage,
  ChatPriority,
  ListUserChatsRequestDto,
  ListUserChatsResponse,
  UserChatConversation
} from '../../types/dashboard/chats';
import { DashboardUserRole } from '../../types/dashboard/applications';
import { dashboardDbFetch } from './dbClient';

type ChatConversationDbRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  user_full_name: string | null;
  channel: 'web' | 'email' | 'sms' | 'whatsapp' | 'in_app';
  status: 'open' | 'pending' | 'resolved' | 'closed' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_owner_id: string | null;
  last_activity_at: string;
  unread_count: number;
  last_message_text: string | null;
  deleted_at: string | null;
};

type ChatMessageDbRow = {
  id: string;
  conversation_id: string;
  sender_role: 'user' | 'agent' | 'system';
  direction: 'inbound' | 'outbound';
  message_text: string;
  sent_at: string;
};

type ProfileLite = { id: string; email: string | null; full_name: string | null };

type ViewerContext = { viewerEmail?: string; actorRole?: DashboardUserRole };

const toEpoch = (value: string): number => new Date(value).getTime();

const channelToUi = (channel: ChatConversationDbRow['channel']): ChatChannel => {
  if (channel === 'email') return 'Email';
  if (channel === 'whatsapp') return 'WhatsApp';
  return 'Live Chat';
};

const statusToUi = (status: ChatConversationDbRow['status']): ChatConversationStatus => {
  if (status === 'open') return 'Open';
  if (status === 'pending') return 'Pending';
  if (status === 'resolved') return 'Resolved';
  return 'Closed';
};

const priorityToUi = (priority: ChatConversationDbRow['priority']): ChatPriority => {
  if (priority === 'low') return 'Low';
  if (priority === 'high') return 'High';
  if (priority === 'urgent') return 'Urgent';
  return 'Medium';
};

const fetchProfiles = async (): Promise<ProfileLite[]> => dashboardDbFetch<ProfileLite[]>('profiles', undefined, { select: 'id,email,full_name', limit: '5000' });

const resolveProfileIdByEmail = async (email?: string): Promise<string | null> => {
  if (!email) return null;
  const rows = await dashboardDbFetch<Array<{ id: string }>>('profiles', undefined, { select: 'id', email: `eq.${email}`, limit: '1' });
  return rows[0]?.id ?? null;
};

const mapConversation = (row: ChatConversationDbRow, profiles: Map<string, ProfileLite>, transcript: ChatMessage[]): UserChatConversation => {
  const assigned = row.assigned_owner_id ? profiles.get(row.assigned_owner_id) : null;
  return {
    id: row.id,
    userName: row.user_full_name ?? row.user_email ?? 'Unknown user',
    userEmail: row.user_email ?? '',
    lastMessage: row.last_message_text ?? '',
    assignedAgent: assigned?.full_name ?? assigned?.email ?? 'Unassigned',
    assignedOwnerEmail: assigned?.email ?? '',
    status: statusToUi(row.status),
    priority: priorityToUi(row.priority),
    unreadCount: row.unread_count,
    channel: channelToUi(row.channel),
    lastActivity: row.last_activity_at,
    deletedAt: row.deleted_at,
    transcript
  };
};

const listFromDb = async (request: ListUserChatsRequestDto, context: ViewerContext): Promise<ListUserChatsResponse> => {
  const rows = await dashboardDbFetch<ChatConversationDbRow[]>('chat_conversations', undefined, {
    select: 'id,user_id,user_email,user_full_name,channel,status,priority,assigned_owner_id,last_activity_at,unread_count,last_message_text,deleted_at',
    order: 'last_activity_at.desc',
    limit: '5000'
  });
  const viewerId = await resolveProfileIdByEmail(context.viewerEmail);
  const profileRows = await fetchProfiles();
  const profileMap = new Map(profileRows.map((item) => [item.id, item]));

  const ids = rows.map((row) => row.id);
  const messages = ids.length
    ? await dashboardDbFetch<ChatMessageDbRow[]>('chat_messages', undefined, {
      select: 'id,conversation_id,sender_role,direction,message_text,sent_at',
      conversation_id: `in.(${ids.join(',')})`,
      order: 'sent_at.asc'
    })
    : [];

  const mapped = rows
    .filter((row) => {
      if (context.actorRole === 'user' && viewerId) {
        return row.user_id === viewerId;
      }
      return true;
    })
    .map((row) => {
      const transcript: ChatMessage[] = messages
        .filter((message) => message.conversation_id === row.id)
        .map((message) => ({
          id: message.id,
          senderName: message.sender_role === 'user' ? (row.user_full_name ?? row.user_email ?? 'User') : 'Support',
          senderRole: message.sender_role,
          message: message.message_text,
          sentAt: message.sent_at,
          direction: message.direction
        }));
      return mapConversation(row, profileMap, transcript);
    });

  const search = request.search?.trim().toLowerCase() ?? '';
  const filtered = mapped.filter((conversation) => {
    const matchesSearch = !search || [conversation.userName, conversation.userEmail].some((value) => value.toLowerCase().includes(search));
    const matchesStatus = request.filters.status === 'All' || conversation.status === request.filters.status;
    const matchesPriority = request.filters.priority === 'All' || conversation.priority === request.filters.priority;
    const matchesAgent = request.filters.agent === 'All' || conversation.assignedAgent === request.filters.agent;
    const matchesChannel = request.filters.channel === 'All' || conversation.channel === request.filters.channel;
    const matchesDeleted = request.filters.includeDeleted === 'true' || !conversation.deletedAt;
    const matchesDateFrom = !request.filters.dateFrom || toEpoch(conversation.lastActivity) >= toEpoch(`${request.filters.dateFrom}T00:00:00Z`);
    const matchesDateTo = !request.filters.dateTo || toEpoch(conversation.lastActivity) <= toEpoch(`${request.filters.dateTo}T23:59:59Z`);
    return matchesSearch && matchesStatus && matchesPriority && matchesAgent && matchesChannel && matchesDeleted && matchesDateFrom && matchesDateTo;
  });

  const start = (request.page - 1) * request.page_size;
  const items = filtered.slice(start, start + request.page_size);
  return { items, meta: { total: filtered.length, page: request.page, pageSize: request.page_size } };
};

export const chatsService = {
  async list(request: ListUserChatsRequestDto, context: ViewerContext = {}): Promise<ListUserChatsResponse> {
    return listFromDb(request, context);
  },

  async softDelete(conversationId: string): Promise<void> {
    await dashboardDbFetch<void>(`chat_conversations?id=eq.${conversationId}`, { method: 'PATCH', body: JSON.stringify({ deleted_at: new Date().toISOString(), status: 'closed', unread_count: 0 }) });
  },

  async exportThreadTranscript(conversationId: string): Promise<string> {
    const conversation = await dashboardDbFetch<ChatConversationDbRow[]>('chat_conversations', undefined, { select: 'id,user_email,user_full_name,assigned_owner_id', id: `eq.${conversationId}`, limit: '1' });
    if (!conversation[0]) throw new Error('Conversation not found.');
    const messages = await dashboardDbFetch<ChatMessageDbRow[]>('chat_messages', undefined, { select: 'id,sender_role,direction,message_text,sent_at,conversation_id', conversation_id: `eq.${conversationId}`, order: 'sent_at.asc' });
    const lines = [`Conversation: ${conversationId}`, `User: ${conversation[0].user_full_name ?? 'Unknown'} <${conversation[0].user_email ?? ''}>`, ''];
    messages.forEach((message) => {
      lines.push(`[${message.sent_at}] ${message.sender_role}: ${message.message_text}`);
    });
    return lines.join('\n');
  },

  async assignOwner(payload: AssignConversationOwnerRequest): Promise<UserChatConversation> {
    const profileId = await resolveProfileIdByEmail(payload.ownerEmail);
    if (!profileId) {
      throw new Error('Owner profile not found.');
    }
    await dashboardDbFetch<void>(`chat_conversations?id=eq.${payload.conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ assigned_owner_id: profileId, last_activity_at: new Date().toISOString() })
    });
    const response = await listFromDb({ page: 1, page_size: 1, filters: { status: 'All', priority: 'All', agent: 'All', channel: 'All', includeDeleted: 'true', dateFrom: '', dateTo: '' } }, {});
    const found = response.items.find((item) => item.id === payload.conversationId);
    if (!found) throw new Error('Conversation not found.');
    return found;
  },

  listAgents(conversations: UserChatConversation[]): string[] {
    return [...new Set(conversations.map((conversation) => conversation.assignedAgent))].sort((a, b) => a.localeCompare(b));
  },

  listStatuses(): ChatConversationStatus[] {
    return ['Open', 'Pending', 'Resolved', 'Closed'];
  },

  listPriorities(): ChatPriority[] {
    return ['Low', 'Medium', 'High', 'Urgent'];
  },

  listChannels(): ChatChannel[] {
    return ['Live Chat', 'Email', 'WhatsApp', 'Facebook'];
  }
};
