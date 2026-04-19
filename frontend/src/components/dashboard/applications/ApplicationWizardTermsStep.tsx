import { DashboardCheckbox } from '../common/DashboardCheckbox';
import { ApplicationWizardStepGridVariant, ApplicationWizardStepLayout } from './ApplicationWizardStepLayout';

type Props = {
  acceptedTerms: boolean;
  onAcceptedTermsChange: (value: boolean) => void;
  onBack: () => void;
  onNext: () => void;
  disableBack: boolean;
  disableNext: boolean;
  layoutVariant?: ApplicationWizardStepGridVariant;
};

export function ApplicationWizardTermsStep({
  acceptedTerms,
  onAcceptedTermsChange,
  onBack,
  onNext,
  disableBack,
  disableNext,
  layoutVariant = '1-col'
}: Props) {
  return (
    <ApplicationWizardStepLayout
      stepId="wizard-step-terms"
      title="Terms and Conditions"
      subtitle="Before proceeding with your visa application, please review and accept the legal agreements below."
      gridVariant={layoutVariant}
      onBack={onBack}
      onNext={onNext}
      disableBack={disableBack}
      disableNext={disableNext}
    >
      <div className="dashboard-application-wizard__link-grid" role="list" aria-label="Legal documents">
        <a className="dashboard-application-wizard__link-card" href="/terms-and-conditions" target="_blank" rel="noreferrer" role="listitem">
          <strong>View Terms and Conditions</strong>
          <span>Open in a new tab</span>
        </a>
        <a className="dashboard-application-wizard__link-card" href="/privacy-policy" target="_blank" rel="noreferrer" role="listitem">
          <strong>View Privacy statement</strong>
          <span>Open in a new tab</span>
        </a>
      </div>

      <div className="dashboard-application-wizard__terms-check">
        <DashboardCheckbox
          checked={acceptedTerms}
          onChange={(event) => onAcceptedTermsChange(event.target.checked)}
          label="I have read and agree to the terms and conditions"
          required
        />
      </div>
    </ApplicationWizardStepLayout>
  );
}
