import { useEffect, useMemo, useState } from 'react';
import { FullApplicationDraftPayload } from '../../../types/dashboard/applications';
import { DashboardButton } from '../common/DashboardButton';
import { ApplicationWizardTermsStep } from './ApplicationWizardTermsStep';
import { ApplicationWizardCurrentLocationStep } from './ApplicationWizardCurrentLocationStep';
import { ApplicationWizardInformationalStep } from './ApplicationWizardInformationalStep';
import { ApplicationWizardTravelStayPlansStep } from './ApplicationWizardTravelStayPlansStep';
import { ApplicationWizardStepGridVariant } from './ApplicationWizardStepLayout';

type StepConfig = {
  id: string;
  title: string;
  subtitle?: string;
  validationKeys: Array<'termsAccepted' | keyof FullApplicationDraftPayload['formPayload']>;
  layoutVariant: ApplicationWizardStepGridVariant;
};

type StepDefinition = StepConfig & {
  render: () => JSX.Element;
};

const TOTAL_STEPS = 20;
const fullApplicationDraftStorageKey = 'dashboard-full-application-draft-v1';

const defaultDraft: FullApplicationDraftPayload = {
  termsAccepted: false,
  currentStep: 1,
  formPayload: {}
};

const stepConfigs: StepConfig[] = [
  { id: 'terms', title: 'Terms and Conditions', validationKeys: ['termsAccepted'], layoutVariant: '1-col' },
  {
    id: 'application-context',
    title: 'Application context',
    subtitle: 'Provide location and travel context for this visa request.',
    validationKeys: ['isOutsideAustralia'],
    layoutVariant: '2-col'
  },
  { id: 'travel-and-stay', title: 'Travel and stay plans', validationKeys: [], layoutVariant: '2-col' },
  { id: 'passport-details', title: 'Passport details', validationKeys: [], layoutVariant: '3-col' },
  { id: 'applicant-identity', title: 'Applicant identity', validationKeys: [], layoutVariant: '2-col' },
  { id: 'contact-details', title: 'Contact details', validationKeys: [], layoutVariant: '2-col' },
  { id: 'family-details', title: 'Family details', validationKeys: [], layoutVariant: '2-col' },
  { id: 'employment', title: 'Employment and finances', validationKeys: [], layoutVariant: '2-col' },
  { id: 'health', title: 'Health declarations', validationKeys: [], layoutVariant: '2-col' },
  { id: 'character', title: 'Character declarations', validationKeys: [], layoutVariant: '2-col' },
  { id: 'military', title: 'Military and security', validationKeys: [], layoutVariant: '2-col' },
  { id: 'education', title: 'Education history', validationKeys: [], layoutVariant: '2-col' },
  { id: 'language', title: 'Language and communication', validationKeys: [], layoutVariant: '2-col' },
  { id: 'sponsors', title: 'Sponsors and support', validationKeys: [], layoutVariant: '2-col' },
  { id: 'dependants', title: 'Dependants', validationKeys: [], layoutVariant: '2-col' },
  { id: 'travel-history', title: 'Travel history', validationKeys: [], layoutVariant: '2-col' },
  { id: 'documents', title: 'Document checklist', validationKeys: [], layoutVariant: '3-col' },
  { id: 'declarations', title: 'Declarations', validationKeys: [], layoutVariant: '1-col' },
  { id: 'review', title: 'Review application', validationKeys: [], layoutVariant: '1-col' },
  { id: 'submit', title: 'Submit application', validationKeys: [], layoutVariant: '1-col' }
];

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

  const goBack = () => {
    setDraft((prev) => ({ ...prev, currentStep: Math.max(1, prev.currentStep - 1) }));
  };

  const goNext = () => {
    setDraft((prev) => ({ ...prev, currentStep: Math.min(TOTAL_STEPS, prev.currentStep + 1) }));
  };

  const steps = useMemo<StepDefinition[]>(() => {
    const canProceedForConfig = (config: StepConfig) => {
      if (config.validationKeys.length === 0) return true;

      return config.validationKeys.every((key) => {
        if (key === 'termsAccepted') return draft.termsAccepted;

        const value = draft.formPayload[key];
        if (Array.isArray(value)) return value.length > 0;
        return Boolean(value);
      });
    };

    return stepConfigs.map((config, index) => {
      const baseStepProps = {
        onBack: goBack,
        onNext: goNext,
        disableBack: draft.currentStep === 1,
        disableNext: draft.currentStep === TOTAL_STEPS || !canProceedForConfig(config),
        layoutVariant: config.layoutVariant
      };

      if (index === 0) {
        return {
          ...config,
          render: () => (
            <ApplicationWizardTermsStep
              acceptedTerms={draft.termsAccepted}
              onAcceptedTermsChange={(value) => setDraft((prev) => ({ ...prev, termsAccepted: value }))}
              {...baseStepProps}
            />
          )
        };
      }

      if (index === 1) {
        return {
          ...config,
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
              purposeOfStay={draft.formPayload.purposeOfStay ?? ''}
              onPurposeOfStayChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  formPayload: { ...prev.formPayload, purposeOfStay: value }
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
              specialCategoryEntryType={draft.formPayload.specialCategoryEntryType ?? ''}
              onSpecialCategoryEntryTypeChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  formPayload: { ...prev.formPayload, specialCategoryEntryType: value }
                }))
              }
              {...baseStepProps}
            />
          )
        };
      }

      if (index === 2) {
        return {
          ...config,
          render: () => (
            <ApplicationWizardTravelStayPlansStep
              travelDate={draft.formPayload.travelDate ?? ''}
              onTravelDateChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  formPayload: { ...prev.formPayload, travelDate: value }
                }))
              }
              plannedDepartureDate={draft.formPayload.plannedDepartureDate ?? ''}
              onPlannedDepartureDateChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  formPayload: { ...prev.formPayload, plannedDepartureDate: value }
                }))
              }
              accommodationDetails={draft.formPayload.accommodationDetails ?? ''}
              onAccommodationDetailsChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  formPayload: { ...prev.formPayload, accommodationDetails: value }
                }))
              }
              destinationCity={draft.formPayload.destinationCity ?? ''}
              onDestinationCityChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  formPayload: { ...prev.formPayload, destinationCity: value }
                }))
              }
              hasReturnTicket={draft.formPayload.hasReturnTicket ?? ''}
              onHasReturnTicketChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  formPayload: { ...prev.formPayload, hasReturnTicket: value }
                }))
              }
              travelAndStayNotes={draft.formPayload.travelAndStayNotes ?? ''}
              onTravelAndStayNotesChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  formPayload: { ...prev.formPayload, travelAndStayNotes: value }
                }))
              }
              {...baseStepProps}
            />
          )
        };
      }

      return {
        ...config,
        render: () => (
          <ApplicationWizardInformationalStep
            stepId={`wizard-step-${config.id}`}
            title={config.title}
            subtitle={config.subtitle ?? `Section ${index + 1} of ${TOTAL_STEPS}`}
            {...baseStepProps}
          />
        )
      };
    });
  }, [draft]);

  const activeStep = steps[draft.currentStep - 1];
  const progressPercent = (draft.currentStep / TOTAL_STEPS) * 100;

  return (
    <article className="dashboard-panel dashboard-application-wizard" aria-label="Full visa application wizard">
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <div>
          <h2>Full visa application</h2>
          <small>
            Step {draft.currentStep}/{TOTAL_STEPS} · {activeStep.title}
          </small>
        </div>
        <DashboardButton type="button" variant="ghost" onClick={onBackToApplications}>
          Back to My Applications
        </DashboardButton>
      </div>

      <div className="dashboard-application-wizard__progress" aria-hidden="true">
        <div className="dashboard-application-wizard__progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {activeStep.render()}
    </article>
  );
}
