import { forwardRef, InputHTMLAttributes, MouseEvent } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>;

const joinClasses = (...values: Array<string | undefined | false>): string => values.filter(Boolean).join(' ');

export const DashboardInput = forwardRef<HTMLInputElement, Props>(({ className, onClick, type, ...props }, ref) => {
  const handleClick = (event: MouseEvent<HTMLInputElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || type !== 'date') return;

    const input = event.currentTarget as HTMLInputElement & { showPicker?: () => void };
    input.showPicker?.();
  };

  return <input ref={ref} {...props} type={type} onClick={handleClick} className={joinClasses('dashboard-control', className)} />;
});

DashboardInput.displayName = 'DashboardInput';
