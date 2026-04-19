import { useEffect } from 'react';
import { DashboardButton } from '../common/DashboardButton';
import { DashboardField } from '../common/DashboardField';
import { DashboardInput } from '../common/DashboardInput';
import { DashboardSelect } from '../common/DashboardSelect';
import { DashboardTextarea } from '../common/DashboardTextarea';
import {
  currentLocationCountryOptions,
  legalStatusOptions,
  purposeOfStayOptions,
  reasonForVisitingAustraliaOptions
} from '../../../constants/applicationFormOptions';
import { ApplicationWizardStepGridVariant, ApplicationWizardStepLayout } from './ApplicationWizardStepLayout';

type CurrentLocationAnswer = 'yes' | 'no' | '';
type SpecialCategoryAnswer = 'yes' | 'no' | '';
type SpecialCategoryTypeAnswer = '' | 'foreign-government-representative' | 'un-laissez-passer' | 'exempt-group';
type GroupProcessingAnswer = 'yes' | 'no' | '';
type PurposeOfStayAnswer = '' | 'business-visitor' | 'frequent-traveller' | 'sponsored-family' | 'tourist';

type Props = {
  isOutsideAustralia: CurrentLocationAnswer;
  onIsOutsideAustraliaChange: (value: CurrentLocationAnswer) => void;
  currentLocation: string;
  onCurrentLocationChange: (value: string) => void;
  legalStatus: string;
  onLegalStatusChange: (value: string) => void;
  purposeOfStay: PurposeOfStayAnswer;
  onPurposeOfStayChange: (value: PurposeOfStayAnswer) => void;
  visitReasons: string[];
  onVisitReasonsChange: (value: string[]) => void;
  significantVisitDates: string;
  onSignificantVisitDatesChange: (value: string) => void;
  isGroupProcessing: GroupProcessingAnswer;
  onIsGroupProcessingChange: (value: GroupProcessingAnswer) => void;
  lengthOfFurtherStay: string;
  onLengthOfFurtherStayChange: (value: string) => void;
  requestedEndDate: string;
  onRequestedEndDateChange: (value: string) => void;
  reasonForFurtherStay: string;
  onReasonForFurtherStayChange: (value: string) => void;
  specialCategoryOfEntry: SpecialCategoryAnswer;
  onSpecialCategoryOfEntryChange: (value: SpecialCategoryAnswer) => void;
  specialCategoryEntryType: SpecialCategoryTypeAnswer;
  onSpecialCategoryEntryTypeChange: (value: SpecialCategoryTypeAnswer) => void;
  onBack: () => void;
  onNext: () => void;
  disableBack: boolean;
  disableNext: boolean;
  layoutVariant?: ApplicationWizardStepGridVariant;
};

