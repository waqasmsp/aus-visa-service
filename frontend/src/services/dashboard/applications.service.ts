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
import { delay } from './async';
import { assertPermission, DestructiveApprovalContext, enforceDestructiveApproval } from './authPolicy';
import { writeAuditEvent } from './audit.service';
import { mapApplicationDtoToUi, mapApplicationStatusToDto } from './mappers/applications.mapper';
import { trackAdminEvent } from './dashboardAnalytics.service';

const DELETE_RESTORE_WINDOW_MS = 1000 * 60 * 15;

const applicationStore: VisaApplicationDto[] = [
  {
    id: 'AUS-24019',
    applicant: 'Sophia Collins',
    email: 'sophia.c@example.com',
    visa_type: 'Tourist Visa',
    destination_country: 'Australia',
    priority: 'high',
    assigned_to: 'Nadia R.',
    submitted_on: '2026-04-11',
    status: 'in_review',
    sla_risk: 'high',
    owner_id: 'manager@ausvisaservice.com',
    is_deleted: false,
    deleted_at: null,
    timeline: [{ id: 't1', label: 'Application submitted', occurredAt: '2026-04-11T10:30:00Z', actor: 'Sophia Collins' }],
    notes: [{ id: 'n1', author: 'Nadia R.', createdAt: '2026-04-12T08:00:00Z', message: 'Awaiting final passport verification.' }],
    document_summary: { total: 8, verified: 6, pending: 2, rejected: 0 },
    audit_events: [{ id: 'a1', action: 'status_changed_in_review', actor: 'Nadia R.', timestamp: '2026-04-12T08:00:00Z' }]
  },
  {
    id: 'AUS-24020', applicant: 'Bilal Ahmed', email: 'bilal.ahmed@example.com', visa_type: 'Business Visa', destination_country: 'Australia', priority: 'medium', assigned_to: 'Mikael D.', submitted_on: '2026-04-10', status: 'documents_needed', sla_risk: 'critical', owner_id: 'user@ausvisaservice.com', is_deleted: false, deleted_at: null,
    timeline: [{ id: 't2', label: 'Documents requested', occurredAt: '2026-04-11T09:10:00Z', actor: 'Mikael D.' }], notes: [{ id: 'n2', author: 'Mikael D.', createdAt: '2026-04-11T09:10:00Z', message: 'Need updated bank statement.' }], document_summary: { total: 7, verified: 4, pending: 1, rejected: 2 }, audit_events: [{ id: 'a2', action: 'documents_requested', actor: 'Mikael D.', timestamp: '2026-04-11T09:10:00Z' }]
  },
  {
    id: 'AUS-24021', applicant: 'Grace Thomas', email: 'grace.t@example.com', visa_type: 'Family Visa', destination_country: 'New Zealand', priority: 'low', assigned_to: 'Nadia R.', submitted_on: '2026-04-09', status: 'submitted', sla_risk: 'low', owner_id: 'user@ausvisaservice.com', is_deleted: false, deleted_at: null,
    timeline: [{ id: 't3', label: 'Application submitted', occurredAt: '2026-04-09T11:00:00Z', actor: 'Grace Thomas' }], notes: [], document_summary: { total: 6, verified: 5, pending: 1, rejected: 0 }, audit_events: [{ id: 'a3', action: 'application_created', actor: 'Grace Thomas', timestamp: '2026-04-09T11:00:00Z' }]
  },
  {
    id: 'AUS-24022', applicant: 'Ibrahim Khan', email: 'ibrahim.k@example.com', visa_type: 'Student Visa', destination_country: 'Australia', priority: 'high', assigned_to: 'Jordan M.', submitted_on: '2026-04-06', status: 'approved', sla_risk: 'medium', owner_id: 'user@ausvisaservice.com', is_deleted: false, deleted_at: null,
    timeline: [{ id: 't4', label: 'Approved', occurredAt: '2026-04-07T13:20:00Z', actor: 'Jordan M.' }], notes: [{ id: 'n4', author: 'Jordan M.', createdAt: '2026-04-07T13:20:00Z', message: 'Approved and ready to issue.' }], document_summary: { total: 9, verified: 9, pending: 0, rejected: 0 }, audit_events: [{ id: 'a4', action: 'application_approved', actor: 'Jordan M.', timestamp: '2026-04-07T13:20:00Z' }]
  },
  {
    id: 'AUS-24023', applicant: 'Liam Cooper', email: 'liam.cooper@example.com', visa_type: 'Tourist Visa', destination_country: 'Australia', priority: 'medium', assigned_to: 'Nina K.', submitted_on: '2026-04-04', status: 'completed', sla_risk: 'low', owner_id: 'user@ausvisaservice.com', is_deleted: false, deleted_at: null,
    timeline: [{ id: 't5', label: 'Completed', occurredAt: '2026-04-05T16:45:00Z', actor: 'Nina K.' }], notes: [], document_summary: { total: 5, verified: 5, pending: 0, rejected: 0 }, audit_events: [{ id: 'a5', action: 'application_completed', actor: 'Nina K.', timestamp: '2026-04-05T16:45:00Z' }]
  }
];

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

