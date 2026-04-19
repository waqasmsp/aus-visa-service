import { DashboardField } from '../common/DashboardField';
import { DashboardInput } from '../common/DashboardInput';
import { DashboardTextarea } from '../common/DashboardTextarea';
import { ApplicationWizardStepGridVariant, ApplicationWizardStepLayout } from './ApplicationWizardStepLayout';

type YesNoAnswer = '' | 'yes' | 'no';

type Props = {
  travelDate: string;
  onTravelDateChange: (value: string) => void;
  plannedDepartureDate: string;
  onPlannedDepartureDateChange: (value: string) => void;
  accommodationDetails: string;
  onAccommodationDetailsChange: (value: string) => void;
  destinationCity: string;
  onDestinationCityChange: (value: string) => void;
  hasReturnTicket: YesNoAnswer;
  onHasReturnTicketChange: (value: YesNoAnswer) => void;
  travelAndStayNotes: string;
  onTravelAndStayNotesChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  disableBack: boolean;
  disableNext: boolean;
  layoutVariant?: ApplicationWizardStepGridVariant;
};

export function ApplicationWizardTravelStayPlansStep({
  travelDate,
  onTravelDateChange,
  plannedDepartureDate,
  onPlannedDepartureDateChange,
  accommodationDetails,
  onAccommodationDetailsChange,
  destinationCity,
  onDestinationCityChange,
  hasReturnTicket,
  onHasReturnTicketChange,
  travelAndStayNotes,
  onTravelAndStayNotesChange,
  onBack,
  onNext,
  disableBack,
  disableNext,
  layoutVariant = '2-col'
}: Props) {
  return (
    <ApplicationWizardStepLayout
      stepId="wizard-step-travel-and-stay"
      title="Travel and stay plans"
      gridVariant={layoutVariant}
      onBack={onBack}
      onNext={onNext}
      disableBack={disableBack}
      disableNext={disableNext}
    >
      <section className="dashboard-application-wizard__panel dashboard-application-wizard__field-span-full">
        <h2 className="dashboard-application-wizard__section-heading">Itinerary details</h2>
        <p className="dashboard-panel__note">Capture the applicant's most up-to-date travel and accommodation details.</p>

        <DashboardField className="dashboard-application-wizard__panel-row" label="Planned arrival date" htmlFor="travel-date">
          <DashboardInput id="travel-date" type="date" value={travelDate} onChange={(event) => onTravelDateChange(event.target.value)} />
        </DashboardField>

        <DashboardField className="dashboard-application-wizard__panel-row" label="Planned departure date" htmlFor="planned-departure-date">
          <DashboardInput
            id="planned-departure-date"
            type="date"
            value={plannedDepartureDate}
            onChange={(event) => onPlannedDepartureDateChange(event.target.value)}
          />
        </DashboardField>

        <DashboardField className="dashboard-application-wizard__panel-row" label="Primary destination city" htmlFor="destination-city">
          <DashboardInput
            id="destination-city"
            type="text"
            placeholder="Sydney"
            value={destinationCity}
            onChange={(event) => onDestinationCityChange(event.target.value)}
          />
        </DashboardField>

        <DashboardField className="dashboard-application-wizard__panel-row" label="Accommodation details" htmlFor="accommodation-details">
          <DashboardTextarea
            id="accommodation-details"
            rows={3}
            placeholder="Hotel name, host details, or planned address"
            value={accommodationDetails}
            onChange={(event) => onAccommodationDetailsChange(event.target.value)}
          />
        </DashboardField>

        <DashboardField className="dashboard-application-wizard__panel-row" label="Return/onward ticket booked?" htmlFor="has-return-ticket">
          <fieldset className="dashboard-application-wizard__radio-group" id="has-return-ticket">
            <label>
              <input type="radio" name="hasReturnTicket" value="yes" checked={hasReturnTicket === 'yes'} onChange={() => onHasReturnTicketChange('yes')} />
              Yes
            </label>
            <label>
              <input type="radio" name="hasReturnTicket" value="no" checked={hasReturnTicket === 'no'} onChange={() => onHasReturnTicketChange('no')} />
              No
            </label>
          </fieldset>
        </DashboardField>

        <DashboardField className="dashboard-application-wizard__panel-row" label="Additional travel notes" htmlFor="travel-and-stay-notes">
          <DashboardTextarea
            id="travel-and-stay-notes"
            rows={3}
            placeholder="Any recent updates about travel or stay arrangements"
            value={travelAndStayNotes}
            onChange={(event) => onTravelAndStayNotesChange(event.target.value)}
          />
        </DashboardField>

      </section>
    </ApplicationWizardStepLayout>
  );
}
