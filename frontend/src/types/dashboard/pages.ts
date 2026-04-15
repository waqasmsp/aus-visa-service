import { DashboardListResponse } from './query';

export type PageStatus = 'Published' | 'Draft' | 'Archived';
export type LocaleCode = 'EN' | 'AR' | 'UR';
export type PageTemplateType = 'Landing' | 'Content' | 'Policy' | 'Campaign';

export type SeoMetadata = {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noindex: boolean;
};

export type PublishSchedule = {
  publishAt: string;
  unpublishAt: string;
};

export type PageSchema = {
  title: string;
  slug: string;
  locale: LocaleCode;
  status: PageStatus;
  template: PageTemplateType;
  seo: SeoMetadata;
  schedule: PublishSchedule;
};

export type PageValidationErrors = Partial<
  Record<
    | 'title'
    | 'slug'
    | 'locale'
    | 'status'
    | 'template'
    | 'seo.metaTitle'
    | 'seo.metaDescription'
    | 'seo.canonicalUrl',
    string
  >
>;

export type CmsPage = {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  template: PageTemplateType;
  seo: SeoMetadata;
  schedule: PublishSchedule;
  updatedBy: string;
  updatedAt: string;
  locale: LocaleCode;
  views: number;
  redirects: Array<{ from: string; to: string; createdAt: string }>;
};

export type PageVersionSnapshot = {
  id: string;
  pageId: string;
  version: number;
  capturedAt: string;
  actor: string;
  reason: string;
  snapshot: CmsPage;
};

export type CompareSnapshotResponse = {
  fromVersion: number;
  toVersion: number;
  changes: string[];
};

export type PageDto = {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft' | 'archived';
  template: 'landing' | 'content' | 'policy' | 'campaign';
  seo: {
    meta_title: string;
    meta_description: string;
    canonical_url: string;
    noindex: boolean;
  };
  schedule: {
    publish_at: string;
    unpublish_at: string;
  };
  redirects: Array<{ from: string; to: string; created_at: string }>;
  updated_by: string;
  updated_at: string;
  locale: string;
  views: number;
};

export type ListPagesRequestDto = {
  page: number;
  page_size: number;
  search?: string;
  status?: string;
  locale?: string;
  template?: string;
  updated_by?: string;
  updated_at_from?: string;
  updated_at_to?: string;
};

export type ListPagesResponseDto = DashboardListResponse<PageDto>;

export type CreatePageRequestDto = {
  title: string;
  slug: string;
  locale: LocaleCode;
  status: PageStatus;
  template: PageTemplateType;
  seo: SeoMetadata;
  schedule: PublishSchedule;
};

export type UpdatePageRequestDto = Partial<CreatePageRequestDto>;

export type BatchTransitionRequestDto = {
  ids: string[];
  action: 'publish' | 'archive';
};

export type BatchTransitionResponse = {
  updated: CmsPage[];
  warnings: string[];
};

export type PublishGuardrailsResult = {
  canPublish: boolean;
  warnings: string[];
};
