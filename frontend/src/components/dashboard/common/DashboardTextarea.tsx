import { forwardRef, TextareaHTMLAttributes } from 'react';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

const joinClasses = (...values: Array<string | undefined | false>): string => values.filter(Boolean).join(' ');

export const DashboardTextarea = forwardRef<HTMLTextAreaElement, Props>(({ className, ...props }, ref) => (
  <textarea ref={ref} {...props} className={joinClasses('dashboard-control dashboard-control--textarea', className)} />
));

DashboardTextarea.displayName = 'DashboardTextarea';
