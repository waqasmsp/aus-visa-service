import { DashboardField } from '../common/DashboardField';
import { DashboardInput } from '../common/DashboardInput';
import { DashboardSelect } from '../common/DashboardSelect';
import { DashboardTextarea } from '../common/DashboardTextarea';

type CurrentLocationAnswer = 'yes' | 'no' | '';
type SpecialCategoryAnswer = 'yes' | 'no' | '';

type Props = {
  isOutsideAustralia: CurrentLocationAnswer;
  onIsOutsideAustraliaChange: (value: CurrentLocationAnswer) => void;
  lengthOfFurtherStay: string;
  onLengthOfFurtherStayChange: (value: string) => void;
  requestedEndDate: string;
  onRequestedEndDateChange: (value: string) => void;
  reasonForFurtherStay: string;
  onReasonForFurtherStayChange: (value: string) => void;
  specialCategoryOfEntry: SpecialCategoryAnswer;
  onSpecialCategoryOfEntryChange: (value: SpecialCategoryAnswer) => void;
};

export function ApplicationWizardCurrentLocationStep({
  isOutsideAustralia,
  onIsOutsideAustraliaChange,
  lengthOfFurtherStay,
  onLengthOfFurtherStayChange,
  requestedEndDate,
  onRequestedEndDateChange,
  reasonForFurtherStay,
  onReasonForFurtherStayChange,
  specialCategoryOfEntry,
  onSpecialCategoryOfEntryChange
}: Props) {
  const showFurtherStayFields = isOutsideAustralia === 'no';

  return (
    <section className="dashboard-application-wizard__step" aria-labelledby="wizard-step-location-title">
      <header className="dashboard-panel__header">
        <h2 id="wizard-step-location-title">Application context</h2>
      </header>

      <div className="dashboard-application-wizard__group">
        <h3>Current location</h3>
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

        {showFurtherStayFields ? (
          <>
            <p className="dashboard-application-wizard__note">
              Note: Applications for the Visitor visa made within Australia are for the Tourist stream of the visa.
            </p>

            <h3>Further stay</h3>
            <p className="dashboard-panel__note">Give details of the request for further stay.</p>

            <DashboardField label="Length of further stay" htmlFor="length-of-further-stay">
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

            <DashboardField label="Requested end date" htmlFor="requested-end-date">
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

            <DashboardField label="Reason for further stay" htmlFor="reason-for-further-stay">
              <DashboardTextarea
                id="reason-for-further-stay"
                rows={4}
                value={reasonForFurtherStay}
                onChange={(event) => onReasonForFurtherStayChange(event.target.value)}
              />
            </DashboardField>

            <h3>Special category of entry</h3>
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
                  onChange={() => onSpecialCategoryOfEntryChange('no')}
                />
                No
              </label>
            </fieldset>
          </>
        ) : null}
      </div>
    </section>
  );
}
