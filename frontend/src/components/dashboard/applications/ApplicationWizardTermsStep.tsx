import { DashboardCheckbox } from '../common/DashboardCheckbox';

type Props = {
  acceptedTerms: boolean;
  onAcceptedTermsChange: (value: boolean) => void;
};

export function ApplicationWizardTermsStep({ acceptedTerms, onAcceptedTermsChange }: Props) {
  return (
    <section className="dashboard-application-wizard__step" aria-labelledby="wizard-step-terms-title">
      <header className="dashboard-panel__header">
        <h2 id="wizard-step-terms-title">Terms and Conditions</h2>
      </header>
      <p className="dashboard-panel__note">
        Before proceeding with your visa application, please review and accept the legal agreements below.
      </p>

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
    </section>
  );
}
