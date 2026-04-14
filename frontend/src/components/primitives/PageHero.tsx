type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeroProps = {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
};

export function PageHero({ title, description, breadcrumbs }: PageHeroProps) {
  const lastIndex = breadcrumbs.length - 1;

  return (
    <section className="landing-section page-hero">
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
      </div>
    </section>
  );
}
