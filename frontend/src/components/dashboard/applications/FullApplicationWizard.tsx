import { useMemo, useState } from 'react';
import { DashboardButton } from '../common/DashboardButton';
import { ApplicationWizardTermsStep } from './ApplicationWizardTermsStep';
import { ApplicationWizardPlaceholderStep } from './ApplicationWizardPlaceholderStep';

type StepDefinition = {
  title: string;
  render: () => JSX.Element;
  canProceed: boolean;
};

const TOTAL_STEPS = 20;

type Props = {
  onBackToApplications: () => void;
};

export function FullApplicationWizard({ onBackToApplications }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const steps = useMemo<StepDefinition[]>(() => {
    const generatedSteps: StepDefinition[] = [
      {
        title: 'Terms and Conditions',
        render: () => <ApplicationWizardTermsStep acceptedTerms={acceptedTerms} onAcceptedTermsChange={setAcceptedTerms} />,
        canProceed: acceptedTerms
      }
    ];

    for (let step = 2; step <= TOTAL_STEPS; step += 1) {
      generatedSteps.push({
        title: `Step ${step}`,
        render: () => <ApplicationWizardPlaceholderStep stepNumber={step} />,
        canProceed: true
      });
    }

    return generatedSteps;
  }, [acceptedTerms]);

  const activeStep = steps[currentStep - 1];
  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  return (
    <article className="dashboard-panel dashboard-application-wizard" aria-label="Full visa application wizard">
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <div>
          <h2>Full visa application</h2>
          <small>Step {currentStep}/{TOTAL_STEPS} · {activeStep.title}</small>
        </div>
        <DashboardButton type="button" variant="ghost" onClick={onBackToApplications}>
          Back to My Applications
        </DashboardButton>
      </div>

      <div className="dashboard-application-wizard__progress" aria-hidden="true">
        <div className="dashboard-application-wizard__progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {activeStep.render()}

      <footer className="dashboard-application-wizard__actions">
        <DashboardButton
          type="button"
          variant="ghost"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          Back
        </DashboardButton>
        <DashboardButton
          type="button"
          variant="primary"
          onClick={() => setCurrentStep((prev) => Math.min(TOTAL_STEPS, prev + 1))}
          disabled={currentStep === TOTAL_STEPS || !activeStep.canProceed}
        >
          Next
        </DashboardButton>
      </footer>
    </article>
  );
}
