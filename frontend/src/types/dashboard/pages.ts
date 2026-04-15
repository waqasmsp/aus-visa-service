import { DashboardListResponse } from './query';

export type PageStatus = 'Published' | 'Draft' | 'Archived';

export type CmsPage = {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  updatedBy: string;
  updatedAt: string;
  locale: string;
  views: number;
};

export type PageDto = {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft' | 'archived';
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
};

export type ListPagesResponseDto = DashboardListResponse<PageDto>;

export type CreatePageRequestDto = {
  title: string;
  locale: string;
};

export type UpdatePageRequestDto = {
  title?: string;
  status?: PageDto['status'];
};
