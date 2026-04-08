import { SectionContainer } from '../primitives/SectionContainer';

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
    <SectionContainer className="easy-process">
      <h2>{title}</h2>
      <ol>
        {steps.map((step) => (
          <li key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </li>
        ))}
      </ol>
    </SectionContainer>
  );
}
