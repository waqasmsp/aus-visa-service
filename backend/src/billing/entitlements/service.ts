import { EntitlementTransitionEvent } from '../subscriptions/models';

export interface EntitlementSink {
  publish(event: EntitlementTransitionEvent): Promise<void>;
}

export class InMemoryEntitlementSink implements EntitlementSink {
  private readonly events: EntitlementTransitionEvent[] = [];

  async publish(event: EntitlementTransitionEvent): Promise<void> {
    this.events.unshift(event);
  }

  list(): EntitlementTransitionEvent[] {
    return [...this.events];
  }
}
