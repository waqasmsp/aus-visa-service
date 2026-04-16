import { PlanCatalogModel } from './models';

const now = '2026-04-16T00:00:00.000Z';

export const PLAN_CATALOG: PlanCatalogModel[] = [
  {
    id: 'plan_starter',
    code: 'starter',
    name: 'Starter',
    description: 'Core visa workflow automation for small teams.',
    active: true,
    intervals: [
      {
        interval: 'monthly',
        prices: [
          { region: 'US', currency: 'USD', unitAmount: 29, taxBehavior: 'exclusive' },
          { region: 'EU', currency: 'EUR', unitAmount: 27, taxBehavior: 'inclusive' },
          { region: 'UK', currency: 'GBP', unitAmount: 24, taxBehavior: 'inclusive' },
          { region: 'AU', currency: 'AUD', unitAmount: 44, taxBehavior: 'inclusive' }
        ]
      },
      {
        interval: 'annual',
        prices: [
          { region: 'US', currency: 'USD', unitAmount: 290, taxBehavior: 'exclusive' },
          { region: 'EU', currency: 'EUR', unitAmount: 270, taxBehavior: 'inclusive' },
          { region: 'UK', currency: 'GBP', unitAmount: 240, taxBehavior: 'inclusive' },
          { region: 'AU', currency: 'AUD', unitAmount: 440, taxBehavior: 'inclusive' }
        ]
      }
    ],
    trial: { enabled: true, trialDays: 14, eligibilityRule: 'new_customer_only' },
    entitlements: [
      { key: 'applications.monthly', limit: 50, enabled: true, description: 'Application processing cap per month' },
      { key: 'team.seats', limit: 3, enabled: true, description: 'Included operator seats' },
      { key: 'support.priority', enabled: false, description: 'Priority support lane' }
    ],
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'plan_growth',
    code: 'growth',
    name: 'Growth',
    description: 'Regional scaling and approval automation for growing agencies.',
    active: true,
    intervals: [
      {
        interval: 'monthly',
        prices: [
          { region: 'US', currency: 'USD', unitAmount: 79, taxBehavior: 'exclusive' },
          { region: 'EU', currency: 'EUR', unitAmount: 73, taxBehavior: 'inclusive' },
          { region: 'UK', currency: 'GBP', unitAmount: 68, taxBehavior: 'inclusive' },
          { region: 'AU', currency: 'AUD', unitAmount: 119, taxBehavior: 'inclusive' }
        ]
      },
      {
        interval: 'annual',
        prices: [
          { region: 'US', currency: 'USD', unitAmount: 790, taxBehavior: 'exclusive' },
          { region: 'EU', currency: 'EUR', unitAmount: 730, taxBehavior: 'inclusive' },
          { region: 'UK', currency: 'GBP', unitAmount: 680, taxBehavior: 'inclusive' },
          { region: 'AU', currency: 'AUD', unitAmount: 1190, taxBehavior: 'inclusive' }
        ]
      }
    ],
    trial: { enabled: true, trialDays: 21, eligibilityRule: 'no_active_subscription' },
    entitlements: [
      { key: 'applications.monthly', limit: 250, enabled: true, description: 'Application processing cap per month' },
      { key: 'team.seats', limit: 12, enabled: true, description: 'Included operator seats' },
      { key: 'support.priority', enabled: true, description: 'Priority support lane' },
      { key: 'analytics.advanced', enabled: true, description: 'Advanced revenue and funnel analytics' }
    ],
    createdAt: now,
    updatedAt: now
  }
];
