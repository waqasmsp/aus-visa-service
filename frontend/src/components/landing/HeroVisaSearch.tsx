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
    <SectionContainer className="hero-search">
      <div className="hero-search-layout">
        <div>
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
            <PrimaryButton>{primaryCta}</PrimaryButton>
          </div>
        </div>
        <img className="hero-illustration" src={heroIllustration} alt={illustrationAlt} loading="lazy" />
      </div>
    </SectionContainer>
  );
}
