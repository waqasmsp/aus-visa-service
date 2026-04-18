import {
  ListUsersRequestDto,
  PortalUser,
  UpsertUserRequest,
  UserImportReport,
  UserImportRow,
  UserImportValidationError
} from '../../types/dashboard/users';
import { DashboardListResponse } from '../../types/dashboard/query';
import { DashboardUserRole } from '../../types/dashboard/applications';
import { assertPermission, DestructiveApprovalContext, enforceDestructiveApproval } from './authPolicy';
import { writeAuditEvent } from './audit.service';
import { trackAdminEvent } from './dashboardAnalytics.service';
import { mapUserDtoToUi } from './mappers/users.mapper';
import { dashboardDbFetch } from './dbClient';

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  source: string | null;
  status: string | null;
  last_seen_at: string | null;
};

type ActivityRow = { id: number; profile_id: string; event_type: 'activity' | 'application' | 'payment' | 'support'; event_action: string; event_at: string };

const normalizePhone = (value: string): string => value.replace(/[^\d+]/g, '').replace(/^00/, '+');

const withinLastSeenRange = (isoDate: string, lastSeenDays: ListUsersRequestDto['filters']['lastSeenDays']) => {
  if (lastSeenDays === 'All') return true;
  const days = Number(lastSeenDays);
  const diff = Date.now() - new Date(isoDate).getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
};

const withinSpendBand = (spent: number, band: ListUsersRequestDto['filters']['spendBand']) => {
  if (band === 'All') return true;
  if (band === '0-99') return spent <= 99;
  if (band === '100-499') return spent >= 100 && spent <= 499;
  return spent >= 500;
};

const toRelativeLastSeen = (iso: string | null): string => {
  if (!iso) return 'unknown';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const validateImportRow = (row: UserImportRow, index: number): UserImportValidationError[] => {
  const errors: UserImportValidationError[] = [];
  if (!row.full_name.trim()) errors.push({ row: index, field: 'full_name', message: 'Name is required.' });
  if (!/^\S+@\S+\.\S+$/.test(row.email)) errors.push({ row: index, field: 'email', message: 'Email is invalid.' });
  if (normalizePhone(row.phone).length < 7) errors.push({ row: index, field: 'phone', message: 'Phone is invalid.' });
  if (!['registered', 'lead'].includes(row.segment)) errors.push({ row: index, field: 'segment', message: 'Segment must be registered or lead.' });
  if (!['admin', 'manager', 'editor'].includes(row.role_scope)) errors.push({ row: index, field: 'role_scope', message: 'Role scope is invalid.' });
  return errors;
};

const listProfiles = async (): Promise<ProfileRow[]> => {
  return dashboardDbFetch<ProfileRow[]>('profiles', undefined, { select: 'id,full_name,email,phone,country,source,status,last_seen_at', limit: '5000', order: 'last_seen_at.desc.nullslast' });
};

const listActivities = async (): Promise<ActivityRow[]> => {
  return dashboardDbFetch<ActivityRow[]>('user_activity_events', undefined, { select: 'id,profile_id,event_type,event_action,event_at', limit: '10000', order: 'event_at.desc' });
};

const upsertProfile = async (id: string, payload: Partial<ProfileRow>): Promise<ProfileRow> => {
  const records = await dashboardDbFetch<ProfileRow[]>(`profiles?id=eq.${id}&select=id,full_name,email,phone,country,source,status,last_seen_at`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload)
  });
  if (!records[0]) {
    throw new Error('User record not found.');
  }
  return records[0];
};

