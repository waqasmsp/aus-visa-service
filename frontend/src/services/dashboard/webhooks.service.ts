import { DashboardWebhook } from '../../types/dashboard/webhooks';
import { DashboardListResponse } from '../../types/dashboard/query';

export const webhooksService = {
  async list(): Promise<DashboardListResponse<DashboardWebhook>> {
    return { items: [], meta: { total: 0, page: 1, pageSize: 10 } };
  }
};
