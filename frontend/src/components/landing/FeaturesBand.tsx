type FeatureItem = {
  title: string;
  description: string;
};

type FeaturesBandProps = {
  eyebrow: string;
  title: string;
  items: FeatureItem[];
};

export function FeaturesBand({ eyebrow, title, items }: FeaturesBandProps) {
  return (
    <div className="content-container">
      <section className="features-band" aria-label="Our features">
        <header className="features-band__header">
          <div className="features-band__copy">
            <p className="features-band__eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
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
