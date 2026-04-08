import type { PropsWithChildren } from 'react';

type SectionContainerProps = PropsWithChildren<{
  as?: 'section' | 'footer';
  className?: string;
}>;

export function SectionContainer({ as = 'section', className = '', children }: SectionContainerProps) {
  const Component = as;

  return <Component className={`section-container ${className}`.trim()}>{children}</Component>;
}
