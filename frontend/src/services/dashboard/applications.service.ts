import {
  ApplicationFilters,
  ApplicationStatus,
  BulkAssignOwnerRequest,
  BulkStatusUpdateRequest,
  CreateApplicationRequestDto,
  DashboardUserRole,
  ListApplicationsRequestDto,
  UpdateApplicationRequestDto,
  VisaApplication,
  VisaApplicationDto
} from '../../types/dashboard/applications';
import { DashboardListResponse } from '../../types/dashboard/query';
import { assertPermission, DestructiveApprovalContext, enforceDestructiveApproval } from './authPolicy';
import { writeAuditEvent } from './audit.service';
import { mapApplicationDtoToUi, mapApplicationStatusToDto } from './mappers/applications.mapper';
import { trackAdminEvent } from './dashboardAnalytics.service';
import { dashboardDbFetch } from './dbClient';

const DELETE_RESTORE_WINDOW_MS = 1000 * 60 * 15;

type ApplicationDbRow = {
  id: string;
  applicant: string;
  email: string;
  visa_type: string;
  destination_country: string;
  priority: 'low' | 'medium' | 'high';
  status: 'submitted' | 'in_review' | 'documents_needed' | 'approved' | 'completed' | 'rejected';
  sla_risk: 'low' | 'medium' | 'high' | 'critical';
  owner_id: string;
  assigned_to: string | null;
  submitted_on: string;
  is_deleted: boolean;
  deleted_at: string | null;
};

type ProfileLite = { id: string; email: string | null; full_name: string | null };

type ViewerContext = { viewerEmail?: string; actorRole?: DashboardUserRole };

const toTimestamp = (date: string): number => new Date(`${date}T00:00:00Z`).getTime();

const matchesFilters = (application: VisaApplicationDto, filters: ApplicationFilters): boolean => {
  if (filters.status !== 'All' && application.status !== filters.status.toLowerCase().replace(/\s+/g, '_')) return false;
  if (filters.priority !== 'All' && application.priority !== filters.priority.toLowerCase()) return false;
  if (filters.assignedAgent !== 'All' && application.assigned_to !== filters.assignedAgent) return false;
  if (filters.visaType !== 'All' && application.visa_type !== filters.visaType) return false;
  if (filters.destinationCountry !== 'All' && application.destination_country !== filters.destinationCountry) return false;
  if (filters.slaRisk !== 'All' && application.sla_risk !== filters.slaRisk.toLowerCase()) return false;
  if (filters.includeDeleted !== 'true' && application.is_deleted) return false;
  if (filters.submissionDateFrom && toTimestamp(application.submitted_on) < toTimestamp(filters.submissionDateFrom)) return false;
  if (filters.submissionDateTo && toTimestamp(application.submitted_on) > toTimestamp(filters.submissionDateTo)) return false;
  return true;
};

const compareValues = (a: string, b: string, direction: 'asc' | 'desc'): number => {
  const result = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
};

const toDtoStatus = (status: ApplicationStatus): VisaApplicationDto['status'] => mapApplicationStatusToDto(status);

const fetchProfiles = async (): Promise<ProfileLite[]> => {
  return dashboardDbFetch<ProfileLite[]>('profiles', undefined, { select: 'id,email,full_name', limit: '5000' });
};

const resolveProfileIdByEmail = async (email?: string): Promise<string | null> => {
  if (!email) return null;
  const records = await dashboardDbFetch<Array<{ id: string }>>('profiles', undefined, {
    select: 'id',
    email: `eq.${email}`,
    limit: '1'
  });
  return records[0]?.id ?? null;
};

