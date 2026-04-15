import { DashboardBlog } from '../../types/dashboard/blogs';
import { DashboardListResponse } from '../../types/dashboard/query';

export const blogsService = {
  async list(): Promise<DashboardListResponse<DashboardBlog>> {
    return { items: [], meta: { total: 0, page: 1, pageSize: 10 } };
  }
};
