import heroIllustration from '../../assets/hero-travel-illustration.svg';
import { PrimaryButton } from '../primitives/PrimaryButton';
import { SectionContainer } from '../primitives/SectionContainer';

type HeroVisaSearchProps = {
  title: string;
  subtitle: string;
  selectOneLabel: string;
  selectTwoLabel: string;
  selectOneOptions: string[];
  selectTwoOptions: string[];
  primaryCta: string;
  illustrationAlt: string;
};

function renderHeroTitle(title: string) {
  const match = title.match(/\[\[(.*?)\]\]/);

  if (!match || match.index === undefined) {
    return title;
  }

  const [fullMatch, highlighted] = match;
  const before = title.slice(0, match.index);
  const after = title.slice(match.index + fullMatch.length);

  return (
    <>
      {before}
      <span className="hero-search-title-accent">{highlighted}</span>
      {after}
    </>
  );
}

export function HeroVisaSearch({
  title,
  subtitle,
  selectOneLabel,
  selectTwoLabel,
  selectOneOptions,
  selectTwoOptions,
  primaryCta,
  illustrationAlt
}: HeroVisaSearchProps) {
  return (
    <section className="hero-search-band">
      <SectionContainer className="hero-search">
        <div className="hero-search-layout">
          <header className="hero-search-copy">
            <h1>{renderHeroTitle(title)}</h1>
            <p>{subtitle}</p>
          </header>
          <div className="hero-search-panel">
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
              <PrimaryButton>{primaryCta}</PrimaryButton>
            </div>
          </div>
        </div>
      </SectionContainer>
      <img className="hero-illustration hero-illustration--subtle" src={heroIllustration} alt={illustrationAlt} loading="lazy" />
    </section>
  );
}
