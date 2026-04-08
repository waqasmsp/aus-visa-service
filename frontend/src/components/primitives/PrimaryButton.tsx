import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type PrimaryButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'solid' | 'outline';
  }
>;

export function PrimaryButton({ children, className = '', variant = 'solid', ...props }: PrimaryButtonProps) {
  return (
    <button
      type="button"
      className={`primary-button primary-button--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
