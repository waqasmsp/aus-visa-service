import { RequestContext } from '../dtos';
import { CheckoutFlowService } from './service';
import { CreateCheckoutSessionDto, FinalizeCheckoutSessionDto, ResumeCheckoutDto } from './dtos';

export class CheckoutController {
  constructor(private readonly flow: CheckoutFlowService) {}

  async createPayment(req: { body: CreateCheckoutSessionDto; context: RequestContext }) {
    return this.flow.createPaymentIntentOrOrder(req.body, req.context);
  }

  async finalizePayment(req: { body: FinalizeCheckoutSessionDto }) {
    return this.flow.finalizeAndVerify(req.body);
  }

  async resumePayment(req: { query: ResumeCheckoutDto }) {
    return this.flow.resumeAfterRedirect(req.query);
  }
}