export const applicationsService = {
  async list(request: ListApplicationsRequestDto): Promise<DashboardListResponse<VisaApplication>> {
    await delay();
    const search = request.search?.trim().toLowerCase() ?? '';
    const filtered = applicationStore.filter((application) => {
      const matchesQuery = !search || [application.id, application.applicant, application.email].some((value) => value.toLowerCase().includes(search));
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
    await delay();
    assertPermission(actorRole, 'applications', 'create');
    const nextId = `AUS-${24000 + applicationStore.length + 1}`;
    const now = new Date().toISOString();
    const created: VisaApplicationDto = {
      id: nextId,
      applicant: payload.applicant,
      email: payload.email,
      visa_type: payload.visa_type,
      destination_country: payload.destination_country,
      priority: payload.priority,
      assigned_to: payload.assigned_to,
      submitted_on: now.slice(0, 10),
      status: payload.status,
      sla_risk: 'low',
      owner_id: payload.owner_id,
      is_deleted: false,
      deleted_at: null,
      timeline: [{ id: `${nextId}-timeline-1`, label: 'Application created', occurredAt: now, actor: payload.assigned_to }],
      notes: [],
      document_summary: { total: 0, verified: 0, pending: 0, rejected: 0 },
      audit_events: [{ id: `${nextId}-audit-1`, action: 'application_created', actor: payload.assigned_to, timestamp: now }]
    };
    applicationStore.unshift(created);
    writeAuditEvent({
      actor: actorRole,
      action: 'create',
      entityType: 'applications',
      entityId: created.id,
      before: null,
      after: created
    });
    trackAdminEvent({ name: 'applications_created', module: 'applications', actorRole, entityId: created.id, status: 'success' });
    return mapApplicationDtoToUi(created);
  },

  async update(id: string, payload: UpdateApplicationRequestDto, actorRole: DashboardUserRole): Promise<VisaApplication> {
    await delay();
    assertPermission(actorRole, 'applications', 'edit');
    const record = applicationStore.find((entry) => entry.id === id);
    if (!record) throw { message: 'Application not found.' };
    const before = { ...record };
    Object.assign(record, payload);
    record.audit_events.unshift({ id: `${id}-audit-${Date.now()}`, action: 'application_updated', actor: payload.assigned_to ?? 'System', timestamp: new Date().toISOString() });
    writeAuditEvent({
      actor: actorRole,
      action: 'edit',
      entityType: 'applications',
      entityId: id,
      before,
      after: record
    });
    trackAdminEvent({ name: 'applications_updated', module: 'applications', actorRole, entityId: id, status: 'success' });
    return mapApplicationDtoToUi(record);
  },

  async softDelete(id: string, actorRole: DashboardUserRole, approval?: DestructiveApprovalContext): Promise<void> {
    await delay();
    assertPermission(actorRole, 'applications', 'delete');
    enforceDestructiveApproval('applications', 'delete', approval);
    const record = applicationStore.find((entry) => entry.id === id);
    if (!record) throw { message: 'Application not found.' };
    const before = { ...record };
    record.is_deleted = true;
    record.deleted_at = new Date().toISOString();
    record.audit_events.unshift({ id: `${id}-audit-${Date.now()}`, action: 'application_soft_deleted', actor: actorRole, timestamp: new Date().toISOString() });
    writeAuditEvent({
      actor: actorRole,
      action: 'delete',
      entityType: 'applications',
      entityId: id,
      before,
      after: { ...record, reason: approval?.reason, secondApprover: approval?.secondApprover }
    });
    trackAdminEvent({ name: 'applications_deleted', module: 'applications', actorRole, entityId: id, status: 'success' });
  },

  async restore(id: string, actorRole: DashboardUserRole): Promise<void> {
    await delay();
    assertPermission(actorRole, 'applications', 'edit');
    const record = applicationStore.find((entry) => entry.id === id);
    if (!record || !record.deleted_at) throw { message: 'Application cannot be restored.' };
    const deletedAt = new Date(record.deleted_at).getTime();
    if (Date.now() - deletedAt > DELETE_RESTORE_WINDOW_MS) throw { message: 'Restore window expired for this application.' };
    record.is_deleted = false;
    record.deleted_at = null;
    record.audit_events.unshift({ id: `${id}-audit-${Date.now()}`, action: 'application_restored', actor: actorRole, timestamp: new Date().toISOString() });
    writeAuditEvent({
      actor: actorRole,
      action: 'restore',
      entityType: 'applications',
      entityId: id,
      before: { ...record, is_deleted: true },
      after: record
    });
    trackAdminEvent({ name: 'applications_restored', module: 'applications', actorRole, entityId: id, status: 'success' });
  },

  async bulkAssignOwner(payload: BulkAssignOwnerRequest, actorRole: DashboardUserRole): Promise<void> {
    await delay();
    assertPermission(actorRole, 'applications', 'edit');
    applicationStore.forEach((entry) => {
      if (payload.ids.includes(entry.id)) {
        entry.assigned_to = payload.owner;
      }
    });
  },

  async bulkStatusUpdate(payload: BulkStatusUpdateRequest, actorRole: DashboardUserRole): Promise<void> {
    await delay();
    assertPermission(actorRole, 'applications', 'edit');
    const mappedStatus = toDtoStatus(payload.status);
    applicationStore.forEach((entry) => {
      if (payload.ids.includes(entry.id)) {
        entry.status = mappedStatus;
      }
    });
  },

  async exportSelected(ids: string[], actorRole: DashboardUserRole): Promise<string> {
    await delay();
    assertPermission(actorRole, 'applications', 'view');
    return `export://${ids.join(',')}`;
  }
};
