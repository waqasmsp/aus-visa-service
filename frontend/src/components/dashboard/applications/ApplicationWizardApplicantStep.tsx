import { currentLocationCountryOptions } from '../../../constants/applicationFormOptions';
import { DashboardField } from '../common/DashboardField';
import { DashboardInput } from '../common/DashboardInput';
import { DashboardSelect } from '../common/DashboardSelect';
import { ApplicationWizardStepGridVariant, ApplicationWizardStepLayout } from './ApplicationWizardStepLayout';

type YesNoAnswer = '' | 'yes' | 'no';
type SexAnswer = '' | 'female' | 'male' | 'other';

type Props = {
  familyName: string;
  onFamilyNameChange: (value: string) => void;
  givenNames: string;
  onGivenNamesChange: (value: string) => void;
  sex: SexAnswer;
  onSexChange: (value: SexAnswer) => void;
  dateOfBirth: string;
  onDateOfBirthChange: (value: string) => void;
  passportNumber: string;
  onPassportNumberChange: (value: string) => void;
  passportCountry: string;
  onPassportCountryChange: (value: string) => void;
  passportNationality: string;
  onPassportNationalityChange: (value: string) => void;
  passportIssueDate: string;
  onPassportIssueDateChange: (value: string) => void;
  passportExpiryDate: string;
  onPassportExpiryDateChange: (value: string) => void;
  placeOfIssue: string;
  onPlaceOfIssueChange: (value: string) => void;
  hasNationalIdentityCard: YesNoAnswer;
  onHasNationalIdentityCardChange: (value: YesNoAnswer) => void;
  hasPacificAustraliaCard: YesNoAnswer;
  onHasPacificAustraliaCardChange: (value: YesNoAnswer) => void;
  birthTownCity: string;
  onBirthTownCityChange: (value: string) => void;
  birthStateProvince: string;
  onBirthStateProvinceChange: (value: string) => void;
  birthCountry: string;
  onBirthCountryChange: (value: string) => void;
  relationshipStatus: string;
  onRelationshipStatusChange: (value: string) => void;
  hasOtherNames: YesNoAnswer;
  onHasOtherNamesChange: (value: YesNoAnswer) => void;
  isCitizenOfPassportCountry: YesNoAnswer;
  onIsCitizenOfPassportCountryChange: (value: YesNoAnswer) => void;
  isCitizenOfOtherCountry: YesNoAnswer;
  onIsCitizenOfOtherCountryChange: (value: YesNoAnswer) => void;
  hasPreviouslyTravelledToAustralia: YesNoAnswer;
  onHasPreviouslyTravelledToAustraliaChange: (value: YesNoAnswer) => void;
  hasPreviouslyAppliedAustralianVisa: YesNoAnswer;
  onHasPreviouslyAppliedAustralianVisaChange: (value: YesNoAnswer) => void;
  hasAustralianVisaGrantNumber: YesNoAnswer;
  onHasAustralianVisaGrantNumberChange: (value: YesNoAnswer) => void;
  hasOtherPassportsOrTravelDocuments: YesNoAnswer;
  onHasOtherPassportsOrTravelDocumentsChange: (value: YesNoAnswer) => void;
  hasOtherIdentityDocuments: YesNoAnswer;
  onHasOtherIdentityDocumentsChange: (value: YesNoAnswer) => void;
  hasHealthExaminationLast12Months: YesNoAnswer;
  onHasHealthExaminationLast12MonthsChange: (value: YesNoAnswer) => void;
  onBack: () => void;
  onNext: () => void;
  disableBack: boolean;
  disableNext: boolean;
  layoutVariant?: ApplicationWizardStepGridVariant;
};

function YesNoField({
  label,
  name,
  value,
  onChange
}: {
  label: string;
  name: string;
  value: YesNoAnswer;
  onChange: (value: YesNoAnswer) => void;
}) {
  return (
    <DashboardField className="dashboard-application-wizard__panel-row" label={label} htmlFor={name}>
      <fieldset className="dashboard-application-wizard__radio-group" id={name}>
        <label>
          <input type="radio" name={name} value="yes" checked={value === 'yes'} onChange={() => onChange('yes')} />
          Yes
        </label>
        <label>
          <input type="radio" name={name} value="no" checked={value === 'no'} onChange={() => onChange('no')} />
          No
        </label>
      </fieldset>
    </DashboardField>
  );
}

