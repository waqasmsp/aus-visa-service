import { ListApplicationsRequestDto, VisaApplication, VisaApplicationDto } from '../../types/dashboard/applications';
import { DashboardListResponse } from '../../types/dashboard/query';
import { delay } from './async';
import { mapApplicationDtoToUi } from './mappers/applications.mapper';

const applicationStore: VisaApplicationDto[] = [
  {
    id: 'AUS-24019',
    applicant: 'Sophia Collins',
    email: 'sophia.c@example.com',
    visa_type: 'Tourist Visa',
    priority: 'high',
    assigned_to: 'Nadia R.',
    submitted_on: '2026-04-11',
    status: 'in_review'
  },
  {
    id: 'AUS-24020',
    applicant: 'Bilal Ahmed',
    email: 'bilal.ahmed@example.com',
    visa_type: 'Business Visa',
    priority: 'medium',
    assigned_to: 'Mikael D.',
    submitted_on: '2026-04-10',
    status: 'documents_needed'
  },
  {
    id: 'AUS-24021',
    applicant: 'Grace Thomas',
    email: 'grace.t@example.com',
    visa_type: 'Family Visa',
    priority: 'low',
    assigned_to: 'Nadia R.',
    submitted_on: '2026-04-09',
    status: 'submitted'
  },
  {
    id: 'AUS-24022',
    applicant: 'Ibrahim Khan',
    email: 'ibrahim.k@example.com',
    visa_type: 'Student Visa',
    priority: 'high',
    assigned_to: 'Jordan M.',
    submitted_on: '2026-04-06',
    status: 'approved'
  },
  {
    id: 'AUS-24023',
    applicant: 'Liam Cooper',
    email: 'liam.cooper@example.com',
    visa_type: 'Tourist Visa',
    priority: 'medium',
    assigned_to: 'Nina K.',
    submitted_on: '2026-04-04',
    status: 'completed'
  }
];

export const applicationsService = {
  async list(request: ListApplicationsRequestDto): Promise<DashboardListResponse<VisaApplication>> {
    await delay();
    const search = request.search?.trim().toLowerCase() ?? '';
    const filtered = applicationStore.filter((application) => {
      const matchesQuery =
        !search ||
        application.id.toLowerCase().includes(search) ||
        application.applicant.toLowerCase().includes(search) ||
        application.email.toLowerCase().includes(search);
      const matchesStatus =
        !request.status || request.status === 'All' || application.status === request.status.toLowerCase().replace(/\s+/g, '_');
      const matchesPriority = !request.priority || request.priority === 'All' || application.priority === request.priority.toLowerCase();
      return matchesQuery && matchesStatus && matchesPriority;
    });

    return {
      items: filtered.map(mapApplicationDtoToUi),
      meta: { total: filtered.length, page: request.page, pageSize: request.page_size }
    };
  }
};