const enrichApplications = async (rows: ApplicationDbRow[]): Promise<VisaApplicationDto[]> => {
  const profiles = await fetchProfiles();
  const profileById = new Map(profiles.map((item) => [item.id, item]));
  const ids = rows.map((row) => row.id);

  const [notesRows, timelineRows, auditRows, docStatsRows] = await Promise.all([
    ids.length
      ? dashboardDbFetch<Array<{ id: string; application_id: string; author: string; created_at: string; message: string }>>('application_notes', undefined, { select: 'id,application_id,author,created_at,message', application_id: `in.(${ids.join(',')})`, order: 'created_at.desc' })
      : Promise.resolve([]),
    ids.length
      ? dashboardDbFetch<Array<{ id: string; application_id: string; label: string; occurred_at: string; actor: string }>>('application_timeline_events', undefined, { select: 'id,application_id,label,occurred_at,actor', application_id: `in.(${ids.join(',')})`, order: 'occurred_at.desc' })
      : Promise.resolve([]),
    ids.length
      ? dashboardDbFetch<Array<{ id: string; application_id: string; action: string; actor: string; timestamp: string }>>('application_audit_events', undefined, { select: 'id,application_id,action,actor,timestamp', application_id: `in.(${ids.join(',')})`, order: 'timestamp.desc' })
      : Promise.resolve([]),
    ids.length
      ? dashboardDbFetch<Array<{ application_id: string; total: number; verified: number; pending: number; rejected: number }>>('application_document_stats', undefined, { select: 'application_id,total,verified,pending,rejected', application_id: `in.(${ids.join(',')})` })
      : Promise.resolve([])
  ]);

  return rows.map((row) => {
    const assignedProfile = row.assigned_to ? profileById.get(row.assigned_to) : null;
    const ownerProfile = profileById.get(row.owner_id);
    const notes = notesRows.filter((item) => item.application_id === row.id).map((item) => ({ id: item.id, author: item.author, createdAt: item.created_at, message: item.message }));
    const timeline = timelineRows.filter((item) => item.application_id === row.id).map((item) => ({ id: item.id, label: item.label, occurredAt: item.occurred_at, actor: item.actor }));
    const audit_events = auditRows.filter((item) => item.application_id === row.id).map((item) => ({ id: item.id, action: item.action, actor: item.actor, timestamp: item.timestamp }));
    const document = docStatsRows.find((item) => item.application_id === row.id);

    return {
      id: row.id,
      applicant: row.applicant,
      email: row.email,
      visa_type: row.visa_type,
      destination_country: row.destination_country,
      priority: row.priority,
      assigned_to: assignedProfile?.full_name ?? assignedProfile?.email ?? 'Unassigned',
      submitted_on: row.submitted_on,
      status: row.status,
      sla_risk: row.sla_risk,
      owner_id: ownerProfile?.email ?? row.owner_id,
      is_deleted: row.is_deleted,
      deleted_at: row.deleted_at,
      timeline,
      notes,
      document_summary: {
        total: document?.total ?? 0,
        verified: document?.verified ?? 0,
        pending: document?.pending ?? 0,
        rejected: document?.rejected ?? 0
      },
      audit_events
    };
  });
};

