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
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

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
    <div className="application-form-overlay" role="dialog" aria-modal="true" aria-label="Visa application form">
      <button type="button" className="application-form-overlay__backdrop" aria-label="Close form" onClick={onClose} />

      <div className="application-form-screen">
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
          </aside>

          <section className="application-form-card" aria-label="Personal details">
            <header className="application-form-card__header">
              <h1>Personal Details</h1>
              <p>Enter the details as they appear on your passport</p>
            </header>

            <form className="application-step-form" onSubmit={(event) => event.preventDefault()}>
              <div className="application-form-grid application-form-grid--two">
                <label className="application-field">
                  <span>First and middle name</span>
                  <input type="text" name="firstName" placeholder="John William" autoComplete="given-name" />
                </label>

                <label className="application-field">
                  <span>Last name</span>
                  <input type="text" name="lastName" placeholder="Smith" autoComplete="family-name" />
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
          </section>
        </div>
      </div>
    </div>
  );
}
