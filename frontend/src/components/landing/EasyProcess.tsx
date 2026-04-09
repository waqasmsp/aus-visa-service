import { SectionContainer } from '../primitives/SectionContainer';
import heroIllustration from '../../assets/hero-illustration.svg';

type Step = {
  title: string;
  description: string;
};

type EasyProcessProps = {
  title: string;
  steps: Step[];
};

export function EasyProcess({ title, steps }: EasyProcessProps) {
  return (
    <SectionContainer className="easy-process easy-process--enhanced">
      <h2 className="easy-process__title">{title}</h2>
      <div className="easy-process__layout">
        <figure className="easy-process__visual">
          <img src={heroIllustration} alt="Travel planning illustration for visa process steps" />
        </figure>

        <div className="easy-process__timeline-card">
          <ol className="easy-process__timeline">
            {steps.map((step, index) => (
              <li key={step.title} className="easy-process__timeline-item">
                <span className="easy-process__marker" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </SectionContainer>
  );
}
