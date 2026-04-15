import { DashboardListResponse } from './query';

export type DashboardWebhook = {
  id: string;
  endpoint: string;
  active: boolean;
};

export type WebhookDto = {
  id: string;
  endpoint: string;
  active: boolean;
};

export type ListWebhooksResponseDto = DashboardListResponse<WebhookDto>;
