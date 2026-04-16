import { forwardRef, InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>;

const joinClasses = (...values: Array<string | undefined | false>): string => values.filter(Boolean).join(' ');

export const DashboardInput = forwardRef<HTMLInputElement, Props>(({ className, ...props }, ref) => (
  <input ref={ref} {...props} className={joinClasses('dashboard-control', className)} />
));

DashboardInput.displayName = 'DashboardInput';
