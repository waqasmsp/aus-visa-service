type ServiceCard = {
  label: string;
  title: string;
  description: string;
  variant: 'one' | 'two' | 'three';
  href: string;
};

type ServiceCatalogSectionProps = {
  eyebrow: string;
  title: string;
  intro: string;
  cards: ServiceCard[];
};

export function ServiceCatalogSection({ eyebrow, title, intro, cards }: ServiceCatalogSectionProps) {
  return (
    <section className="service-catalog" aria-label="Our services">
      <header className="service-catalog__header">
        <p className="service-catalog__eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="service-catalog__intro">{intro}</p>
      </header>

      <div className="service-catalog__grid">
        {cards.map((card) => (
          <a
            key={card.label}
            className={`service-card service-card--${card.variant}`}
            href={card.href}
            aria-label={`Open ${card.title}`}
          >
            <span className="service-card__arrow" aria-hidden="true">
              &#8594;
            </span>
            <div className="service-card__content">
              <span className="service-card__label">{card.label}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
