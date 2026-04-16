import { forwardRef, SelectHTMLAttributes } from 'react';

type Props = SelectHTMLAttributes<HTMLSelectElement>;

const joinClasses = (...values: Array<string | undefined | false>): string => values.filter(Boolean).join(' ');

export const DashboardSelect = forwardRef<HTMLSelectElement, Props>(({ className, children, ...props }, ref) => (
  <select ref={ref} {...props} className={joinClasses('dashboard-control', className)}>
    {children}
  </select>
));

DashboardSelect.displayName = 'DashboardSelect';
