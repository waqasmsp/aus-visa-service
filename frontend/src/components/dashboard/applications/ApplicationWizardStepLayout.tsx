import { ReactNode } from 'react';
import { DashboardButton } from '../common/DashboardButton';

export type ApplicationWizardStepGridVariant = '1-col' | '2-col' | '3-col';

type Props = {
  stepId: string;
  title: string;
  subtitle?: string;
  gridVariant?: ApplicationWizardStepGridVariant;
  onBack: () => void;
  onNext: () => void;
  disableBack?: boolean;
  disableNext?: boolean;
  children: ReactNode;
};

export function ApplicationWizardStepLayout({
  stepId,
  title,
  subtitle,
  gridVariant = '1-col',
  onBack,
  onNext,
  disableBack = false,
  disableNext = false,
  children
}: Props) {
  return (
    <section className="dashboard-application-wizard__step" aria-labelledby={`${stepId}-title`}>
      <header className="dashboard-panel__header">
        <h2 id={`${stepId}-title`}>{title}</h2>
        {subtitle ? <p className="dashboard-panel__note">{subtitle}</p> : null}
      </header>

      <div className={`dashboard-application-wizard__field-grid dashboard-application-wizard__field-grid--${gridVariant}`}>{children}</div>

      <footer className="dashboard-application-wizard__actions dashboard-application-wizard__actions--sticky">
        <DashboardButton type="button" variant="ghost" onClick={onBack} disabled={disableBack}>
          Back
        </DashboardButton>
        <DashboardButton type="button" variant="primary" onClick={onNext} disabled={disableNext}>
          Next
        </DashboardButton>
      </footer>
    </section>
  );
}
