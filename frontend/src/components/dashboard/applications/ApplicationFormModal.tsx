import { FormEvent, useState } from 'react';
import { VisaApplication } from '../../../types/dashboard/applications';

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
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <form className="dashboard-filter-grid" onSubmit={submit}>
        <label>Applicant<input value={form.applicant} onChange={(event) => setForm((prev) => ({ ...prev, applicant: event.target.value }))} required /></label>
        <label>Email<input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required /></label>
        <label>Visa Type<input value={form.visaType} onChange={(event) => setForm((prev) => ({ ...prev, visaType: event.target.value }))} required /></label>
        <label>Destination<input value={form.destinationCountry} onChange={(event) => setForm((prev) => ({ ...prev, destinationCountry: event.target.value }))} required /></label>
        <label>Priority<select value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as FormModel['priority'] }))}><option>Low</option><option>Medium</option><option>High</option></select></label>
        <label>Assigned to<input value={form.assignedTo} onChange={(event) => setForm((prev) => ({ ...prev, assignedTo: event.target.value }))} required /></label>
        <label>Status<select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as FormModel['status'] }))}><option>Submitted</option><option>In Review</option><option>Documents Needed</option><option>Approved</option><option>Completed</option><option>Rejected</option></select></label>
        <div>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}
