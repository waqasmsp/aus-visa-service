import { CmsPage, LocaleCode, PageDto, PageTemplateType } from '../../../types/dashboard/pages';

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

const templateToUi: Record<PageDto['template'], PageTemplateType> = {
  landing: 'Landing',
  content: 'Content',
  policy: 'Policy',
  campaign: 'Campaign'
};

const templateToDto: Record<PageTemplateType, PageDto['template']> = {
  Landing: 'landing',
  Content: 'content',
  Policy: 'policy',
  Campaign: 'campaign'
};

export const mapPageDtoToUi = (dto: PageDto): CmsPage => ({
  id: dto.id,
  title: dto.title,
  slug: dto.slug,
  status: statusToUi[dto.status],
  template: templateToUi[dto.template],
  seo: {
    metaTitle: dto.seo.meta_title,
    metaDescription: dto.seo.meta_description,
    canonicalUrl: dto.seo.canonical_url,
    noindex: dto.seo.noindex
  },
  schedule: {
    publishAt: dto.schedule.publish_at,
    unpublishAt: dto.schedule.unpublish_at
  },
  redirects: dto.redirects.map((item) => ({ from: item.from, to: item.to, createdAt: item.created_at })),
  updatedBy: dto.updated_by,
  updatedAt: dto.updated_at,
  locale: dto.locale as LocaleCode,
  views: dto.views
});

export const mapPageUiToDto = (page: CmsPage): PageDto => ({
  id: page.id,
  title: page.title,
  slug: page.slug,
  status: statusToDto[page.status],
  template: templateToDto[page.template],
  seo: {
    meta_title: page.seo.metaTitle,
    meta_description: page.seo.metaDescription,
    canonical_url: page.seo.canonicalUrl,
    noindex: page.seo.noindex
  },
  schedule: {
    publish_at: page.schedule.publishAt,
    unpublish_at: page.schedule.unpublishAt
  },
  redirects: page.redirects.map((item) => ({ from: item.from, to: item.to, created_at: item.createdAt })),
  updated_by: page.updatedBy,
  updated_at: page.updatedAt,
  locale: page.locale,
  views: page.views
});
