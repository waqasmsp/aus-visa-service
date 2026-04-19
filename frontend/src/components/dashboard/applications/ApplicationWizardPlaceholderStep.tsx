type Props = {
  stepNumber: number;
};

export function ApplicationWizardPlaceholderStep({ stepNumber }: Props) {
  return (
    <section className="dashboard-application-wizard__step" aria-labelledby={`wizard-step-${stepNumber}-title`}>
      <header className="dashboard-panel__header">
        <h2 id={`wizard-step-${stepNumber}-title`}>Step {stepNumber}</h2>
      </header>
      <p className="dashboard-panel__note">
        This section is reserved for the full application fields that will be added to this step.
      </p>
    </section>
  );
}
