import { SectionContainer } from '../primitives/SectionContainer';

type ComparisonPanelProps = {
  title: string;
  leftTitle: string;
  leftPoints: string[];
  rightTitle: string;
  rightPoints: string[];
};

export function ComparisonPanel({ title, leftTitle, leftPoints, rightTitle, rightPoints }: ComparisonPanelProps) {
  return (
    <SectionContainer className="comparison-panel comparison-panel--enhanced">
      <h2>{title}</h2>

      <div className="comparison-split">
        <article className="comparison-column comparison-column--left" aria-label={leftTitle}>
          <h3>{leftTitle}</h3>
          <ul className="comparison-list comparison-list--negative">
            {leftPoints.map((item, index) => (
              <li key={item} style={{ animationDelay: `${index * 80}ms` }}>
                <span className="comparison-list__icon" aria-hidden="true">
                  &times;
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="comparison-column comparison-column--right" aria-label={rightTitle}>
          <h3>{rightTitle}</h3>
          <ul className="comparison-list comparison-list--positive">
            {rightPoints.map((item, index) => (
              <li key={item} style={{ animationDelay: `${index * 80 + 140}ms` }}>
                <span className="comparison-list__icon" aria-hidden="true">
                  &#10003;
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <button type="button" className="primary-button primary-button--solid comparison-cta">
            Get Started
          </button>
        </article>
      </div>
    </SectionContainer>
  );
}