export function ApplicationWizardApplicantStep({
  familyName,
  onFamilyNameChange,
  givenNames,
  onGivenNamesChange,
  sex,
  onSexChange,
  dateOfBirth,
  onDateOfBirthChange,
  passportNumber,
  onPassportNumberChange,
  passportCountry,
  onPassportCountryChange,
  passportNationality,
  onPassportNationalityChange,
  passportIssueDate,
  onPassportIssueDateChange,
  passportExpiryDate,
  onPassportExpiryDateChange,
  placeOfIssue,
  onPlaceOfIssueChange,
  hasNationalIdentityCard,
  onHasNationalIdentityCardChange,
  hasPacificAustraliaCard,
  onHasPacificAustraliaCardChange,
  birthTownCity,
  onBirthTownCityChange,
  birthStateProvince,
  onBirthStateProvinceChange,
  birthCountry,
  onBirthCountryChange,
  relationshipStatus,
  onRelationshipStatusChange,
  hasOtherNames,
  onHasOtherNamesChange,
  isCitizenOfPassportCountry,
  onIsCitizenOfPassportCountryChange,
  isCitizenOfOtherCountry,
  onIsCitizenOfOtherCountryChange,
  hasPreviouslyTravelledToAustralia,
  onHasPreviouslyTravelledToAustraliaChange,
  hasPreviouslyAppliedAustralianVisa,
  onHasPreviouslyAppliedAustralianVisaChange,
  hasAustralianVisaGrantNumber,
  onHasAustralianVisaGrantNumberChange,
  hasOtherPassportsOrTravelDocuments,
  onHasOtherPassportsOrTravelDocumentsChange,
  hasOtherIdentityDocuments,
  onHasOtherIdentityDocumentsChange,
  hasHealthExaminationLast12Months,
  onHasHealthExaminationLast12MonthsChange,
  onBack,
  onNext,
  disableBack,
  disableNext,
  layoutVariant = '3-col'
}: Props) {
  return (
    <ApplicationWizardStepLayout
      stepId="wizard-step-applicant"
      title="Applicant"
      subtitle="Step 3 passport and identity details"
      gridVariant={layoutVariant}
      onBack={onBack}
      onNext={onNext}
      disableBack={disableBack}
      disableNext={disableNext}
    >
      <section className="dashboard-application-wizard__panel dashboard-application-wizard__field-span-full">
        <h2 className="dashboard-application-wizard__section-heading">Passport details</h2>
        <p className="dashboard-panel__note">
          Enter the details exactly as they appear in the applicant&apos;s personal passport.
        </p>

        <DashboardField className="dashboard-application-wizard__panel-row" label="Family name" htmlFor="family-name">
          <DashboardInput id="family-name" value={familyName} onChange={(event) => onFamilyNameChange(event.target.value)} />
        </DashboardField>
        <DashboardField className="dashboard-application-wizard__panel-row" label="Given names" htmlFor="given-names">
          <DashboardInput id="given-names" value={givenNames} onChange={(event) => onGivenNamesChange(event.target.value)} />
        </DashboardField>

        <DashboardField className="dashboard-application-wizard__panel-row" label="Sex" htmlFor="sex">
          <DashboardSelect id="sex" value={sex} onChange={(event) => onSexChange(event.target.value as SexAnswer)}>
            <option value="">Select sex</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </DashboardSelect>
        </DashboardField>
        <DashboardField className="dashboard-application-wizard__panel-row" label="Date of birth" htmlFor="date-of-birth">
          <DashboardInput id="date-of-birth" type="date" value={dateOfBirth} onChange={(event) => onDateOfBirthChange(event.target.value)} />
        </DashboardField>
        <DashboardField className="dashboard-application-wizard__panel-row" label="Passport number" htmlFor="passport-number">
          <DashboardInput id="passport-number" value={passportNumber} onChange={(event) => onPassportNumberChange(event.target.value)} />
        </DashboardField>

        <DashboardField className="dashboard-application-wizard__panel-row" label="Country of passport" htmlFor="passport-country">
          <DashboardSelect id="passport-country" value={passportCountry} onChange={(event) => onPassportCountryChange(event.target.value)}>
            <option value="">Select country</option>
            {currentLocationCountryOptions.map((country) => (
              <option key={`passport-country-${country.value}`} value={country.value}>
                {country.label}
              </option>
            ))}
          </DashboardSelect>
        </DashboardField>
        <DashboardField className="dashboard-application-wizard__panel-row" label="Nationality of passport holder" htmlFor="passport-nationality">
          <DashboardSelect id="passport-nationality" value={passportNationality} onChange={(event) => onPassportNationalityChange(event.target.value)}>
            <option value="">Select country</option>
            {currentLocationCountryOptions.map((country) => (
              <option key={`passport-nationality-${country.value}`} value={country.value}>
                {country.label}
              </option>
            ))}
          </DashboardSelect>
        </DashboardField>
        <DashboardField className="dashboard-application-wizard__panel-row" label="Date of issue" htmlFor="passport-issue-date">
          <DashboardInput
            id="passport-issue-date"
            type="date"
            value={passportIssueDate}
            onChange={(event) => onPassportIssueDateChange(event.target.value)}
          />
        </DashboardField>
        <DashboardField className="dashboard-application-wizard__panel-row" label="Date of expiry" htmlFor="passport-expiry-date">
          <DashboardInput
            id="passport-expiry-date"
            type="date"
            value={passportExpiryDate}
            onChange={(event) => onPassportExpiryDateChange(event.target.value)}
          />
        </DashboardField>
        <DashboardField className="dashboard-application-wizard__panel-row" label="Place of issue / issuing authority" htmlFor="place-of-issue">
          <DashboardInput id="place-of-issue" value={placeOfIssue} onChange={(event) => onPlaceOfIssueChange(event.target.value)} />
        </DashboardField>

        <YesNoField
          label="Does this applicant have a national identity card?"
          name="has-national-identity-card"
          value={hasNationalIdentityCard}
          onChange={onHasNationalIdentityCardChange}
        />
        <YesNoField
          label="Is the applicant a Pacific-Australia Card holder?"
          name="has-pacific-australia-card"
          value={hasPacificAustraliaCard}
          onChange={onHasPacificAustraliaCardChange}
        />

        <h2 className="dashboard-application-wizard__section-heading">Place of birth</h2>
        <DashboardField className="dashboard-application-wizard__panel-row" label="Town / City" htmlFor="birth-town-city">
          <DashboardInput id="birth-town-city" value={birthTownCity} onChange={(event) => onBirthTownCityChange(event.target.value)} />
        </DashboardField>
        <DashboardField className="dashboard-application-wizard__panel-row" label="State / Province" htmlFor="birth-state-province">
          <DashboardInput id="birth-state-province" value={birthStateProvince} onChange={(event) => onBirthStateProvinceChange(event.target.value)} />
        </DashboardField>
        <DashboardField className="dashboard-application-wizard__panel-row" label="Country of birth" htmlFor="birth-country">
          <DashboardSelect id="birth-country" value={birthCountry} onChange={(event) => onBirthCountryChange(event.target.value)}>
            <option value="">Select country</option>
            {currentLocationCountryOptions.map((country) => (
              <option key={`birth-country-${country.value}`} value={country.value}>
                {country.label}
              </option>
            ))}
          </DashboardSelect>
        </DashboardField>

        <DashboardField className="dashboard-application-wizard__panel-row" label="Relationship status" htmlFor="relationship-status">
          <DashboardSelect id="relationship-status" value={relationshipStatus} onChange={(event) => onRelationshipStatusChange(event.target.value)}>
            <option value="">Select status</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="de-facto">De facto</option>
            <option value="separated">Separated</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </DashboardSelect>
        </DashboardField>

        <YesNoField label="Other names / spellings?" name="has-other-names" value={hasOtherNames} onChange={onHasOtherNamesChange} />
        <YesNoField
          label="Is this applicant a citizen of the selected country of passport?"
          name="citizen-of-passport-country"
          value={isCitizenOfPassportCountry}
          onChange={onIsCitizenOfPassportCountryChange}
        />
        <YesNoField
          label="Is this applicant a citizen of any other country?"
          name="citizen-of-other-country"
          value={isCitizenOfOtherCountry}
          onChange={onIsCitizenOfOtherCountryChange}
        />
        <YesNoField
          label="Has this applicant previously travelled to Australia?"
          name="previously-travelled-australia"
          value={hasPreviouslyTravelledToAustralia}
          onChange={onHasPreviouslyTravelledToAustraliaChange}
        />
        <YesNoField
          label="Has this applicant previously applied for a visa to Australia?"
          name="previously-applied-visa-australia"
          value={hasPreviouslyAppliedAustralianVisa}
          onChange={onHasPreviouslyAppliedAustralianVisaChange}
        />
        <YesNoField
          label="Does this applicant have an Australian visa grant number?"
          name="has-grant-number"
          value={hasAustralianVisaGrantNumber}
          onChange={onHasAustralianVisaGrantNumberChange}
        />
        <YesNoField
          label="Does this applicant have other passports or documents for travel?"
          name="has-other-passports-documents"
          value={hasOtherPassportsOrTravelDocuments}
          onChange={onHasOtherPassportsOrTravelDocumentsChange}
        />
        <YesNoField
          label="Does this applicant have other identity documents?"
          name="has-other-identity-documents"
          value={hasOtherIdentityDocuments}
          onChange={onHasOtherIdentityDocumentsChange}
        />
        <YesNoField
          label="Has this applicant undertaken a health examination for an Australian visa in the last 12 months?"
          name="has-health-exam-last-12-months"
          value={hasHealthExaminationLast12Months}
          onChange={onHasHealthExaminationLast12MonthsChange}
        />
      </section>
    </ApplicationWizardStepLayout>
  );
}
