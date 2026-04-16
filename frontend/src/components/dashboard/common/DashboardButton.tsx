import { ButtonHTMLAttributes, ReactNode } from 'react';

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

export function DashboardButton({
  variant = 'secondary',
  size = 'md',
  loading = false,
  loadingLabel = 'Loading…',
  className,
  disabled,
  children,
  ...props
}: Props) {
  const classes = joinClasses(
    'dashboard-button',
    `dashboard-button--${variant}`,
    `dashboard-button--${size}`,
    variant === 'primary' ? 'dashboard-primary-button' : undefined,
    variant === 'ghost' ? 'dashboard-ghost-button' : undefined,
    className
  );

  return (
    <button {...props} className={classes} disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading ? loadingLabel : children}
    </button>
  );
}
