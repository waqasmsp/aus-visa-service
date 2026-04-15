import { PortalUser, UserDto } from '../../../types/dashboard/users';

const segmentToUi: Record<UserDto['segment'], PortalUser['segment']> = {
  registered: 'Registered',
  lead: 'Lead'
};

export const mapUserDtoToUi = (dto: UserDto): PortalUser => ({
  id: dto.id,
  fullName: dto.full_name,
  email: dto.email,
  segment: segmentToUi[dto.segment],
  purchased: dto.purchased,
  source: dto.source,
  country: dto.country,
  spentUsd: dto.spent_usd,
  lastSeen: dto.last_seen
});
