import { DashboardListResponse } from './query';

export type ApplicationStatus = 'Submitted' | 'In Review' | 'Documents Needed' | 'Approved' | 'Completed' | 'Rejected';
export type ApplicationPriority = 'Low' | 'Medium' | 'High';

export type VisaApplication = {
  id: string;
  applicant: string;
  email: string;
  visaType: string;
  priority: ApplicationPriority;
  assignedTo: string;
  submittedOn: string;
  status: ApplicationStatus;
};

export type VisaApplicationDto = {
  id: string;
  applicant: string;
  email: string;
  visa_type: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to: string;
  submitted_on: string;
  status: 'submitted' | 'in_review' | 'documents_needed' | 'approved' | 'completed' | 'rejected';
};

export type ListApplicationsRequestDto = {
  page: number;
  page_size: number;
  search?: string;
  status?: string;
  priority?: string;
};

export type ListApplicationsResponseDto = DashboardListResponse<VisaApplicationDto>;
