import { DashboardUserRole } from '../../types/dashboard/applications';

export const PAYMENT_PERMISSIONS = {
  view: 'payments.view',
  chargeCreate: 'payments.charge.create',
  refundCreate: 'payments.refund.create',
  subscriptionManage: 'payments.subscription.manage',
  disputeManage: 'payments.dispute.manage',
  settingsManage: 'payments.settings.manage'
} as const;

export type PaymentPermission = (typeof PAYMENT_PERMISSIONS)[keyof typeof PAYMENT_PERMISSIONS];

const rolePermissions: Record<DashboardUserRole, PaymentPermission[]> = {
  admin: Object.values(PAYMENT_PERMISSIONS),
  manager: [
    PAYMENT_PERMISSIONS.view,
    PAYMENT_PERMISSIONS.chargeCreate,
    PAYMENT_PERMISSIONS.refundCreate,
    PAYMENT_PERMISSIONS.subscriptionManage,
    PAYMENT_PERMISSIONS.disputeManage
  ],
  user: [PAYMENT_PERMISSIONS.view]
};

export const hasPaymentPermission = (role: DashboardUserRole, permission: PaymentPermission): boolean =>
  rolePermissions[role].includes(permission);

export const assertPaymentPermission = (role: DashboardUserRole, permission: PaymentPermission): void => {
  if (!hasPaymentPermission(role, permission)) {
    throw new Error(`Role ${role} does not include required permission ${permission}.`);
  }
};

export const collectStepUpApproval = (actionLabel: string): { reason: string; stepUpToken: string } | null => {
  if (typeof window === 'undefined') {
    return { reason: 'server-side step-up', stepUpToken: 'server-side-step-up-token' };
  }

  const confirmed = window.confirm(`Step-up confirmation required for ${actionLabel}. Continue?`);
  if (!confirmed) {
    return null;
  }

  const reason = window.prompt(`Enter a policy reason for ${actionLabel}.`)?.trim() ?? '';
  if (!reason) {
    window.alert('Reason is required. Action canceled.');
    return null;
  }

  const otp = window.prompt('Enter step-up confirmation token (OTP or approval code).')?.trim() ?? '';
  if (!otp) {
    window.alert('Step-up token is required. Action canceled.');
    return null;
  }

  return { reason, stepUpToken: otp };
};
