import { PaymentService } from '../interfaces';
import { PaymentProvider } from '../models';
import { CreatePaymentIntentDto, RequestContext } from '../dtos';
import { CreateCheckoutSessionDto, FinalizeCheckoutSessionDto, ResumeCheckoutDto } from './dtos';
import { CheckoutRepository } from './repository';
import { CheckoutSession, ResumeCheckoutState, TransactionRecord } from './models';

const nowIso = () => new Date().toISOString();
const buildId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const resolveProviderForMethod = (
  method: CreateCheckoutSessionDto['method'],
  requestedProvider?: PaymentProvider
): PaymentProvider => {
  if (requestedProvider) {
    return requestedProvider;
  }

  if (method === 'paypal') {
    return 'paypal';
  }

  if (method === 'google_pay') {
    return 'googlepay';
  }

  return 'stripe';
};

export class CheckoutFlowService {
  constructor(private readonly payments: PaymentService, private readonly repository: CheckoutRepository) {}

  async createPaymentIntentOrOrder(input: CreateCheckoutSessionDto, context: RequestContext): Promise<CheckoutSession> {
    const provider = resolveProviderForMethod(input.method, input.provider);
    const intentPayload: CreatePaymentIntentDto = {
      amount: input.amount,
      currency: input.currency,
      metadata: {
        userId: input.userId,
        applicationId: input.applicationId,
        orderId: input.orderId,
        ...(input.metadata ?? {})
      }
    };

    const intent = await this.payments.createIntent(intentPayload, context);
    const createdAt = nowIso();

    const session: CheckoutSession = {
      checkoutSessionId: buildId('chk'),
      orderId: input.orderId,
      applicationId: input.applicationId,
      userId: input.userId,
      provider,
      method: input.method,
      state: intent.status === 'requires_confirmation' ? 'requires_confirmation' : 'created',
      paymentIntentId: intent.id,
      clientSecret: provider === 'stripe' || provider === 'googlepay' ? `cs_${intent.id}` : undefined,
      approvalUrl: provider === 'paypal' ? `${input.returnUrl}&provider=paypal&token=${intent.id}` : undefined,
      requiresActionRedirectUrl: `${input.returnUrl}&provider=${provider}&session_id=${intent.id}&redirect_status=succeeded`,
      returnUrl: input.returnUrl,
      amount: input.amount,
      currency: input.currency,
      createdAt,
      updatedAt: createdAt,
      metadata: intentPayload.metadata
    };

    await this.repository.saveSession(session);
    return session;
  }

  async finalizeAndVerify(input: FinalizeCheckoutSessionDto): Promise<TransactionRecord> {
    const session = await this.repository.findSessionById(input.checkoutSessionId);
    if (!session) {
      throw new Error(`Checkout session not found: ${input.checkoutSessionId}`);
    }

    const processorStatus = typeof input.processorPayload.status === 'string' ? input.processorPayload.status : 'processing';
    const normalizedState = processorStatus === 'succeeded' ? 'succeeded' : processorStatus === 'failed' ? 'failed' : 'processing';

    const updatedSession: CheckoutSession = {
      ...session,
      state: normalizedState,
      updatedAt: nowIso()
    };

    await this.repository.updateSession(updatedSession);

    const record: TransactionRecord = {
      id: buildId('txn'),
      checkoutSessionId: session.checkoutSessionId,
      provider: input.provider,
      method: session.method,
      userId: session.userId,
      applicationId: session.applicationId,
      orderId: session.orderId,
      amount: session.amount,
      currency: session.currency,
      state: normalizedState,
      failureCode: normalizedState === 'failed' ? 'PROCESSOR_DECLINED' : undefined,
      failureReason:
        normalizedState === 'failed'
          ? 'Processor declined or authentication challenge was abandoned.'
          : undefined,
      processorReference:
        typeof input.processorPayload.reference === 'string' ? input.processorPayload.reference : session.paymentIntentId,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    await this.repository.saveTransaction(record);
    return record;
  }

  async resumeAfterRedirect(input: ResumeCheckoutDto): Promise<ResumeCheckoutState> {
    const session = await this.repository.findSessionById(input.checkoutSessionId);
    if (!session) {
      throw new Error(`Checkout session not found: ${input.checkoutSessionId}`);
    }

    if (input.redirectStatus === 'failed') {
      return {
        checkoutSessionId: session.checkoutSessionId,
        orderId: session.orderId,
        status: 'failed',
        message: 'Authentication did not complete. Retry this method or switch to another payment option.',
        provider: input.provider,
        method: session.method,
        shouldRetry: true,
        canSwitchMethod: true
      };
    }

    if (session.state === 'requires_action' || input.redirectStatus === 'requires_action') {
      return {
        checkoutSessionId: session.checkoutSessionId,
        orderId: session.orderId,
        status: 'requires_action',
        message: 'Additional verification is required to complete this payment.',
        provider: input.provider,
        method: session.method,
        shouldRetry: true,
        canSwitchMethod: true,
        requiresActionRedirectUrl: session.requiresActionRedirectUrl
      };
    }

    return {
      checkoutSessionId: session.checkoutSessionId,
      orderId: session.orderId,
      status: session.state,
      message:
        session.state === 'succeeded'
          ? 'Payment confirmed. Your receipt is ready.'
          : 'We are still verifying your payment. You may refresh this page shortly.',
      provider: input.provider,
      method: session.method,
      shouldRetry: session.state === 'failed',
      canSwitchMethod: session.state !== 'succeeded',
      requiresActionRedirectUrl: session.requiresActionRedirectUrl
    };
  }
}
