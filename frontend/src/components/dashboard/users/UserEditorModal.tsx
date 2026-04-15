import { FormEvent, useState } from 'react';
import { PortalUser } from '../../../types/dashboard/users';

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

  return (
    <div className="dashboard-panel" role="dialog" aria-modal="true">
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <h3>{editingUser ? `Edit ${editingUser.fullName}` : `Create ${form.segment === 'lead' ? 'Lead' : 'User'}`}</h3>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <form className="dashboard-filter-grid" onSubmit={submit}>
        <label>Full name<input value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} required /></label>
        <label>Email<input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required /></label>
        <label>Phone<input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} required /></label>
        <label>Segment<select value={form.segment} onChange={(event) => setForm((prev) => ({ ...prev, segment: event.target.value as FormModel['segment'] }))}><option value="registered">Registered</option><option value="lead">Lead</option></select></label>
        <label>Purchase state<select value={form.purchased ? 'true' : 'false'} onChange={(event) => setForm((prev) => ({ ...prev, purchased: event.target.value === 'true' }))}><option value="false">Abandoned</option><option value="true">Purchased</option></select></label>
        <label>Acquisition source<input value={form.source} onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))} required /></label>
        <label>Country<input value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} required /></label>
        <label>Role scope<select value={form.roleScope} onChange={(event) => setForm((prev) => ({ ...prev, roleScope: event.target.value as FormModel['roleScope'] }))}>
          <option value="editor">editor</option>
          <option value="manager">manager</option>
          <option value="admin" disabled={!canSetAdminRole}>admin</option>
        </select></label>
        <div>
          <button type="submit" className="dashboard-primary-button">Save</button>
        </div>
      </form>
    </div>
  );
}

export type { FormModel as UserEditorFormModel };
