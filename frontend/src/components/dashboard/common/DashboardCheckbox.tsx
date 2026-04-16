import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
};

export const DashboardCheckbox = forwardRef<HTMLInputElement, Props>(({ label, className, ...props }, ref) => (
  <label className={className ? `dashboard-checkbox-row ${className}` : 'dashboard-checkbox-row'}>
    <input ref={ref} type="checkbox" className="dashboard-control-checkbox" {...props} />
    <span>{label}</span>
  </label>
));

DashboardCheckbox.displayName = 'DashboardCheckbox';
