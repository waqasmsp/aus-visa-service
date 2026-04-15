import { PortalUser, ListUsersRequestDto, UserDto } from '../../types/dashboard/users';
import { DashboardListResponse } from '../../types/dashboard/query';
import { delay } from './async';
import { mapUserDtoToUi } from './mappers/users.mapper';

let userStore: UserDto[] = [
  {
    id: 'usr-1',
    full_name: 'Arman Siddiqui',
    email: 'arman.s@example.com',
    segment: 'registered',
    purchased: true,
    source: 'Google Search',
    country: 'Pakistan',
    spent_usd: 149,
    last_seen: '2h ago'
  },
  {
    id: 'usr-2',
    full_name: 'Olivia Brown',
    email: 'olivia.brown@example.com',
    segment: 'lead',
    purchased: false,
    source: 'Meta Ads',
    country: 'United Kingdom',
    spent_usd: 0,
    last_seen: '1d ago'
  },
  {
    id: 'usr-3',
    full_name: 'Hassan Ali',
    email: 'hassan.ali@example.com',
    segment: 'registered',
    purchased: false,
    source: 'Direct',
    country: 'UAE',
    spent_usd: 0,
    last_seen: '45m ago'
  },
  {
    id: 'usr-4',
    full_name: 'Emma Wilson',
    email: 'emma.w@example.com',
    segment: 'registered',
    purchased: true,
    source: 'Referral',
    country: 'United States',
    spent_usd: 299,
    last_seen: '4h ago'
  },
  {
    id: 'usr-5',
    full_name: 'Noah Farooq',
    email: 'noah.farooq@example.com',
    segment: 'lead',
    purchased: false,
    source: 'Email Campaign',
    country: 'Saudi Arabia',
    spent_usd: 0,
    last_seen: '6h ago'
  }
];

export const usersService = {
  async list(request: ListUsersRequestDto): Promise<DashboardListResponse<PortalUser>> {
    await delay();
    const search = request.search?.trim().toLowerCase() ?? '';
    const filtered = userStore.filter((user) => {
      const matchesQuery =
        !search ||
        user.full_name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.country.toLowerCase().includes(search);
      const matchesSegment = !request.segment || request.segment === 'All' || user.segment === request.segment.toLowerCase();
      const matchesPurchase =
        !request.purchase ||
        (request.purchase === 'purchased' && user.purchased) ||
        (request.purchase === 'abandoned' && !user.purchased);
      return matchesQuery && matchesSegment && matchesPurchase;
    });

    return {
      items: filtered.map(mapUserDtoToUi),
      meta: { total: filtered.length, page: request.page, pageSize: request.page_size }
    };
  }
};
