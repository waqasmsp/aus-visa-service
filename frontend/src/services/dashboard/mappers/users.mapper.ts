import { PortalUser, UserDto } from '../../../types/dashboard/users';

const segmentToUi: Record<UserDto['segment'], PortalUser['segment']> = {
  registered: 'Registered',
  lead: 'Lead'
};

const formatLastSeen = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const days = Math.round(diffHours / 24);
  return `${days}d ago`;
};

export const mapUserDtoToUi = (dto: UserDto): PortalUser => ({
  id: dto.id,
  fullName: dto.full_name,
  email: dto.email,
  phone: dto.phone,
  segment: segmentToUi[dto.segment],
  purchased: dto.purchased,
  source: dto.source,
  country: dto.country,
  spentUsd: dto.spent_usd,
  lastSeen: dto.last_seen || formatLastSeen(dto.last_seen_at),
  lastSeenAt: dto.last_seen_at,
  status: dto.status,
  isLead: dto.segment === 'lead',
  roleScope: dto.role_scope,
  timeline: dto.timeline
});