export const usersService = {
  async list(request: ListUsersRequestDto): Promise<DashboardListResponse<PortalUser>> {
    const [profiles, activities] = await Promise.all([listProfiles(), listActivities()]);
    const activityMap = new Map<string, ActivityRow[]>();
    activities.forEach((row) => {
      const list = activityMap.get(row.profile_id) ?? [];
      list.push(row);
      activityMap.set(row.profile_id, list);
    });

    const userDtos = profiles.map((profile) => {
      const timelineRows = activityMap.get(profile.id) ?? [];
      const spent = timelineRows.filter((item) => item.event_type === 'payment').length * 149;
      return {
        id: profile.id,
        full_name: profile.full_name ?? 'Unknown',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        normalized_phone: normalizePhone(profile.phone ?? ''),
        segment: (spent > 0 ? 'registered' : 'lead') as 'registered' | 'lead',
        purchased: spent > 0,
        source: profile.source ?? 'Direct',
        country: profile.country ?? 'Unknown',
        spent_usd: spent,
        last_seen: toRelativeLastSeen(profile.last_seen_at),
        last_seen_at: profile.last_seen_at ?? new Date(0).toISOString(),
        status: (profile.status === 'deactivated' ? 'deactivated' : profile.status === 'deleted' ? 'deleted' : 'active') as 'active' | 'deactivated' | 'deleted',
        role_scope: 'editor' as const,
        timeline: timelineRows.map((row) => ({ id: String(row.id), label: row.event_action, occurredAt: row.event_at, actor: 'System', type: row.event_type }))
      };
    });

    const search = request.search?.trim().toLowerCase() ?? '';
    const filtered = userDtos.filter((user) => {
      const matchesQuery = !search || [user.full_name, user.email, user.country, user.phone].some((value) => value.toLowerCase().includes(search));
      const matchesSegment = request.filters.segment === 'All' || (request.filters.segment === 'Registered' && user.segment === 'registered') || (request.filters.segment === 'Lead' && user.segment === 'lead');
      const matchesPurchase = request.filters.purchase === 'All' || (request.filters.purchase === 'Purchased' && user.purchased) || (request.filters.purchase === 'Abandoned' && !user.purchased);
      const matchesSource = request.filters.source === 'All' || user.source === request.filters.source;
      const matchesCountry = request.filters.country === 'All' || user.country === request.filters.country;
      const matchesDeleted = request.filters.includeDeleted === 'true' || user.status !== 'deleted';
      const matchesLastSeen = withinLastSeenRange(user.last_seen_at, request.filters.lastSeenDays);
      const matchesSpend = withinSpendBand(user.spent_usd, request.filters.spendBand);
      return matchesQuery && matchesSegment && matchesPurchase && matchesSource && matchesCountry && matchesDeleted && matchesLastSeen && matchesSpend;
    });

    return {
      items: filtered.map(mapUserDtoToUi),
      meta: { total: filtered.length, page: request.page, pageSize: request.page_size }
    };
  },

  async create(payload: UpsertUserRequest, role: DashboardUserRole): Promise<PortalUser> {
    assertPermission(role, 'users', 'create');
    const rows = await dashboardDbFetch<ProfileRow[]>('profiles?select=id,full_name,email,phone,country,source,status,last_seen_at', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([{ full_name: payload.full_name, email: payload.email, phone: payload.phone, country: payload.country, source: payload.source, status: 'active', last_seen_at: new Date().toISOString() }])
    });
    const record = rows[0];
    const dto = {
      id: record.id,
      full_name: record.full_name ?? payload.full_name,
      email: record.email ?? payload.email,
      phone: record.phone ?? payload.phone,
      normalized_phone: normalizePhone(record.phone ?? payload.phone),
      segment: payload.segment,
      purchased: payload.purchased,
      source: record.source ?? payload.source,
      country: record.country ?? payload.country,
      spent_usd: 0,
      last_seen: 'just now',
      last_seen_at: record.last_seen_at ?? new Date().toISOString(),
      status: 'active' as const,
      role_scope: payload.role_scope,
      timeline: []
    };
    writeAuditEvent({ actor: role, action: 'create', entityType: 'users', entityId: dto.id, before: null, after: dto });
    trackAdminEvent({ name: 'users_created', module: 'users', actorRole: role, entityId: dto.id, status: 'success' });
    return mapUserDtoToUi(dto);
  },

  async update(id: string, payload: Partial<UpsertUserRequest>, role: DashboardUserRole): Promise<PortalUser> {
    assertPermission(role, 'users', 'edit');
    const updated = await upsertProfile(id, { full_name: payload.full_name, email: payload.email, phone: payload.phone, country: payload.country, source: payload.source });
    const dto = {
      id: updated.id,
      full_name: updated.full_name ?? '',
      email: updated.email ?? '',
      phone: updated.phone ?? '',
      normalized_phone: normalizePhone(updated.phone ?? ''),
      segment: (payload.segment ?? 'registered') as 'registered' | 'lead',
      purchased: payload.purchased ?? false,
      source: updated.source ?? 'Direct',
      country: updated.country ?? 'Unknown',
      spent_usd: 0,
      last_seen: toRelativeLastSeen(updated.last_seen_at),
      last_seen_at: updated.last_seen_at ?? new Date().toISOString(),
      status: (updated.status === 'deactivated' ? 'deactivated' : updated.status === 'deleted' ? 'deleted' : 'active') as 'active' | 'deactivated' | 'deleted',
      role_scope: (payload.role_scope ?? 'editor') as 'admin' | 'manager' | 'editor',
      timeline: []
    };
    writeAuditEvent({ actor: role, action: 'edit', entityType: 'users', entityId: id, before: null, after: dto });
    trackAdminEvent({ name: 'users_updated', module: 'users', actorRole: role, entityId: id, status: 'success' });
    return mapUserDtoToUi(dto);
  },

  async setActive(id: string, active: boolean, role: DashboardUserRole): Promise<void> {
    assertPermission(role, 'users', 'edit');
    await upsertProfile(id, { status: active ? 'active' : 'deactivated' });
  },

  async softDelete(id: string, role: DashboardUserRole, approval: DestructiveApprovalContext): Promise<void> {
    assertPermission(role, 'users', 'delete');
    enforceDestructiveApproval('users', 'delete', approval);
    await upsertProfile(id, { status: 'deleted' });
    writeAuditEvent({ actor: role, action: 'delete', entityType: 'users', entityId: id, before: null, after: { ...approval, status: 'deleted' } });
    trackAdminEvent({ name: 'users_deleted', module: 'users', actorRole: role, entityId: id, status: 'success' });
  },

  async importRows(rows: UserImportRow[], role: DashboardUserRole): Promise<UserImportReport> {
    assertPermission(role, 'users', 'create');
    const errors = rows.flatMap((row, index) => validateImportRow(row, index + 1));
    if (errors.length) return { importedCount: 0, rejectedCount: rows.length, errors };
    await Promise.all(rows.map((row) => this.create({ ...row, purchased: false }, role)));
    return { importedCount: rows.length, rejectedCount: 0, errors: [] };
  },

  async exportCsv(filters: ListUsersRequestDto['filters']): Promise<string> {
    const response = await this.list({ page: 1, page_size: 5000, filters, search: '' });
    const header = 'id,name,email,phone,country,status,last_seen_at\n';
    const rows = response.items
      .map((item) => [item.id, item.fullName, item.email, item.phone, item.country, item.status, item.lastSeenAt].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    return `${header}${rows}`;
  }
};
