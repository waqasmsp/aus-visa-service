type FeatureItem = {
  title: string;
  description: string;
};

type FeaturesBandProps = {
  eyebrow: string;
  title: string;
  ctaLabel: string;
  items: FeatureItem[];
  onGetStarted: () => void;
};

export function FeaturesBand({ eyebrow, title, ctaLabel, items, onGetStarted }: FeaturesBandProps) {
  return (
    <div className="content-container">
      <section className="features-band" aria-label="Our features">
        <header className="features-band__header">
          <div className="features-band__copy">
            <p className="features-band__eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="features-band__cta" onClick={onGetStarted}>
            {ctaLabel}
          </button>
        </header>

        <div className="features-band__grid">
          {items.map((item) => (
            <article key={item.title} className="features-band__item">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

