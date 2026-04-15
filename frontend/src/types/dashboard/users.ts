import { DashboardListResponse } from './query';
import { DashboardUserRole } from './applications';

export type UserSegment = 'Registered' | 'Lead';
export type UserPurchaseState = 'Purchased' | 'Abandoned';
export type UserStatus = 'active' | 'deactivated' | 'deleted';
export type SpendBand = 'All' | '0-99' | '100-499' | '500+';

export type UserActivityEvent = {
  id: string;
  label: string;
  occurredAt: string;
  actor: string;
  type: 'activity' | 'application' | 'payment' | 'support';
};

export type PortalUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  segment: UserSegment;
  purchased: boolean;
  source: string;
  country: string;
  spentUsd: number;
  lastSeen: string;
  lastSeenAt: string;
  status: UserStatus;
  isLead: boolean;
  roleScope: Exclude<DashboardUserRole, 'user'> | 'editor';
  timeline: UserActivityEvent[];
};

export type UserDto = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  normalized_phone: string;
  segment: 'registered' | 'lead';
  purchased: boolean;
  source: string;
  country: string;
  spent_usd: number;
  last_seen: string;
  last_seen_at: string;
  status: UserStatus;
  role_scope: 'admin' | 'manager' | 'editor';
  timeline: UserActivityEvent[];
};

export type UsersFilters = {
  segment: 'All' | UserSegment;
  purchase: 'All' | UserPurchaseState;
  source: 'All' | string;
  country: 'All' | string;
  lastSeenDays: 'All' | '7' | '30' | '90';
  spendBand: SpendBand;
  includeDeleted: 'false' | 'true';
};

export type ListUsersRequestDto = {
  page: number;
  page_size: number;
  search?: string;
  filters: UsersFilters;
};

export type ListUsersResponseDto = DashboardListResponse<UserDto>;

export type UpsertUserRequest = {
  full_name: string;
  email: string;
  phone: string;
  segment: UserDto['segment'];
  purchased: boolean;
  source: string;
  country: string;
  role_scope: UserDto['role_scope'];
};

export type UserImportRow = {
  full_name: string;
  email: string;
  phone: string;
  segment: UserDto['segment'];
  purchased: boolean;
  source: string;
  country: string;
  role_scope: UserDto['role_scope'];
};

export type UserImportValidationError = {
  row: number;
  field: keyof UserImportRow;
  message: string;
};

export type UserImportReport = {
  importedCount: number;
  rejectedCount: number;
  errors: UserImportValidationError[];
};
