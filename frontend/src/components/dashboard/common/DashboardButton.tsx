import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';

type DashboardButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type DashboardButtonSize = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: DashboardButtonVariant;
  size?: DashboardButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

const joinClasses = (...values: Array<string | undefined | false>): string => values.filter(Boolean).join(' ');

export const DashboardButton = forwardRef<HTMLButtonElement, Props>(function DashboardButton(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    loadingLabel = 'Loading…',
    className,
    disabled,
    children,
    ...props
  },
  ref
) {
  const classes = joinClasses(
    'dashboard-button',
    `dashboard-button--${variant}`,
    `dashboard-button--${size}`,
    variant === 'primary' ? 'dashboard-primary-button' : undefined,
    variant === 'ghost' ? 'dashboard-ghost-button' : undefined,
    className
  );

  return (
    <button ref={ref} {...props} className={classes} disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading ? loadingLabel : children}
    </button>
  );
});
