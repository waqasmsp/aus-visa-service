import { PLAN_CATALOG } from './catalog';
import { BillingInterval, PlanCatalogModel, RegionCode } from './models';

export class PlanCatalogService {
  listPlans(): PlanCatalogModel[] {
    return PLAN_CATALOG.filter((plan) => plan.active);
  }

  getPlan(planId: string): PlanCatalogModel {
    const plan = PLAN_CATALOG.find((row) => row.id === planId || row.code === planId);
    if (!plan) throw new Error(`Plan ${planId} not found.`);
    return plan;
  }

  getPrice(planId: string, interval: BillingInterval, region: RegionCode) {
    const plan = this.getPlan(planId);
    const intervalRow = plan.intervals.find((row) => row.interval === interval);
    if (!intervalRow) throw new Error(`Interval ${interval} is not configured for ${planId}.`);
    const price = intervalRow.prices.find((row) => row.region === region);
    if (!price) throw new Error(`Regional price for ${region} is not configured for ${planId}.`);
    return price;
  }
}
