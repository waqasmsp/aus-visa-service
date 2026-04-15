import { VisaApplication, VisaApplicationDto } from '../../../types/dashboard/applications';

const statusToUi: Record<VisaApplicationDto['status'], VisaApplication['status']> = {
  submitted: 'Submitted',
  in_review: 'In Review',
  documents_needed: 'Documents Needed',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected'
};

const priorityToUi: Record<VisaApplicationDto['priority'], VisaApplication['priority']> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High'
};

export const mapApplicationDtoToUi = (dto: VisaApplicationDto): VisaApplication => ({
  id: dto.id,
  applicant: dto.applicant,
  email: dto.email,
  visaType: dto.visa_type,
  priority: priorityToUi[dto.priority],
  assignedTo: dto.assigned_to,
  submittedOn: dto.submitted_on,
  status: statusToUi[dto.status]
});
