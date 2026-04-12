import { useEffect, useState } from 'react';

type ApplicationStepOneFormProps = {
  onClose: () => void;
};

const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => `${index + 1}`);

const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 100 }, (_, index) => `${CURRENT_YEAR - index}`);

function VisaBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="#1D4ED8" />
      <path d="M12 5.2 9.3 9.5l3.2-.8-1.3 3.8 3.9-5.3-3.2.6L12 5.2Z" fill="#fff" />
      <path d="m7.4 12.2 2.9 2.6m6.3-4.3 1.6 1.3" stroke="#67E8F9" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const STEP_ITEMS = ['Application', 'Add Travelers', 'Contact Details', 'Confirm & Submit'];

export function ApplicationStepOneForm({ onClose }: ApplicationStepOneFormProps) {
  const [applicationSubStep, setApplicationSubStep] = useState<1 | 2>(1);
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [passportInfoAvailable, setPassportInfoAvailable] = useState<'yes' | 'no' | ''>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [passportCountry, setPassportCountry] = useState('Pakistan');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportIssueDay, setPassportIssueDay] = useState('');
  const [passportIssueMonth, setPassportIssueMonth] = useState('');
  const [passportIssueYear, setPassportIssueYear] = useState('');
  const [passportExpiryDay, setPassportExpiryDay] = useState('');
  const [passportExpiryMonth, setPassportExpiryMonth] = useState('');
  const [passportExpiryYear, setPassportExpiryYear] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="application-form-screen" role="region" aria-label="Visa application form">
      <button type="button" className="application-form-close" aria-label="Close form" onClick={onClose}>
        &#10005;
      </button>

      <ol className="application-form-steps" aria-label="Application steps">
        {STEP_ITEMS.map((step, index) => (
          <li key={step} className={`application-form-step${index === 0 ? ' is-active' : ''}`}>
            <span className="application-form-step__index">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <div className="application-form-layout">
        <aside className="application-visa-card" aria-label="Selected visa summary">
          <h2>
            <span className="application-visa-card__icon" aria-hidden="true">
              <VisaBadgeIcon />
            </span>
            Australia Visitor Visa
          </h2>

          <div className="application-visa-card__line">
            <p>Approval Rate</p>
            <strong>&#128077; 99%</strong>
          </div>

          <div className="application-visa-card__line">
            <p>Secure and Safe</p>
            <strong>&#128274; 256-bit Encrypted</strong>
          </div>

          {applicationSubStep === 2 ? (
            <div className="application-visa-card__line">
              <p>Travelers</p>
              <strong>{`${firstName} ${lastName}`.trim() || 'Waqas Akber'}</strong>
            </div>
          ) : null}
        </aside>

        <section className="application-form-card" aria-label="Personal details">
          {applicationSubStep === 1 ? (
            <>
              <header className="application-form-card__header">
                <h1>Personal Details</h1>
                <p>Enter the details as they appear on your passport</p>
              </header>

              <form
                className="application-step-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setApplicationSubStep(2);
                }}
              >
                <div className="application-form-grid application-form-grid--two">
                  <label className="application-field">
                    <span>First and middle name</span>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="John William"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                    />
                  </label>

                  <label className="application-field">
                    <span>Last name</span>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Smith"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                    />
                  </label>
                </div>

                <fieldset className="application-fieldset">
                  <legend>Date of birth</legend>
                  <div className="application-form-grid application-form-grid--three">
                    <label className="application-field">
                      <span className="sr-only">Day</span>
                      <select defaultValue="">
                        <option value="" disabled>
                          Day
                        </option>
                        {DAY_OPTIONS.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="application-field">
                      <span className="sr-only">Month</span>
                      <select defaultValue="">
                        <option value="" disabled>
                          Month
                        </option>
                        {MONTH_OPTIONS.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="application-field">
                      <span className="sr-only">Year</span>
                      <select defaultValue="">
                        <option value="" disabled>
                          Year
                        </option>
                        {YEAR_OPTIONS.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </fieldset>

                <fieldset className="application-fieldset">
                  <legend>Gender</legend>
                  <div className="application-form-grid application-form-grid--two">
                    <button
                      type="button"
                      className={`application-gender-option${gender === 'male' ? ' is-selected' : ''}`}
                      onClick={() => setGender('male')}
                    >
                      <span className="application-gender-option__dot" aria-hidden="true" />
                      Male
                    </button>

                    <button
                      type="button"
                      className={`application-gender-option${gender === 'female' ? ' is-selected' : ''}`}
                      onClick={() => setGender('female')}
                    >
                      <span className="application-gender-option__dot" aria-hidden="true" />
                      Female
                    </button>
                  </div>
                </fieldset>

                <div className="application-form-actions">
                  <button type="submit" className="application-continue-button">
                    Continue
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <header className="application-form-card__header">
                <h1>Passport Details</h1>
              </header>

              <form className="application-step-form" onSubmit={(event) => event.preventDefault()}>
                <label className="application-field">
                  <span>Passport</span>
                  <div className="application-select-wrap">
                    <span className="application-select-icon" aria-hidden="true">
                      PK
                    </span>
                    <select value={passportCountry} onChange={(event) => setPassportCountry(event.target.value)}>
                      <option>Pakistan</option>
                      <option>India</option>
                      <option>Bangladesh</option>
                      <option>United Arab Emirates</option>
                      <option>United States</option>
                    </select>
                  </div>
                </label>

                <fieldset className="application-fieldset">
                  <legend>Do you have passport information available?</legend>
                  <div className="application-form-grid application-form-grid--two">
                    <button
                      type="button"
                      className={`application-gender-option${passportInfoAvailable === 'yes' ? ' is-selected' : ''}`}
                      onClick={() => setPassportInfoAvailable('yes')}
                    >
                      <span className="application-gender-option__dot" aria-hidden="true" />
                      Yes
                    </button>

                    <button
                      type="button"
                      className={`application-gender-option${passportInfoAvailable === 'no' ? ' is-selected' : ''}`}
                      onClick={() => setPassportInfoAvailable('no')}
                    >
                      <span className="application-gender-option__dot" aria-hidden="true" />
                      No
                    </button>
                  </div>
                </fieldset>

                {passportInfoAvailable === 'yes' ? (
                  <>
                    <label className="application-field">
                      <span>Passport number</span>
                      <input
                        type="text"
                        name="passportNumber"
                        placeholder="P9876543"
                        value={passportNumber}
                        onChange={(event) => setPassportNumber(event.target.value)}
                      />
                    </label>

                    <div className="application-date-block">
                      <p>Passport issue date</p>
                      <div className="application-form-grid application-form-grid--three">
                        <label className="application-field">
                          <span className="sr-only">Issue day</span>
                          <select value={passportIssueDay} onChange={(event) => setPassportIssueDay(event.target.value)}>
                            <option value="">Day</option>
                            {DAY_OPTIONS.map((day) => (
                              <option key={`issue-${day}`} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="application-field">
                          <span className="sr-only">Issue month</span>
                          <select value={passportIssueMonth} onChange={(event) => setPassportIssueMonth(event.target.value)}>
                            <option value="">Month</option>
                            {MONTH_OPTIONS.map((month) => (
                              <option key={`issue-${month}`} value={month}>
                                {month}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="application-field">
                          <span className="sr-only">Issue year</span>
                          <select value={passportIssueYear} onChange={(event) => setPassportIssueYear(event.target.value)}>
                            <option value="">Year</option>
                            {YEAR_OPTIONS.map((year) => (
                              <option key={`issue-${year}`} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="application-date-block">
                      <p>Passport expiration date</p>
                      <div className="application-form-grid application-form-grid--three">
                        <label className="application-field">
                          <span className="sr-only">Expiry day</span>
                          <select value={passportExpiryDay} onChange={(event) => setPassportExpiryDay(event.target.value)}>
                            <option value="">Day</option>
                            {DAY_OPTIONS.map((day) => (
                              <option key={`expiry-${day}`} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="application-field">
                          <span className="sr-only">Expiry month</span>
                          <select value={passportExpiryMonth} onChange={(event) => setPassportExpiryMonth(event.target.value)}>
                            <option value="">Month</option>
                            {MONTH_OPTIONS.map((month) => (
                              <option key={`expiry-${month}`} value={month}>
                                {month}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="application-field">
                          <span className="sr-only">Expiry year</span>
                          <select value={passportExpiryYear} onChange={(event) => setPassportExpiryYear(event.target.value)}>
                            <option value="">Year</option>
                            {YEAR_OPTIONS.map((year) => (
                              <option key={`expiry-${year}`} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="application-form-actions">
                  <button type="submit" className="application-continue-button">
                    Continue
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
