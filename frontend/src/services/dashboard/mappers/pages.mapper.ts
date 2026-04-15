import { CmsPage, PageDto } from '../../../types/dashboard/pages';

const statusToUi: Record<PageDto['status'], CmsPage['status']> = {
  published: 'Published',
  draft: 'Draft',
  archived: 'Archived'
};

const statusToDto: Record<CmsPage['status'], PageDto['status']> = {
  Published: 'published',
  Draft: 'draft',
  Archived: 'archived'
};

export const mapPageDtoToUi = (dto: PageDto): CmsPage => ({
  id: dto.id,
  title: dto.title,
  slug: dto.slug,
  status: statusToUi[dto.status],
  updatedBy: dto.updated_by,
  updatedAt: dto.updated_at,
  locale: dto.locale,
  views: dto.views
});

export const mapPageUiToDto = (page: CmsPage): PageDto => ({
  id: page.id,
  title: page.title,
  slug: page.slug,
  status: statusToDto[page.status],
  updated_by: page.updatedBy,
  updated_at: page.updatedAt,
  locale: page.locale,
  views: page.views
});
