import { PaymentProvider } from './models';

export type FraudAssessmentInput = {
  userId: string;
  applicationId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  paymentMethodToken: string;
  ipAddress?: string;
  billingCountry?: string;
  avsResult?: 'match' | 'mismatch' | 'unavailable';
  cvvResult?: 'match' | 'mismatch' | 'unavailable';
};

export type FraudDecision = {
  score: number;
  blocked: boolean;
  reasons: string[];
  flags: Array<'velocity_limit' | 'avs_mismatch' | 'cvv_mismatch' | 'geo_ip_anomaly' | 'risk_threshold'>;
};

export type RiskScoringHook = (input: FraudAssessmentInput) => Promise<number>;

export class InMemoryVelocityLimiter {
  private readonly attempts = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly maxAttemptsPerWindow: number, private readonly windowMs: number) {}

  register(key: string): { limited: boolean; remaining: number } {
    const now = Date.now();
    const current = this.attempts.get(key);

    if (!current || current.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
      return { limited: false, remaining: this.maxAttemptsPerWindow - 1 };
    }

    current.count += 1;
    if (current.count > this.maxAttemptsPerWindow) {
      return { limited: true, remaining: 0 };
    }

    return { limited: false, remaining: this.maxAttemptsPerWindow - current.count };
  }
}

export class FraudControlsService {
  constructor(
    private readonly velocityLimiter: InMemoryVelocityLimiter,
    private readonly scoreHook: RiskScoringHook,
    private readonly scoreThreshold = 70
  ) {}

  async assess(input: FraudAssessmentInput): Promise<FraudDecision> {
    const reasons: string[] = [];
    const flags: FraudDecision['flags'] = [];

    const velocity = this.velocityLimiter.register(`${input.userId}:${input.applicationId}`);
    if (velocity.limited) {
      reasons.push('Velocity limit exceeded for user/application.');
      flags.push('velocity_limit');
    }

    if (input.avsResult === 'mismatch') {
      reasons.push('AVS mismatch detected.');
      flags.push('avs_mismatch');
    }

    if (input.cvvResult === 'mismatch') {
      reasons.push('CVV mismatch detected.');
      flags.push('cvv_mismatch');
    }

    if (input.ipAddress && input.billingCountry) {
      const isGeoMismatch = input.billingCountry.toUpperCase() === 'US' ? !input.ipAddress.startsWith('3.') : input.ipAddress.startsWith('3.');
      if (isGeoMismatch) {
        reasons.push('Potential geo/IP anomaly flagged.');
        flags.push('geo_ip_anomaly');
      }
    }

    const hookScore = await this.scoreHook(input);
    if (hookScore >= this.scoreThreshold) {
      reasons.push(`Risk score ${hookScore} exceeded threshold ${this.scoreThreshold}.`);
      flags.push('risk_threshold');
    }

    return {
      score: hookScore,
      blocked: flags.length > 0,
      reasons,
      flags
    };
  }
}
