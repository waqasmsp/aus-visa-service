import type { ReactNode } from 'react';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeroProps = {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  metaItems?: string[];
  children?: ReactNode;
};

export function PageHero({ title, description, breadcrumbs, metaItems, children }: PageHeroProps) {
  const lastIndex = breadcrumbs.length - 1;

  return (
    <section className="landing-section landing-section--hero page-hero">
      <div className="content-container page-hero__inner">
        <nav className="page-hero__breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((item, index) => {
            const isCurrent = index === lastIndex;
            const key = `${item.label}-${index}`;

            return (
              <span key={key} className="page-hero__crumb">
                {item.href && !isCurrent ? <a href={item.href}>{item.label}</a> : <span aria-current={isCurrent ? 'page' : undefined}>{item.label}</span>}
                {!isCurrent ? <span aria-hidden="true">→</span> : null}
              </span>
            );
          })}
        </nav>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
        {metaItems?.length ? (
          <div className="page-hero__meta-row" aria-label="Article metadata">
            {metaItems.map((item) => (
              <span key={item} className="page-hero__meta-item">
                {item}
              </span>
            ))}
          </div>
        ) : null}
        {children ? <div className="page-hero__extra">{children}</div> : null}
      </div>
    </section>
  );
}
