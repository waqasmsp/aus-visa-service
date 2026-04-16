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
import { delay } from './async';

const USE_BACKEND_API = (import.meta.env.VITE_DASHBOARD_CHATS_API_MODE ?? 'mock').toLowerCase() === 'api';
const CHATS_API_BASE = import.meta.env.VITE_DASHBOARD_CHATS_API_BASE_URL ?? '/api/dashboard/chats';

const toEpoch = (value: string): number => new Date(value).getTime();

let mockConversations: UserChatConversation[] = [
  {
    id: 'chat-101',
    userName: 'Sana Malik',
    userEmail: 'sana.malik@example.com',
    lastMessage: 'Can you confirm if my passport scan is acceptable?',
    assignedAgent: 'Nadia R.',
    assignedOwnerEmail: 'nadia.r@ausvisaservice.com',
    status: 'Open',
    priority: 'High',
    unreadCount: 3,
    channel: 'Live Chat',
    lastActivity: '2026-04-16T07:40:00Z',
    deletedAt: null,
    transcript: [
      { id: 'm-1', senderName: 'Sana Malik', senderRole: 'user', message: 'Uploaded the passport scan, please review.', sentAt: '2026-04-16T07:35:00Z', direction: 'inbound' },
      { id: 'm-2', senderName: 'Nadia R.', senderRole: 'agent', message: 'I am checking it now.', sentAt: '2026-04-16T07:38:00Z', direction: 'outbound' },
      { id: 'm-3', senderName: 'Sana Malik', senderRole: 'user', message: 'Can you confirm if my passport scan is acceptable?', sentAt: '2026-04-16T07:40:00Z', direction: 'inbound' }
    ]
  },
  {
    id: 'chat-102',
    userName: 'Oliver Dean',
    userEmail: 'oliver.dean@example.com',
    lastMessage: 'Thanks, received the payment receipt.',
    assignedAgent: 'Jordan M.',
    assignedOwnerEmail: 'jordan.m@ausvisaservice.com',
    status: 'Resolved',
    priority: 'Medium',
    unreadCount: 0,
    channel: 'Email',
    lastActivity: '2026-04-15T19:00:00Z',
    deletedAt: null,
    transcript: [
      { id: 'm-4', senderName: 'Jordan M.', senderRole: 'agent', message: 'Your payment receipt is attached.', sentAt: '2026-04-15T18:55:00Z', direction: 'outbound' },
      { id: 'm-5', senderName: 'Oliver Dean', senderRole: 'user', message: 'Thanks, received the payment receipt.', sentAt: '2026-04-15T19:00:00Z', direction: 'inbound' }
    ]
  },
  {
    id: 'chat-103',
    userName: 'Aisha Farooq',
    userEmail: 'aisha.farooq@example.com',
    lastMessage: 'Still waiting for manager review.',
    assignedAgent: 'Escalation Queue',
    assignedOwnerEmail: 'queue@ausvisaservice.com',
    status: 'Pending',
    priority: 'Urgent',
    unreadCount: 5,
    channel: 'WhatsApp',
    lastActivity: '2026-04-16T05:20:00Z',
    deletedAt: null,
    transcript: [
      { id: 'm-6', senderName: 'Aisha Farooq', senderRole: 'user', message: 'Still waiting for manager review.', sentAt: '2026-04-16T05:20:00Z', direction: 'inbound' }
    ]
  },
  {
    id: 'chat-104',
    userName: 'Mateo Rossi',
    userEmail: 'mateo.rossi@example.com',
    lastMessage: 'Conversation archived by admin',
    assignedAgent: 'Mikael D.',
    assignedOwnerEmail: 'mikael.d@ausvisaservice.com',
    status: 'Closed',
    priority: 'Low',
    unreadCount: 0,
    channel: 'Facebook',
    lastActivity: '2026-04-12T11:00:00Z',
    deletedAt: '2026-04-13T06:00:00Z',
    transcript: [
      { id: 'm-7', senderName: 'System', senderRole: 'system', message: 'Conversation archived by admin', sentAt: '2026-04-13T06:00:00Z', direction: 'outbound' }
    ]
  }
];

