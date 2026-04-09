import heroTravelIllustration from '../../assets/hero-travel-illustration.svg';

export function Inc5000Highlight() {
  return (
    <section className="inc-highlight" aria-label="Company achievement highlight">
      <figure className="inc-highlight__media">
        <img src={heroTravelIllustration} alt="Mountain travel scene with INC 5000 style badge overlay" />
        <div className="inc-highlight__badge" aria-hidden="true">
          <span className="inc-highlight__badge-top">America's Fastest-Growing</span>
          <strong>The.</strong>
          <span className="inc-highlight__badge-number">5000</span>
          <span className="inc-highlight__badge-bottom">Private Companies</span>
        </div>
      </figure>

      <div className="inc-highlight__copy">
        <h2>We're on INC 5000's list of fastest-growing companies!</h2>
      </div>
    </section>
  );
}
