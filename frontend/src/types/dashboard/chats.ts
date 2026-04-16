import { DashboardListResponse } from './query';

export type ChatConversationStatus = 'Open' | 'Pending' | 'Resolved' | 'Closed';
export type ChatPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ChatChannel = 'Live Chat' | 'Email' | 'WhatsApp' | 'Facebook';

export type ChatMessageDirection = 'inbound' | 'outbound';

export type ChatMessage = {
  id: string;
  senderName: string;
  senderRole: 'user' | 'agent' | 'system';
  message: string;
  sentAt: string;
  direction: ChatMessageDirection;
};

export type UserChatConversation = {
  id: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  lastMessage: string;
  assignedAgent: string;
  assignedOwnerEmail: string;
  status: ChatConversationStatus;
  priority: ChatPriority;
  unreadCount: number;
  channel: ChatChannel;
  lastActivity: string;
  deletedAt: string | null;
  transcript: ChatMessage[];
};

export type UserChatsFilters = {
  dateFrom: string;
  dateTo: string;
  status: 'All' | ChatConversationStatus;
  priority: 'All' | ChatPriority;
  agent: 'All' | string;
  channel: 'All' | ChatChannel;
  includeDeleted: 'false' | 'true';
};

export type ListUserChatsRequestDto = {
  page: number;
  page_size: number;
  search?: string;
  filters: UserChatsFilters;
};

export type AssignConversationOwnerRequest = {
  conversationId: string;
  ownerEmail: string;
  ownerName: string;
};

export type ListUserChatsResponse = DashboardListResponse<UserChatConversation>;