const mockFilterConversations = (request: ListUserChatsRequestDto): UserChatConversation[] => {
  const search = request.search?.trim().toLowerCase() ?? '';
  return mockConversations.filter((conversation) => {
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
};

const buildExportText = (conversation: UserChatConversation): string => {
  const lines = [`Conversation: ${conversation.id}`, `User: ${conversation.userName} <${conversation.userEmail}>`, `Assigned: ${conversation.assignedAgent}`, ''];
  conversation.transcript.forEach((message: ChatMessage) => {
    lines.push(`[${message.sentAt}] ${message.senderName}: ${message.message}`);
  });
  return lines.join('\n');
};

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(payload.message ?? 'Failed to complete chats request.');
  }

  return response.json() as Promise<T>;
};

const listFromApi = async (request: ListUserChatsRequestDto): Promise<ListUserChatsResponse> => {
  const params = new URLSearchParams({
    page: String(request.page),
    page_size: String(request.page_size),
    search: request.search ?? ''
  });
  Object.entries(request.filters).forEach(([key, value]) => {
    params.set(key, value);
  });
  return fetchJson<ListUserChatsResponse>(`${CHATS_API_BASE}?${params.toString()}`);
};

const listFromMock = async (request: ListUserChatsRequestDto): Promise<ListUserChatsResponse> => {
  await delay();
  const filtered = mockFilterConversations(request).sort((a, b) => toEpoch(b.lastActivity) - toEpoch(a.lastActivity));
  const start = (request.page - 1) * request.page_size;
  const items = filtered.slice(start, start + request.page_size);
  return { items, meta: { total: filtered.length, page: request.page, pageSize: request.page_size } };
};

const softDeleteFromApi = async (conversationId: string): Promise<void> => {
  await fetchJson<{ ok: boolean }>(`${CHATS_API_BASE}/${conversationId}/soft-delete`, { method: 'POST', body: JSON.stringify({}) });
};

const exportThreadFromApi = async (conversationId: string): Promise<string> => {
  const response = await fetch(`${CHATS_API_BASE}/${conversationId}/export`, { method: 'GET' });
  if (!response.ok) {
    throw new Error('Failed to export conversation transcript.');
  }
  return response.text();
};

const assignOwnerFromApi = async (payload: AssignConversationOwnerRequest): Promise<UserChatConversation> => {
  return fetchJson<UserChatConversation>(`${CHATS_API_BASE}/${payload.conversationId}/assign-owner`, {
    method: 'POST',
    body: JSON.stringify({ ownerEmail: payload.ownerEmail, ownerName: payload.ownerName })
  });
};

export const chatsService = {
  async list(request: ListUserChatsRequestDto): Promise<ListUserChatsResponse> {
    if (USE_BACKEND_API) {
      try {
        return await listFromApi(request);
      } catch {
        return listFromMock(request);
      }
    }
    return listFromMock(request);
  },

  async softDelete(conversationId: string): Promise<void> {
    if (USE_BACKEND_API) {
      try {
        await softDeleteFromApi(conversationId);
        return;
      } catch {
        // fallback to mock store
      }
    }

    await delay();
    mockConversations = mockConversations.map((conversation) =>
      conversation.id === conversationId
        ? { ...conversation, deletedAt: new Date().toISOString(), status: 'Closed', unreadCount: 0, lastMessage: 'Conversation soft-deleted.' }
        : conversation
    );
  },

  async exportThreadTranscript(conversationId: string): Promise<string> {
    if (USE_BACKEND_API) {
      try {
        return await exportThreadFromApi(conversationId);
      } catch {
        // fallback to mock export
      }
    }

    await delay(120);
    const conversation = mockConversations.find((item) => item.id === conversationId);
    if (!conversation) {
      throw new Error('Conversation not found.');
    }
    return buildExportText(conversation);
  },

  async assignOwner(payload: AssignConversationOwnerRequest): Promise<UserChatConversation> {
    if (USE_BACKEND_API) {
      try {
        return await assignOwnerFromApi(payload);
      } catch {
        // fallback to mock update
      }
    }

    await delay(120);
    const target = mockConversations.find((item) => item.id === payload.conversationId);
    if (!target) {
      throw new Error('Conversation not found.');
    }

    const updated: UserChatConversation = {
      ...target,
      assignedAgent: payload.ownerName,
      assignedOwnerEmail: payload.ownerEmail,
      lastActivity: new Date().toISOString()
    };
    mockConversations = mockConversations.map((item) => (item.id === payload.conversationId ? updated : item));
    return updated;
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
