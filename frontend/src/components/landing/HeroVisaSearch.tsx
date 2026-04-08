type HeroVisaSearchProps = {
  title: string;
  subtitle: string;
  selectOneLabel: string;
  selectTwoLabel: string;
  selectOneOptions: string[];
  selectTwoOptions: string[];
  primaryCta: string;
};

export function HeroVisaSearch({
  title,
  subtitle,
  selectOneLabel,
  selectTwoLabel,
  selectOneOptions,
  selectTwoOptions,
  primaryCta
}: HeroVisaSearchProps) {
  return (
    <section className="hero-search">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div className="hero-search-controls">
        <label>
          <span>{selectOneLabel}</span>
          <select defaultValue="">
            <option value="" disabled>Select one</option>
            {selectOneOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{selectTwoLabel}</span>
          <select defaultValue="">
            <option value="" disabled>Select one</option>
            {selectTwoOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-primary">{primaryCta}</button>
      </div>
    </section>
  );
}
