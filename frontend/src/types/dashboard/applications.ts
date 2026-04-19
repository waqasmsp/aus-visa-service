import { DashboardListResponse } from './query';

export type DashboardUserRole = 'admin' | 'manager' | 'user';

export type ApplicationStatus = 'Submitted' | 'In Review' | 'Documents Needed' | 'Approved' | 'Completed' | 'Rejected';
export type ApplicationPriority = 'Low' | 'Medium' | 'High';
export type ApplicationSlaRisk = 'Low' | 'Medium' | 'High' | 'Critical';

export type ApplicationTimelineEvent = {
  id: string;
  label: string;
  occurredAt: string;
  actor: string;
};

export type ApplicationNote = {
  id: string;
  author: string;
  createdAt: string;
  message: string;
};

export type ApplicationDocumentSummary = {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
};

export type ApplicationAuditEvent = {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
};

export type VisaApplication = {
  id: string;
  applicant: string;
  email: string;
  visaType: string;
  destinationCountry: string;
  priority: ApplicationPriority;
  assignedTo: string;
  submittedOn: string;
  status: ApplicationStatus;
  slaRisk: ApplicationSlaRisk;
  ownerId: string;
  isDeleted: boolean;
  deletedAt: string | null;
  timeline: ApplicationTimelineEvent[];
  notes: ApplicationNote[];
  documentSummary: ApplicationDocumentSummary;
  auditEvents: ApplicationAuditEvent[];
};

export type VisaApplicationDto = {
  id: string;
  applicant: string;
  email: string;
  visa_type: string;
  destination_country: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to: string;
  submitted_on: string;
  status: 'submitted' | 'in_review' | 'documents_needed' | 'approved' | 'completed' | 'rejected';
  sla_risk: 'low' | 'medium' | 'high' | 'critical';
  owner_id: string;
  is_deleted: boolean;
  deleted_at: string | null;
  timeline: ApplicationTimelineEvent[];
  notes: ApplicationNote[];
  document_summary: ApplicationDocumentSummary;
  audit_events: ApplicationAuditEvent[];
};

export type ApplicationFilters = {
  status: 'All' | ApplicationStatus;
  priority: 'All' | ApplicationPriority;
  assignedAgent: 'All' | string;
  visaType: 'All' | string;
  destinationCountry: 'All' | string;
  submissionDateFrom: string;
  submissionDateTo: string;
  slaRisk: 'All' | ApplicationSlaRisk;
  includeDeleted: 'false' | 'true';
};

export type ListApplicationsRequestDto = {
  page: number;
  page_size: number;
  search?: string;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  filters: ApplicationFilters;
};

export type ListApplicationsResponseDto = DashboardListResponse<VisaApplicationDto>;

export type CreateApplicationRequestDto = {
  applicant: string;
  email: string;
  visa_type: string;
  destination_country: string;
  priority: VisaApplicationDto['priority'];
  assigned_to: string;
  status: VisaApplicationDto['status'];
  owner_id: string;
};

export type QuickApplicationCreatePayload = {
  applicant: string;
  email: string;
  visaType: string;
  destinationCountry: string;
  priority: ApplicationPriority;
  assignedTo: string;
  status: ApplicationStatus;
};

export type FullApplicationWizardFormPayload = {
  applicantName: string;
  email: string;
  visaType: string;
  destinationCountry: string;
  travelDate: string;
  passportNumber: string;
};

export type FullApplicationDraftPayload = {
  termsAccepted: boolean;
  currentStep: number;
  formPayload: Partial<FullApplicationWizardFormPayload>;
};

export type UpdateApplicationRequestDto = Partial<CreateApplicationRequestDto>;

export type BulkAssignOwnerRequest = {
  ids: string[];
  owner: string;
};

export type BulkStatusUpdateRequest = {
  ids: string[];
  status: ApplicationStatus;
};
