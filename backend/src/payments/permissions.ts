export const PAYMENT_PERMISSIONS = {
  view: 'payments.view',
  chargeCreate: 'payments.charge.create',
  refundCreate: 'payments.refund.create',
  subscriptionManage: 'payments.subscription.manage',
  disputeManage: 'payments.dispute.manage',
  settingsManage: 'payments.settings.manage'
} as const;

export type PaymentPermission = (typeof PAYMENT_PERMISSIONS)[keyof typeof PAYMENT_PERMISSIONS];

export type PaymentPermissionContext = {
  role?: 'admin' | 'manager' | 'user';
  permissions?: PaymentPermission[];
};

const roleDefaults: Record<NonNullable<PaymentPermissionContext['role']>, PaymentPermission[]> = {
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

export const hasPaymentPermission = (context: PaymentPermissionContext | undefined, permission: PaymentPermission): boolean => {
  if (!context) {
    return false;
  }

  const explicit = context.permissions ?? [];
  if (explicit.includes(permission)) {
    return true;
  }

  if (!context.role) {
    return false;
  }

  return roleDefaults[context.role].includes(permission);
};

export const assertPaymentPermission = (
  context: PaymentPermissionContext | undefined,
  permission: PaymentPermission,
  actionLabel: string
): void => {
  if (!hasPaymentPermission(context, permission)) {
    throw new Error(`Payment permission denied for ${actionLabel}. Required: ${permission}`);
  }
};
