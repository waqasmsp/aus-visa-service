import { ApplicationStatus, ApplicationSlaRisk, VisaApplication, VisaApplicationDto } from '../../../types/dashboard/applications';

const statusToUi: Record<VisaApplicationDto['status'], VisaApplication['status']> = {
  submitted: 'Submitted',
  in_review: 'In Review',
  documents_needed: 'Documents Needed',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected'
};

const statusToDto: Record<ApplicationStatus, VisaApplicationDto['status']> = {
  Submitted: 'submitted',
  'In Review': 'in_review',
  'Documents Needed': 'documents_needed',
  Approved: 'approved',
  Completed: 'completed',
  Rejected: 'rejected'
};

const priorityToUi: Record<VisaApplicationDto['priority'], VisaApplication['priority']> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High'
};

const priorityToDto: Record<VisaApplication['priority'], VisaApplicationDto['priority']> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high'
};

const slaRiskToUi: Record<VisaApplicationDto['sla_risk'], ApplicationSlaRisk> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

const slaRiskToDto: Record<ApplicationSlaRisk, VisaApplicationDto['sla_risk']> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Critical: 'critical'
};

export const mapApplicationDtoToUi = (dto: VisaApplicationDto): VisaApplication => ({
  id: dto.id,
  applicant: dto.applicant,
  email: dto.email,
  visaType: dto.visa_type,
  destinationCountry: dto.destination_country,
  priority: priorityToUi[dto.priority],
  assignedTo: dto.assigned_to,
  submittedOn: dto.submitted_on,
  status: statusToUi[dto.status],
  slaRisk: slaRiskToUi[dto.sla_risk],
  ownerId: dto.owner_id,
  isDeleted: dto.is_deleted,
  deletedAt: dto.deleted_at,
  timeline: dto.timeline,
  notes: dto.notes,
  documentSummary: dto.document_summary,
  auditEvents: dto.audit_events
});

export const mapApplicationStatusToDto = (status: ApplicationStatus): VisaApplicationDto['status'] => statusToDto[status];

export const mapApplicationPriorityToDto = (priority: VisaApplication['priority']): VisaApplicationDto['priority'] => priorityToDto[priority];

export const mapSlaRiskToDto = (risk: ApplicationSlaRisk): VisaApplicationDto['sla_risk'] => slaRiskToDto[risk];
