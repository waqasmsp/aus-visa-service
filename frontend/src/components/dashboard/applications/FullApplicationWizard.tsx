import { useEffect, useMemo, useState } from 'react';
import { FullApplicationDraftPayload } from '../../../types/dashboard/applications';
import { DashboardButton } from '../common/DashboardButton';
import { ApplicationWizardTermsStep } from './ApplicationWizardTermsStep';
import { ApplicationWizardPlaceholderStep } from './ApplicationWizardPlaceholderStep';
import { ApplicationWizardCurrentLocationStep } from './ApplicationWizardCurrentLocationStep';

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

    generatedSteps.push({
      title: 'Application context',
      render: () => (
        <ApplicationWizardCurrentLocationStep
          isOutsideAustralia={draft.formPayload.isOutsideAustralia ?? ''}
          onIsOutsideAustraliaChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              formPayload: { ...prev.formPayload, isOutsideAustralia: value }
            }))
          }
          currentLocation={draft.formPayload.currentLocation ?? ''}
          onCurrentLocationChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              formPayload: { ...prev.formPayload, currentLocation: value }
            }))
          }
          legalStatus={draft.formPayload.legalStatus ?? ''}
          onLegalStatusChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              formPayload: { ...prev.formPayload, legalStatus: value }
            }))
          }
          selectedVisitReason={draft.formPayload.selectedVisitReason ?? ''}
          onSelectedVisitReasonChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              formPayload: { ...prev.formPayload, selectedVisitReason: value }
            }))
          }
          visitReasons={draft.formPayload.visitReasons ?? []}
          onVisitReasonsChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              formPayload: { ...prev.formPayload, visitReasons: value }
            }))
          }
          significantVisitDates={draft.formPayload.significantVisitDates ?? ''}
          onSignificantVisitDatesChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              formPayload: { ...prev.formPayload, significantVisitDates: value }
            }))
          }
          isGroupProcessing={draft.formPayload.isGroupProcessing ?? 'no'}
          onIsGroupProcessingChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              formPayload: { ...prev.formPayload, isGroupProcessing: value }
            }))
          }
          lengthOfFurtherStay={draft.formPayload.lengthOfFurtherStay ?? ''}
          onLengthOfFurtherStayChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              formPayload: { ...prev.formPayload, lengthOfFurtherStay: value }
            }))
          }
          requestedEndDate={draft.formPayload.requestedEndDate ?? ''}
          onRequestedEndDateChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              formPayload: { ...prev.formPayload, requestedEndDate: value }
            }))
          }
          reasonForFurtherStay={draft.formPayload.reasonForFurtherStay ?? ''}
          onReasonForFurtherStayChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              formPayload: { ...prev.formPayload, reasonForFurtherStay: value }
            }))
          }
          specialCategoryOfEntry={draft.formPayload.specialCategoryOfEntry ?? ''}
          onSpecialCategoryOfEntryChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              formPayload: { ...prev.formPayload, specialCategoryOfEntry: value }
            }))
          }
        />
      ),
      canProceed: Boolean(draft.formPayload.isOutsideAustralia)
    });

    for (let step = 3; step <= TOTAL_STEPS; step += 1) {
      generatedSteps.push({
        title: `Step ${step}`,
        render: () => <ApplicationWizardPlaceholderStep stepNumber={step} />,
        canProceed: true
      });
    }

    return generatedSteps;
  }, [draft.formPayload, draft.termsAccepted]);

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
