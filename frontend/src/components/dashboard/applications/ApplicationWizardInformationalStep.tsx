import { ApplicationWizardStepGridVariant, ApplicationWizardStepLayout } from './ApplicationWizardStepLayout';

type Props = {
  stepId: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
  onNext: () => void;
  disableBack: boolean;
  disableNext: boolean;
  layoutVariant?: ApplicationWizardStepGridVariant;
};

export function ApplicationWizardInformationalStep({
  stepId,
  title,
  subtitle,
  onBack,
  onNext,
  disableBack,
  disableNext,
  layoutVariant = '2-col'
}: Props) {
  return (
    <ApplicationWizardStepLayout
      stepId={stepId}
      title={title}
      subtitle={subtitle}
      gridVariant={layoutVariant}
      onBack={onBack}
      onNext={onNext}
      disableBack={disableBack}
      disableNext={disableNext}
    >
      <p className="dashboard-panel__note dashboard-application-wizard__field-span-full">
        This step is now wired into the full wizard flow and ready for dedicated fields to be added.
      </p>
    </ApplicationWizardStepLayout>
  );
}
