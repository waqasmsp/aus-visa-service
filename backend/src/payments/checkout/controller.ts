import { RequestContext } from '../dtos';
import { assertPaymentPermission, PAYMENT_PERMISSIONS } from '../permissions';
import { CheckoutFlowService } from './service';
import { CreateCheckoutSessionDto, FinalizeCheckoutSessionDto, ResumeCheckoutDto } from './dtos';

type CheckoutRequestContext = RequestContext & {
  role?: 'admin' | 'manager' | 'user';
  permissions?: Array<(typeof PAYMENT_PERMISSIONS)[keyof typeof PAYMENT_PERMISSIONS]>;
};

export class CheckoutController {
  constructor(private readonly flow: CheckoutFlowService) {}

  async createPayment(req: { body: CreateCheckoutSessionDto; context: CheckoutRequestContext }) {
    assertPaymentPermission(req.context, PAYMENT_PERMISSIONS.chargeCreate, 'create checkout payment');
    return this.flow.createPaymentIntentOrOrder(req.body, req.context);
  }

  async finalizePayment(req: { body: FinalizeCheckoutSessionDto; context: CheckoutRequestContext }) {
    assertPaymentPermission(req.context, PAYMENT_PERMISSIONS.chargeCreate, 'finalize checkout payment');
    return this.flow.finalizeAndVerify(req.body);
  }

  async resumePayment(req: { query: ResumeCheckoutDto; context: CheckoutRequestContext }) {
    assertPaymentPermission(req.context, PAYMENT_PERMISSIONS.view, 'resume checkout payment');
    return this.flow.resumeAfterRedirect(req.query);
  }
}
