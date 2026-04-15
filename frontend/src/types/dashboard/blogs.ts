import { DashboardListResponse } from './query';

export type DashboardBlog = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
};

export type BlogDto = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
};

export type ListBlogsResponseDto = DashboardListResponse<BlogDto>;
