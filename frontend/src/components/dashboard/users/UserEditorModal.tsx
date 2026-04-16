import { FormEvent, useId, useRef, useState } from 'react';
import { PortalUser } from '../../../types/dashboard/users';
import { DashboardButton } from '../common/DashboardButton';
import { DashboardField } from '../common/DashboardField';
import { DashboardInput } from '../common/DashboardInput';
import { DashboardSelect } from '../common/DashboardSelect';
import { useFocusTrap } from '../common/useFocusTrap';

type FormModel = {
  fullName: string;
  email: string;
  phone: string;
  segment: 'registered' | 'lead';
  purchased: boolean;
  source: string;
  country: string;
  roleScope: 'admin' | 'manager' | 'editor';
};

type Props = {
  editingUser: PortalUser | null;
  preferredSegment?: 'registered' | 'lead';
  canSetAdminRole: boolean;
  onClose: () => void;
  onSubmit: (payload: FormModel) => void;
};

export function UserEditorModal({ editingUser, preferredSegment = 'registered', canSetAdminRole, onClose, onSubmit }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [form, setForm] = useState<FormModel>({
    fullName: editingUser?.fullName ?? '',
    email: editingUser?.email ?? '',
    phone: editingUser?.phone ?? '',
    segment: editingUser?.segment.toLowerCase() === 'lead' ? 'lead' : preferredSegment,
    purchased: editingUser?.purchased ?? false,
    source: editingUser?.source ?? 'Direct',
    country: editingUser?.country ?? 'Australia',
    roleScope: editingUser?.roleScope ?? 'editor'
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(form);
  };
  useFocusTrap({ active: true, containerRef: dialogRef, initialFocusRef: closeRef, onClose });

  return (
    <div ref={dialogRef} className="dashboard-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <h3 id={titleId}>{editingUser ? `Edit ${editingUser.fullName}` : `Create ${form.segment === 'lead' ? 'Lead' : 'User'}`}</h3>
        <DashboardButton ref={closeRef} type="button" variant="ghost" size="sm" onClick={onClose}>Close</DashboardButton>
      </div>
      <p id={descriptionId} className="sr-only">Use this dialog to edit user profile, segment, and role scope details.</p>
      <form className="dashboard-filter-grid" onSubmit={submit}>
        <DashboardField label="Full name" required><DashboardInput value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} required /></DashboardField>
        <DashboardField label="Email" required><DashboardInput type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required /></DashboardField>
        <DashboardField label="Phone" required><DashboardInput value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} required /></DashboardField>
        <DashboardField label="Segment"><DashboardSelect value={form.segment} onChange={(event) => setForm((prev) => ({ ...prev, segment: event.target.value as FormModel['segment'] }))}><option value="registered">Registered</option><option value="lead">Lead</option></DashboardSelect></DashboardField>
        <DashboardField label="Purchase state"><DashboardSelect value={form.purchased ? 'true' : 'false'} onChange={(event) => setForm((prev) => ({ ...prev, purchased: event.target.value === 'true' }))}><option value="false">Abandoned</option><option value="true">Purchased</option></DashboardSelect></DashboardField>
        <DashboardField label="Acquisition source" required><DashboardInput value={form.source} onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))} required /></DashboardField>
        <DashboardField label="Country" required><DashboardInput value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} required /></DashboardField>
        <DashboardField label="Role scope"><DashboardSelect value={form.roleScope} onChange={(event) => setForm((prev) => ({ ...prev, roleScope: event.target.value as FormModel['roleScope'] }))}>
          <option value="editor">editor</option>
          <option value="manager">manager</option>
          <option value="admin" disabled={!canSetAdminRole}>admin</option>
        </DashboardSelect></DashboardField>
        <div>
          <DashboardButton type="submit" variant="primary">Save</DashboardButton>
        </div>
      </form>
    </div>
  );
}

export type { FormModel as UserEditorFormModel };
