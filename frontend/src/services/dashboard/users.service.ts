import {
  ListUsersRequestDto,
  PortalUser,
  UpsertUserRequest,
  UserDto,
  UserImportReport,
  UserImportRow,
  UserImportValidationError
} from '../../types/dashboard/users';
import { DashboardListResponse } from '../../types/dashboard/query';
import { DashboardUserRole } from '../../types/dashboard/applications';
import { delay } from './async';
import { assertPermission, DestructiveApprovalContext, enforceDestructiveApproval } from './authPolicy';
import { writeAuditEvent } from './audit.service';
import { mapUserDtoToUi } from './mappers/users.mapper';

const normalizePhone = (value: string): string => value.replace(/[^\d+]/g, '').replace(/^00/, '+');

let userStore: UserDto[] = [
  {
    id: 'usr-1',
    full_name: 'Arman Siddiqui',
    email: 'arman.s@example.com',
    phone: '+92 300 123 9988',
    normalized_phone: '+923001239988',
    segment: 'registered',
    purchased: true,
    source: 'Google Search',
    country: 'Pakistan',
    spent_usd: 149,
    last_seen: '2h ago',
    last_seen_at: '2026-04-15T08:30:00Z',
    status: 'active',
    role_scope: 'editor',
    timeline: [
      { id: 't-1', label: 'Signed in from Lahore', occurredAt: '2026-04-15T08:30:00Z', actor: 'System', type: 'activity' },
      { id: 't-2', label: 'Subclass 600 lodged', occurredAt: '2026-04-12T10:20:00Z', actor: 'Arman Siddiqui', type: 'application' },
      { id: 't-3', label: 'Paid $149 consultation fee', occurredAt: '2026-04-10T13:11:00Z', actor: 'Stripe', type: 'payment' }
    ]
  },
  {
    id: 'usr-2',
    full_name: 'Olivia Brown',
    email: 'olivia.brown@example.com',
    phone: '+44 7700 900111',
    normalized_phone: '+447700900111',
    segment: 'lead',
    purchased: false,
    source: 'Meta Ads',
    country: 'United Kingdom',
    spent_usd: 0,
    last_seen: '1d ago',
    last_seen_at: '2026-04-14T11:00:00Z',
    status: 'active',
    role_scope: 'editor',
    timeline: [
      { id: 't-4', label: 'Requested callback', occurredAt: '2026-04-14T11:00:00Z', actor: 'Olivia Brown', type: 'support' }
    ]
  },
  {
    id: 'usr-3',
    full_name: 'Hassan Ali',
    email: 'hassan.ali@example.com',
    phone: '+971 50 123 1234',
    normalized_phone: '+971501231234',
    segment: 'registered',
    purchased: false,
    source: 'Direct',
    country: 'UAE',
    spent_usd: 0,
    last_seen: '45m ago',
    last_seen_at: '2026-04-15T09:45:00Z',
    status: 'deactivated',
    role_scope: 'manager',
    timeline: [
      { id: 't-5', label: 'Account deactivated by admin', occurredAt: '2026-04-13T16:14:00Z', actor: 'Admin', type: 'activity' }
    ]
  },
  {
    id: 'usr-4',
    full_name: 'Emma Wilson',
    email: 'emma.w@example.com',
    phone: '+1 415 555 0167',
    normalized_phone: '+14155550167',
    segment: 'registered',
    purchased: true,
    source: 'Referral',
    country: 'United States',
    spent_usd: 699,
    last_seen: '4h ago',
    last_seen_at: '2026-04-15T06:00:00Z',
    status: 'active',
    role_scope: 'admin',
    timeline: [
      { id: 't-6', label: 'Paid $550 visa package', occurredAt: '2026-04-11T08:20:00Z', actor: 'Stripe', type: 'payment' }
    ]
  }
];

const findDuplicate = (email: string, phone: string, ignoreId?: string): UserDto | undefined => {
  const normalized = normalizePhone(phone);
  return userStore.find(
    (item) => item.id !== ignoreId && (item.email.toLowerCase() === email.toLowerCase() || item.normalized_phone === normalized)
  );
};

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

const validateImportRow = (row: UserImportRow, index: number): UserImportValidationError[] => {
  const errors: UserImportValidationError[] = [];
  if (!row.full_name.trim()) errors.push({ row: index, field: 'full_name', message: 'Name is required.' });
  if (!/^\S+@\S+\.\S+$/.test(row.email)) errors.push({ row: index, field: 'email', message: 'Email is invalid.' });
  if (normalizePhone(row.phone).length < 7) errors.push({ row: index, field: 'phone', message: 'Phone is invalid.' });
  if (!['registered', 'lead'].includes(row.segment)) errors.push({ row: index, field: 'segment', message: 'Segment must be registered or lead.' });
  if (!['admin', 'manager', 'editor'].includes(row.role_scope)) errors.push({ row: index, field: 'role_scope', message: 'Role scope is invalid.' });
  return errors;
};

