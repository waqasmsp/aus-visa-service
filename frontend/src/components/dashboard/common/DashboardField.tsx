import { ReactNode } from 'react';

type Props = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
};

export function DashboardField({ label, hint, error, required, htmlFor, className, children }: Props) {
  return (
    <label className={className ? `dashboard-field ${className}` : 'dashboard-field'} htmlFor={htmlFor}>
      {label ? (
        <span className="dashboard-field__label">
          {label}
          {required ? <span className="dashboard-field__required"> *</span> : null}
        </span>
      ) : null}
      {children}
      {hint ? <small className="dashboard-field__hint">{hint}</small> : null}
      {error ? <small className="dashboard-field-error">{error}</small> : null}
    </label>
  );
}
