import { useEffect, useMemo, useState } from 'react';
import { FullApplicationDraftPayload } from '../../../types/dashboard/applications';
import { DashboardButton } from '../common/DashboardButton';
import { ApplicationWizardTermsStep } from './ApplicationWizardTermsStep';
import { ApplicationWizardPlaceholderStep } from './ApplicationWizardPlaceholderStep';

type StepDefinition = {
  title: string;
  render: () => JSX.Element;
  canProceed: boolean;
};

const TOTAL_STEPS = 20;
const fullApplicationDraftStorageKey = 'dashboard-full-application-draft-v1';

const defaultDraft: FullApplicationDraftPayload = {
  termsAccepted: false,
  currentStep: 1,
  formPayload: {}
};

type Props = {
  onBackToApplications: () => void;
};

export function FullApplicationWizard({ onBackToApplications }: Props) {
  const [draft, setDraft] = useState<FullApplicationDraftPayload>(() => {
    if (typeof window === 'undefined') return defaultDraft;

    const rawDraft = window.localStorage.getItem(fullApplicationDraftStorageKey);
    if (!rawDraft) return defaultDraft;

    try {
      const parsedDraft = JSON.parse(rawDraft) as Partial<FullApplicationDraftPayload>;
      return {
        termsAccepted: Boolean(parsedDraft.termsAccepted),
        currentStep: Math.max(1, Math.min(TOTAL_STEPS, Number(parsedDraft.currentStep) || 1)),
        formPayload: parsedDraft.formPayload ?? {}
      };
    } catch {
      return defaultDraft;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(fullApplicationDraftStorageKey, JSON.stringify(draft));
  }, [draft]);

  const steps = useMemo<StepDefinition[]>(() => {
    const generatedSteps: StepDefinition[] = [
      {
        title: 'Terms and Conditions',
        render: () => (
          <ApplicationWizardTermsStep
            acceptedTerms={draft.termsAccepted}
            onAcceptedTermsChange={(value) => setDraft((prev) => ({ ...prev, termsAccepted: value }))}
          />
        ),
        canProceed: draft.termsAccepted
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
  }, [draft.termsAccepted]);

  const activeStep = steps[draft.currentStep - 1];
  const progressPercent = (draft.currentStep / TOTAL_STEPS) * 100;

  return (
    <article className="dashboard-panel dashboard-application-wizard" aria-label="Full visa application wizard">
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <div>
          <h2>Full visa application</h2>
          <small>Step {draft.currentStep}/{TOTAL_STEPS} · {activeStep.title}</small>
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
          onClick={() => setDraft((prev) => ({ ...prev, currentStep: Math.max(1, prev.currentStep - 1) }))}
          disabled={draft.currentStep === 1}
        >
          Back
        </DashboardButton>
        <DashboardButton
          type="button"
          variant="primary"
          onClick={() => setDraft((prev) => ({ ...prev, currentStep: Math.min(TOTAL_STEPS, prev.currentStep + 1) }))}
          disabled={draft.currentStep === TOTAL_STEPS || !activeStep.canProceed}
        >
          Next
        </DashboardButton>
      </footer>
    </article>
  );
}
