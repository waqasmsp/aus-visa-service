import { DashboardUserRole } from '../../types/dashboard/applications';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'publish' | 'approve' | 'manage_settings';
export type PolicyModule = 'applications' | 'users' | 'blogs' | 'pages' | 'settings' | 'webhooks';

export type PermissionMatrix = Record<
  DashboardUserRole,
  Record<PolicyModule, Record<PermissionAction, boolean>>
>;

export type DestructiveApprovalContext = {
  reason?: string;
  secondApprover?: string;
};

const denyAll = (): Record<PermissionAction, boolean> => ({
  view: false,
  create: false,
  edit: false,
  delete: false,
  publish: false,
  approve: false,
  manage_settings: false
});

export const canonicalPermissionMatrix: PermissionMatrix = {
  admin: {
    applications: { view: true, create: true, edit: true, delete: true, publish: false, approve: true, manage_settings: false },
    users: { view: true, create: true, edit: true, delete: true, publish: false, approve: true, manage_settings: false },
    blogs: { view: true, create: true, edit: true, delete: true, publish: true, approve: true, manage_settings: true },
    pages: { view: true, create: true, edit: true, delete: true, publish: true, approve: true, manage_settings: true },
    settings: { view: true, create: false, edit: true, delete: false, publish: false, approve: true, manage_settings: true },
    webhooks: { view: true, create: true, edit: true, delete: true, publish: false, approve: false, manage_settings: true }
  },
  manager: {
    applications: { view: true, create: true, edit: true, delete: true, publish: false, approve: true, manage_settings: false },
    users: { view: true, create: true, edit: true, delete: false, publish: false, approve: false, manage_settings: false },
    blogs: { view: true, create: true, edit: true, delete: false, publish: false, approve: true, manage_settings: false },
    pages: { view: true, create: true, edit: true, delete: false, publish: true, approve: false, manage_settings: false },
    settings: { view: true, create: false, edit: true, delete: false, publish: false, approve: false, manage_settings: false },
    webhooks: { view: true, create: true, edit: true, delete: false, publish: false, approve: false, manage_settings: false }
  },
  user: {
    applications: { view: true, create: true, edit: true, delete: false, publish: false, approve: false, manage_settings: false },
    users: { view: true, create: false, edit: true, delete: false, publish: false, approve: false, manage_settings: false },
    blogs: denyAll(),
    pages: denyAll(),
    settings: { view: true, create: false, edit: false, delete: false, publish: false, approve: false, manage_settings: false },
    webhooks: denyAll()
  }
};

const dualApprovalPolicy: Partial<Record<PolicyModule, PermissionAction[]>> = {
  users: ['delete'],
  blogs: ['publish', 'delete'],
  settings: ['manage_settings'],
  webhooks: ['delete']
};

export const canPerform = (role: DashboardUserRole, module: PolicyModule, action: PermissionAction): boolean =>
  canonicalPermissionMatrix[role][module][action];

export const assertPermission = (role: DashboardUserRole, module: PolicyModule, action: PermissionAction): void => {
  if (!canPerform(role, module, action)) {
    throw new Error(`Role ${role} cannot ${action.replace('_', ' ')} in ${module}.`);
  }
};

export const requiresDualApproval = (module: PolicyModule, action: PermissionAction): boolean =>
  (dualApprovalPolicy[module] ?? []).includes(action);

export const enforceDestructiveApproval = (
  module: PolicyModule,
  action: PermissionAction,
  context?: DestructiveApprovalContext
): void => {
  if (action !== 'delete' && action !== 'publish' && action !== 'manage_settings') {
    return;
  }

  const reason = context?.reason?.trim();
  if (!reason) {
    throw new Error('A reason is required for this destructive action.');
  }

  if (requiresDualApproval(module, action) && !context?.secondApprover?.trim()) {
    throw new Error('A second approver is required by policy for this operation.');
  }
};

export const collectDestructiveApproval = (
  module: PolicyModule,
  action: PermissionAction,
  targetLabel: string
): DestructiveApprovalContext | null => {
  if (typeof window === 'undefined') {
    return { reason: 'server-side mutation', secondApprover: 'system' };
  }

  const confirmed = window.confirm(`Confirm ${action.replace('_', ' ')} for ${targetLabel}?`);
  if (!confirmed) {
    return null;
  }

  const reason = window.prompt(`Enter a reason for ${action.replace('_', ' ')} (${module}).`)?.trim() ?? '';
  if (!reason) {
    window.alert('Reason is required. Action canceled.');
    return null;
  }

  let secondApprover = '';
  if (requiresDualApproval(module, action)) {
    secondApprover = window.prompt('Dual-approval required. Enter second approver email.')?.trim() ?? '';
    if (!secondApprover) {
      window.alert('Second approver is required by policy. Action canceled.');
      return null;
    }
  }

  return { reason, secondApprover };
};
