import { forwardRef, InputHTMLAttributes } from 'react';
import { DashboardInput } from './DashboardInput';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const DashboardDateTime = forwardRef<HTMLInputElement, Props>((props, ref) => (
  <DashboardInput ref={ref} type="datetime-local" {...props} />
));

DashboardDateTime.displayName = 'DashboardDateTime';
