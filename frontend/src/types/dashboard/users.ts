import { DashboardListResponse } from './query';

export type UserSegment = 'Registered' | 'Lead';

export type PortalUser = {
  id: string;
  fullName: string;
  email: string;
  segment: UserSegment;
  purchased: boolean;
  source: string;
  country: string;
  spentUsd: number;
  lastSeen: string;
};

export type UserDto = {
  id: string;
  full_name: string;
  email: string;
  segment: 'registered' | 'lead';
  purchased: boolean;
  source: string;
  country: string;
  spent_usd: number;
  last_seen: string;
};

export type ListUsersRequestDto = {
  page: number;
  page_size: number;
  search?: string;
  segment?: string;
  purchase?: 'purchased' | 'abandoned';
};

export type ListUsersResponseDto = DashboardListResponse<UserDto>;