export const applicationsService = {
  async list(request: ListApplicationsRequestDto, context: ViewerContext = {}): Promise<DashboardListResponse<VisaApplication>> {
    const allRows = await dashboardDbFetch<ApplicationDbRow[]>('visa_applications', undefined, {
      select: 'id,applicant,email,visa_type,destination_country,priority,status,sla_risk,owner_id,assigned_to,submitted_on,is_deleted,deleted_at',
      order: 'submitted_on.desc',
      limit: '5000'
    });
    const normalizedSearch = request.search?.trim().toLowerCase() ?? '';
    const viewerProfileId = await resolveProfileIdByEmail(context.viewerEmail);

    const visibleRows = allRows.filter((row) => {
      if (context.actorRole === 'user' && viewerProfileId) {
        return row.owner_id === viewerProfileId || row.assigned_to === viewerProfileId;
      }
      return true;
    });

    const enriched = await enrichApplications(visibleRows);
    const filtered = enriched.filter((application) => {
      const matchesQuery = !normalizedSearch || [application.id, application.applicant, application.email].some((value) => value.toLowerCase().includes(normalizedSearch));
      return matchesQuery && matchesFilters(application, request.filters);
    });

    const sortField = request.sort_field ?? 'submitted_on';
    const sortDirection = request.sort_direction ?? 'desc';
    filtered.sort((a, b) => {
      const left = String((a as Record<string, unknown>)[sortField] ?? '');
      const right = String((b as Record<string, unknown>)[sortField] ?? '');
      return compareValues(left, right, sortDirection);
    });

    const start = (request.page - 1) * request.page_size;
    const paged = filtered.slice(start, start + request.page_size);

    return {
      items: paged.map(mapApplicationDtoToUi),
      meta: { total: filtered.length, page: request.page, pageSize: request.page_size }
    };
  },

  async create(payload: CreateApplicationRequestDto, actorRole: DashboardUserRole): Promise<VisaApplication> {
    assertPermission(actorRole, 'applications', 'create');
    const ownerProfileId = await resolveProfileIdByEmail(payload.owner_id);
    const assignedProfileId = await resolveProfileIdByEmail(payload.assigned_to);
    if (!ownerProfileId) throw new Error('Owner profile not found for this email.');

    const createdRows = await dashboardDbFetch<ApplicationDbRow[]>(
      'visa_applications?select=id,applicant,email,visa_type,destination_country,priority,status,sla_risk,owner_id,assigned_to,submitted_on,is_deleted,deleted_at',
      {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify([{ ...payload, owner_id: ownerProfileId, assigned_to: assignedProfileId, sla_risk: 'low' }])
      }
    );
    const created = (await enrichApplications([createdRows[0]]))[0];
    writeAuditEvent({ actor: actorRole, action: 'create', entityType: 'applications', entityId: created.id, before: null, after: created });
    trackAdminEvent({ name: 'applications_created', module: 'applications', actorRole, entityId: created.id, status: 'success' });
    return mapApplicationDtoToUi(created);
  },

  async update(id: string, payload: UpdateApplicationRequestDto, actorRole: DashboardUserRole): Promise<VisaApplication> {
    assertPermission(actorRole, 'applications', 'edit');
    const assignedProfileId = payload.assigned_to ? await resolveProfileIdByEmail(payload.assigned_to) : undefined;
    const ownerProfileId = payload.owner_id ? await resolveProfileIdByEmail(payload.owner_id) : undefined;

    const updatedRows = await dashboardDbFetch<ApplicationDbRow[]>(
      `visa_applications?id=eq.${id}&select=id,applicant,email,visa_type,destination_country,priority,status,sla_risk,owner_id,assigned_to,submitted_on,is_deleted,deleted_at`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ ...payload, assigned_to: assignedProfileId, owner_id: ownerProfileId })
      }
    );
    if (!updatedRows[0]) throw new Error('Application not found.');
    const updated = (await enrichApplications([updatedRows[0]]))[0];
    writeAuditEvent({ actor: actorRole, action: 'edit', entityType: 'applications', entityId: id, before: null, after: updated });
    trackAdminEvent({ name: 'applications_updated', module: 'applications', actorRole, entityId: id, status: 'success' });
    return mapApplicationDtoToUi(updated);
  },

  async softDelete(id: string, actorRole: DashboardUserRole, approval?: DestructiveApprovalContext): Promise<void> {
    assertPermission(actorRole, 'applications', 'delete');
    enforceDestructiveApproval('applications', 'delete', approval);
    await dashboardDbFetch<void>(`visa_applications?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_deleted: true, deleted_at: new Date().toISOString() }) });
    trackAdminEvent({ name: 'applications_deleted', module: 'applications', actorRole, entityId: id, status: 'success' });
  },

  async restore(id: string, actorRole: DashboardUserRole): Promise<void> {
    assertPermission(actorRole, 'applications', 'edit');
    const rows = await dashboardDbFetch<Array<{ deleted_at: string | null }>>('visa_applications', undefined, { select: 'deleted_at', id: `eq.${id}`, limit: '1' });
    const deletedAt = rows[0]?.deleted_at ? new Date(rows[0].deleted_at).getTime() : 0;
    if (!deletedAt || Date.now() - deletedAt > DELETE_RESTORE_WINDOW_MS) throw new Error('Restore window expired for this application.');
    await dashboardDbFetch<void>(`visa_applications?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ is_deleted: false, deleted_at: null }) });
    trackAdminEvent({ name: 'applications_restored', module: 'applications', actorRole, entityId: id, status: 'success' });
  },

  async bulkAssignOwner(payload: BulkAssignOwnerRequest, actorRole: DashboardUserRole): Promise<void> {
    assertPermission(actorRole, 'applications', 'edit');
    const ownerId = await resolveProfileIdByEmail(payload.owner);
    if (!ownerId) throw new Error('Selected owner profile not found.');
    await Promise.all(payload.ids.map((id) => dashboardDbFetch<void>(`visa_applications?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ assigned_to: ownerId }) })));
  },

  async bulkStatusUpdate(payload: BulkStatusUpdateRequest, actorRole: DashboardUserRole): Promise<void> {
    assertPermission(actorRole, 'applications', 'edit');
    const mappedStatus = toDtoStatus(payload.status);
    await Promise.all(payload.ids.map((id) => dashboardDbFetch<void>(`visa_applications?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status: mappedStatus }) })));
  },

  async exportSelected(ids: string[], actorRole: DashboardUserRole): Promise<string> {
    assertPermission(actorRole, 'applications', 'view');
    return `export://${ids.join(',')}`;
  }
};