export const usersService = {
  async list(request: ListUsersRequestDto): Promise<DashboardListResponse<PortalUser>> {
    await delay();
    const search = request.search?.trim().toLowerCase() ?? '';
    const filtered = userStore.filter((user) => {
      const matchesQuery =
        !search ||
        user.full_name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.country.toLowerCase().includes(search) ||
        user.phone.toLowerCase().includes(search);
      const matchesSegment =
        request.filters.segment === 'All' ||
        (request.filters.segment === 'Registered' && user.segment === 'registered') ||
        (request.filters.segment === 'Lead' && user.segment === 'lead');
      const matchesPurchase =
        request.filters.purchase === 'All' ||
        (request.filters.purchase === 'Purchased' && user.purchased) ||
        (request.filters.purchase === 'Abandoned' && !user.purchased);
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
    await delay();
    assertPermission(role, 'users', 'create');
    const duplicate = findDuplicate(payload.email, payload.phone);
    if (duplicate) {
      throw new Error(`Duplicate detected with ${duplicate.email} / ${duplicate.phone}.`);
    }

    const id = `usr-${Date.now()}`;
    const now = new Date().toISOString();
    const record: UserDto = {
      id,
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      normalized_phone: normalizePhone(payload.phone),
      segment: payload.segment,
      purchased: payload.purchased,
      source: payload.source,
      country: payload.country,
      spent_usd: 0,
      last_seen: 'just now',
      last_seen_at: now,
      status: 'active',
      role_scope: payload.role_scope,
      timeline: [{ id: `${id}-1`, label: 'Profile created', occurredAt: now, actor: role, type: 'activity' }]
    };
    userStore = [record, ...userStore];
    writeAuditEvent({ actor: role, action: 'create', entityType: 'users', entityId: id, before: null, after: record });
    return mapUserDtoToUi(record);
  },

  async update(id: string, payload: Partial<UpsertUserRequest>, role: DashboardUserRole): Promise<PortalUser> {
    await delay();
    assertPermission(role, 'users', 'edit');
    const existing = userStore.find((item) => item.id === id);
    if (!existing) throw new Error('User record not found.');
    const before = { ...existing };

    const nextEmail = payload.email ?? existing.email;
    const nextPhone = payload.phone ?? existing.phone;
    const duplicate = findDuplicate(nextEmail, nextPhone, id);
    if (duplicate) {
      throw new Error(`Duplicate detected with ${duplicate.email} / ${duplicate.phone}.`);
    }

    const updated: UserDto = {
      ...existing,
      full_name: payload.full_name ?? existing.full_name,
      email: nextEmail,
      phone: nextPhone,
      normalized_phone: normalizePhone(nextPhone),
      segment: payload.segment ?? existing.segment,
      purchased: payload.purchased ?? existing.purchased,
      source: payload.source ?? existing.source,
      country: payload.country ?? existing.country,
      role_scope: payload.role_scope ?? existing.role_scope,
      timeline: [
        { id: `${id}-${Date.now()}`, label: 'Profile updated', occurredAt: new Date().toISOString(), actor: role, type: 'activity' },
        ...existing.timeline
      ]
    };
    userStore = userStore.map((item) => (item.id === id ? updated : item));
    writeAuditEvent({ actor: role, action: 'edit', entityType: 'users', entityId: id, before, after: updated });
    return mapUserDtoToUi(updated);
  },

  async setActive(id: string, active: boolean, role: DashboardUserRole): Promise<void> {
    await delay();
    assertPermission(role, 'users', 'edit');
    userStore = userStore.map((item) =>
      item.id === id
        ? {
            ...item,
            status: active ? 'active' : 'deactivated',
            timeline: [
              {
                id: `${id}-${Date.now()}`,
                label: active ? 'Account reactivated' : 'Account deactivated',
                occurredAt: new Date().toISOString(),
                actor: role,
                type: 'activity'
              },
              ...item.timeline
            ]
          }
        : item
    );
  },

  async softDelete(id: string, role: DashboardUserRole, approval: DestructiveApprovalContext): Promise<void> {
    await delay();
    assertPermission(role, 'users', 'delete');
    enforceDestructiveApproval('users', 'delete', approval);
    const existing = userStore.find((item) => item.id === id);
    const before = existing ? { ...existing } : null;
    userStore = userStore.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'deleted',
            timeline: [
              { id: `${id}-${Date.now()}`, label: 'Soft-deleted from CRM view', occurredAt: new Date().toISOString(), actor: role, type: 'activity' },
              ...item.timeline
            ]
          }
        : item
    );
    const after = userStore.find((item) => item.id === id);
    if (after) {
      writeAuditEvent({ actor: role, action: 'delete', entityType: 'users', entityId: id, before, after: { ...after, ...approval } });
    }
  },

  async exportCsv(filters: ListUsersRequestDto['filters']): Promise<string> {
    await delay();
    const rows = (await this.list({ page: 1, page_size: 1000, filters })).items;
    const header = 'id,full_name,email,phone,segment,purchase,source,country,status,role_scope,spent_usd,last_seen\n';
    const body = rows
      .map((row) =>
        [
          row.id,
          row.fullName,
          row.email,
          row.phone,
          row.segment,
          row.purchased ? 'Purchased' : 'Abandoned',
          row.source,
          row.country,
          row.status,
          row.roleScope,
          row.spentUsd,
          row.lastSeen
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    return `${header}${body}`;
  },

  async importRows(rows: UserImportRow[], role: DashboardUserRole): Promise<UserImportReport> {
    await delay();
    assertPermission(role, 'users', 'create');

    const errors: UserImportValidationError[] = [];
    let importedCount = 0;

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      errors.push(...validateImportRow(row, rowNumber));
      const duplicate = findDuplicate(row.email, row.phone);
      if (duplicate) {
        errors.push({ row: rowNumber, field: 'email', message: `Potential duplicate: ${duplicate.email}` });
      }
    });

    if (errors.length === 0) {
      for (const row of rows) {
        await this.create(row, role);
        importedCount += 1;
      }
    }

    return {
      importedCount,
      rejectedCount: errors.length,
      errors
    };
  }
};
