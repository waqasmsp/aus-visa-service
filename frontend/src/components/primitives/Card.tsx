import type { PropsWithChildren } from 'react';

type CardProps = PropsWithChildren<{
  className?: string;
  as?: 'article' | 'blockquote' | 'div';
}>;

export function Card({ className = '', as = 'article', children }: CardProps) {
  const Component = as;

  return <Component className={`card ${className}`.trim()}>{children}</Component>;
}