export function ApplicationWizardCurrentLocationStep({
  isOutsideAustralia,
  onIsOutsideAustraliaChange,
  currentLocation,
  onCurrentLocationChange,
  legalStatus,
  onLegalStatusChange,
  purposeOfStay,
  onPurposeOfStayChange,
  visitReasons,
  onVisitReasonsChange,
  significantVisitDates,
  onSignificantVisitDatesChange,
  isGroupProcessing,
  onIsGroupProcessingChange,
  lengthOfFurtherStay,
  onLengthOfFurtherStayChange,
  requestedEndDate,
  onRequestedEndDateChange,
  reasonForFurtherStay,
  onReasonForFurtherStayChange,
  specialCategoryOfEntry,
  onSpecialCategoryOfEntryChange,
  specialCategoryEntryType,
  onSpecialCategoryEntryTypeChange,
  onBack,
  onNext,
  disableBack,
  disableNext,
  layoutVariant = '2-col'
}: Props) {
  const showOutsideAustraliaFields = isOutsideAustralia === 'yes';
  const showFurtherStayFields = isOutsideAustralia === 'no';
  const showSpecialCategoryForOutsideAustralia = showOutsideAustraliaFields && ['business-visitor', 'tourist'].includes(purposeOfStay);
  const showSponsoredFamilyNote = showOutsideAustraliaFields && purposeOfStay === 'sponsored-family';
  const canAddMoreVisitReasons = visitReasons.length < 3 && visitReasons.length < reasonForVisitingAustraliaOptions.length;

  const addVisitReason = () => {
    if (!canAddMoreVisitReasons) return;

    onVisitReasonsChange([...visitReasons, '']);
  };

  const onVisitReasonChange = (index: number, value: string) => {
    const updatedReasons = [...visitReasons];
    updatedReasons[index] = value;
    onVisitReasonsChange(updatedReasons);
  };

  const removeVisitReason = (index: number) => {
    onVisitReasonsChange(visitReasons.filter((_, reasonIndex) => reasonIndex !== index));
  };

  useEffect(() => {
    if (!showSpecialCategoryForOutsideAustralia) return;
    if (specialCategoryOfEntry) return;
    onSpecialCategoryOfEntryChange('no');
  }, [onSpecialCategoryOfEntryChange, showSpecialCategoryForOutsideAustralia, specialCategoryOfEntry]);

  return (
    <ApplicationWizardStepLayout
      stepId="wizard-step-location"
      title="Application context"
      gridVariant={layoutVariant}
      onBack={onBack}
      onNext={onNext}
      disableBack={disableBack}
      disableNext={disableNext}
    >
      <div className="dashboard-application-wizard__group dashboard-application-wizard__field-span-full">
        <section className="dashboard-application-wizard__panel">
          <h2 className="dashboard-application-wizard__section-heading">Current location</h2>
          <fieldset className="dashboard-application-wizard__radio-group">
            <legend>Is the applicant currently outside Australia?</legend>
            <label>
              <input
                type="radio"
                name="isOutsideAustralia"
                value="yes"
                checked={isOutsideAustralia === 'yes'}
                onChange={() => onIsOutsideAustraliaChange('yes')}
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="isOutsideAustralia"
                value="no"
                checked={isOutsideAustralia === 'no'}
                onChange={() => onIsOutsideAustraliaChange('no')}
              />
              No
            </label>
          </fieldset>
        </section>

        {showOutsideAustraliaFields ? (
          <>
            <section className="dashboard-application-wizard__panel">
              <p className="dashboard-panel__note">Give the current location of the applicant and their legal status at this location.</p>

            <DashboardField className="dashboard-application-wizard__panel-row" label="Current location" htmlFor="current-location">
              <DashboardSelect id="current-location" value={currentLocation} onChange={(event) => onCurrentLocationChange(event.target.value)}>
                <option value="">Select country</option>
                {currentLocationCountryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </DashboardSelect>
            </DashboardField>

            <DashboardField className="dashboard-application-wizard__panel-row" label="Legal status" htmlFor="legal-status">
              <DashboardSelect id="legal-status" value={legalStatus} onChange={(event) => onLegalStatusChange(event.target.value)}>
                <option value="">Select legal status</option>
                {legalStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </DashboardSelect>
            </DashboardField>

            <DashboardField className="dashboard-application-wizard__panel-row" label="Purpose of stay" htmlFor="purpose-of-stay">
              <fieldset className="dashboard-application-wizard__stacked-radio-group">
                <legend>Select the stream the applicant is applying for:</legend>
                {purposeOfStayOptions.map((option) => (
                  <label key={option.value}>
                    <input
                      type="radio"
                      name="purposeOfStay"
                      value={option.value}
                      checked={purposeOfStay === option.value}
                      onChange={() => onPurposeOfStayChange(option.value as PurposeOfStayAnswer)}
                    />
                    {option.label}
                  </label>
                ))}
              </fieldset>
            </DashboardField>

            <p className="dashboard-application-wizard__highlight-note">
              <strong>Note:</strong> Once the application has been lodged, the stream cannot be changed. For more information on each stream,
              click on the help icon above.
            </p>

            {showSponsoredFamilyNote ? (
              <p className="dashboard-application-wizard__highlight-note">
                <strong>Note:</strong> The Sponsored Family stream has more restrictive conditions than the Tourist stream. In some cases a
                security bond may be requested. If you are planning to visit family, you can apply for the Tourist stream which does not
                require a bond and does not require formal sponsorship.
              </p>
            ) : null}

            <DashboardField className="dashboard-application-wizard__panel-row" label="List all reasons for visiting Australia" htmlFor="visit-reason-select-1">
              <div className="dashboard-application-wizard__visit-reasons-stack">
                {visitReasons.map((reason, index) => (
                  <div key={`visit-reason-${index + 1}`} className="dashboard-application-wizard__visit-reasons-control">
                    <DashboardSelect id={`visit-reason-select-${index + 1}`} value={reason} onChange={(event) => onVisitReasonChange(index, event.target.value)}>
                      <option value="">Select reason</option>
                      {reasonForVisitingAustraliaOptions.map((option) => (
                        <option key={option.value} value={option.value} disabled={visitReasons.some((item, itemIndex) => itemIndex !== index && item === option.value)}>
                          {option.label}
                        </option>
                      ))}
                    </DashboardSelect>
                    {visitReasons.length > 1 ? (
                      <DashboardButton type="button" size="sm" variant="ghost" onClick={() => removeVisitReason(index)}>
                        Remove
                      </DashboardButton>
                    ) : null}
                  </div>
                ))}

                <DashboardButton type="button" size="sm" onClick={addVisitReason} disabled={!canAddMoreVisitReasons}>
                  Add another reason
                </DashboardButton>
              </div>
            </DashboardField>

              <DashboardField
                className="dashboard-application-wizard__panel-row"
                label="Give details of any significant dates on which the applicant needs to be in Australia"
                htmlFor="significant-visit-dates"
              >
                <DashboardTextarea
                  id="significant-visit-dates"
                  rows={4}
                  value={significantVisitDates}
                  onChange={(event) => onSignificantVisitDatesChange(event.target.value)}
                />
              </DashboardField>
            </section>

            <section className="dashboard-application-wizard__panel">
              <h3 className="dashboard-application-wizard__subheading">Group processing</h3>
              <fieldset className="dashboard-application-wizard__radio-group">
                <legend>Is this application being lodged as part of a group of applications?</legend>
                <label>
                  <input
                    type="radio"
                    name="isGroupProcessing"
                    value="yes"
                    checked={isGroupProcessing === 'yes'}
                    onChange={() => onIsGroupProcessingChange('yes')}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="isGroupProcessing"
                    value="no"
                    checked={isGroupProcessing === 'no'}
                    onChange={() => onIsGroupProcessingChange('no')}
                  />
                  No
                </label>
              </fieldset>
            </section>

            {showSpecialCategoryForOutsideAustralia ? (
              <section className="dashboard-application-wizard__panel">
                <h3 className="dashboard-application-wizard__subheading">Special category of entry</h3>
                <fieldset className="dashboard-application-wizard__radio-group">
                  <legend>
                    Is the applicant travelling as a representative of a foreign government, travelling on a United Nations Laissez-Passer or a
                    member of an exempt group?
                  </legend>
                  <label>
                    <input
                      type="radio"
                      name="specialCategoryOfEntry"
                      value="yes"
                      checked={specialCategoryOfEntry === 'yes'}
                      onChange={() => onSpecialCategoryOfEntryChange('yes')}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="specialCategoryOfEntry"
                      value="no"
                      checked={specialCategoryOfEntry === 'no'}
                      onChange={() => {
                        onSpecialCategoryOfEntryChange('no');
                        onSpecialCategoryEntryTypeChange('');
                      }}
                    />
                    No
                  </label>
                </fieldset>

                {specialCategoryOfEntry === 'yes' ? (
                  <fieldset className="dashboard-application-wizard__radio-group">
                    <legend>Select the special category of entry</legend>
                    <label>
                      <input
                        type="radio"
                        name="specialCategoryEntryType"
                        value="foreign-government-representative"
                        checked={specialCategoryEntryType === 'foreign-government-representative'}
                        onChange={() => onSpecialCategoryEntryTypeChange('foreign-government-representative')}
                      />
                      Travelling as a foreign government representative
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="specialCategoryEntryType"
                        value="un-laissez-passer"
                        checked={specialCategoryEntryType === 'un-laissez-passer'}
                        onChange={() => onSpecialCategoryEntryTypeChange('un-laissez-passer')}
                      />
                      Travelling on a United Nations Laissez-Passer
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="specialCategoryEntryType"
                        value="exempt-group"
                        checked={specialCategoryEntryType === 'exempt-group'}
                        onChange={() => onSpecialCategoryEntryTypeChange('exempt-group')}
                      />
                      Member of an exempt group
                    </label>
                  </fieldset>
                ) : null}
              </section>
            ) : null}
          </>
        ) : null}

        {showFurtherStayFields ? (
          <>
            <section className="dashboard-application-wizard__panel">
              <h2 className="dashboard-application-wizard__section-heading">Further stay request</h2>
              <p className="dashboard-application-wizard__note">
                Note: Applications for the Visitor visa made within Australia are for the Tourist stream of the visa.
              </p>

            <p className="dashboard-panel__note">Give details of the request for further stay.</p>

            <DashboardField className="dashboard-application-wizard__panel-row" label="Length of further stay" htmlFor="length-of-further-stay">
              <DashboardSelect
                id="length-of-further-stay"
                value={lengthOfFurtherStay}
                onChange={(event) => onLengthOfFurtherStayChange(event.target.value)}
              >
                <option value="">Select length</option>
                <option value="up-to-3-months">Up to 3 months</option>
                <option value="up-to-6-months">Up to 6 months</option>
                <option value="up-to-12-months">Up to 12 months</option>
              </DashboardSelect>
            </DashboardField>

            <DashboardField className="dashboard-application-wizard__panel-row" label="Requested end date" htmlFor="requested-end-date">
              <DashboardInput
                id="requested-end-date"
                type="date"
                value={requestedEndDate}
                onChange={(event) => onRequestedEndDateChange(event.target.value)}
              />
            </DashboardField>

            <p className="dashboard-application-wizard__note">
              Note: If the request for further stay will result in the applicant being in Australia for more than 12 months on certain
              visitor, working holiday and bridging visas, they must demonstrate that they have exceptional reasons for the further stay.
            </p>

              <DashboardField className="dashboard-application-wizard__panel-row" label="Reason for further stay" htmlFor="reason-for-further-stay">
                <DashboardTextarea
                  id="reason-for-further-stay"
                  rows={4}
                  value={reasonForFurtherStay}
                  onChange={(event) => onReasonForFurtherStayChange(event.target.value)}
                />
              </DashboardField>
            </section>

            <section className="dashboard-application-wizard__panel">
              <h3 className="dashboard-application-wizard__subheading">Special category of entry</h3>
              <fieldset className="dashboard-application-wizard__radio-group">
                <legend>
                  Is the applicant travelling as a representative of a foreign government, travelling on a United Nations Laissez-Passer or a
                  member of an exempt group?
                </legend>
                <label>
                  <input
                    type="radio"
                    name="specialCategoryOfEntry"
                    value="yes"
                    checked={specialCategoryOfEntry === 'yes'}
                    onChange={() => onSpecialCategoryOfEntryChange('yes')}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="specialCategoryOfEntry"
                    value="no"
                    checked={specialCategoryOfEntry === 'no'}
                    onChange={() => {
                      onSpecialCategoryOfEntryChange('no');
                      onSpecialCategoryEntryTypeChange('');
                    }}
                  />
                  No
                </label>
              </fieldset>

              {specialCategoryOfEntry === 'yes' ? (
                <fieldset className="dashboard-application-wizard__radio-group">
                  <legend>Select the special category of entry</legend>
                  <label>
                  <input
                    type="radio"
                    name="specialCategoryEntryType"
                    value="foreign-government-representative"
                    checked={specialCategoryEntryType === 'foreign-government-representative'}
                    onChange={() => onSpecialCategoryEntryTypeChange('foreign-government-representative')}
                  />
                  Travelling as a foreign government representative
                  </label>
                  <label>
                  <input
                    type="radio"
                    name="specialCategoryEntryType"
                    value="un-laissez-passer"
                    checked={specialCategoryEntryType === 'un-laissez-passer'}
                    onChange={() => onSpecialCategoryEntryTypeChange('un-laissez-passer')}
                  />
                  Travelling on a United Nations Laissez-Passer
                  </label>
                  <label>
                  <input
                    type="radio"
                    name="specialCategoryEntryType"
                    value="exempt-group"
                    checked={specialCategoryEntryType === 'exempt-group'}
                    onChange={() => onSpecialCategoryEntryTypeChange('exempt-group')}
                  />
                  Member of an exempt group
                  </label>
                </fieldset>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </ApplicationWizardStepLayout>
  );
}
