import { FormEvent, useState } from 'react';
import { VisaApplication } from '../../../types/dashboard/applications';
import { DashboardButton } from '../common/DashboardButton';
import { DashboardField } from '../common/DashboardField';
import { DashboardInput } from '../common/DashboardInput';
import { DashboardSelect } from '../common/DashboardSelect';

type FormModel = {
  applicant: string;
  email: string;
  visaType: string;
  destinationCountry: string;
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string;
  status: 'Submitted' | 'In Review' | 'Documents Needed' | 'Approved' | 'Completed' | 'Rejected';
};

type Props = {
  editingApplication: VisaApplication | null;
  onClose: () => void;
  onSubmit: (payload: FormModel) => void;
};

export function ApplicationFormModal({ editingApplication, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormModel>({
    applicant: editingApplication?.applicant ?? '',
    email: editingApplication?.email ?? '',
    visaType: editingApplication?.visaType ?? 'Tourist Visa',
    destinationCountry: editingApplication?.destinationCountry ?? 'Australia',
    priority: editingApplication?.priority ?? 'Medium',
    assignedTo: editingApplication?.assignedTo ?? 'Nadia R.',
    status: editingApplication?.status ?? 'Submitted'
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="dashboard-panel" role="dialog" aria-modal="true">
      <div className="dashboard-panel__header">
        <h3>{editingApplication ? `Edit ${editingApplication.id}` : 'Add Application'}</h3>
        <DashboardButton type="button" variant="ghost" size="sm" onClick={onClose}>Close</DashboardButton>
      </div>
      <form className="dashboard-filter-grid" onSubmit={submit}>
        <DashboardField label="Applicant" required><DashboardInput value={form.applicant} onChange={(event) => setForm((prev) => ({ ...prev, applicant: event.target.value }))} required /></DashboardField>
        <DashboardField label="Email" required><DashboardInput type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required /></DashboardField>
        <DashboardField label="Visa Type" required><DashboardInput value={form.visaType} onChange={(event) => setForm((prev) => ({ ...prev, visaType: event.target.value }))} required /></DashboardField>
        <DashboardField label="Destination" required><DashboardInput value={form.destinationCountry} onChange={(event) => setForm((prev) => ({ ...prev, destinationCountry: event.target.value }))} required /></DashboardField>
        <DashboardField label="Priority"><DashboardSelect value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as FormModel['priority'] }))}><option>Low</option><option>Medium</option><option>High</option></DashboardSelect></DashboardField>
        <DashboardField label="Assigned to" required><DashboardInput value={form.assignedTo} onChange={(event) => setForm((prev) => ({ ...prev, assignedTo: event.target.value }))} required /></DashboardField>
        <DashboardField label="Status"><DashboardSelect value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as FormModel['status'] }))}><option>Submitted</option><option>In Review</option><option>Documents Needed</option><option>Approved</option><option>Completed</option><option>Rejected</option></DashboardSelect></DashboardField>
        <div>
          <DashboardButton type="submit" variant="primary">Save</DashboardButton>
        </div>
      </form>
    </div>
  );
}
