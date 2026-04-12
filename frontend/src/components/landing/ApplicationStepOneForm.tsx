import { useEffect, useState } from 'react';

type ApplicationStepOneFormProps = {
  onClose: () => void;
};

type YesNo = 'yes' | 'no' | '';
type ApplicationSubStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type TravelerEntry = {
  id: string;
  name: string;
  country: string;
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
const REASON_FOR_TRIP_OPTIONS = ['Tourism', 'Business', 'Family visit', 'Medical treatment', 'Conference or event'];
const STEP_ITEMS = ['Application', 'Add Travelers', 'Contact Details', 'Confirm & Submit'];

function VisaBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="#1D4ED8" />
      <path d="M12 5.2 9.3 9.5l3.2-.8-1.3 3.8 3.9-5.3-3.2.6L12 5.2Z" fill="#fff" />
      <path d="m7.4 12.2 2.9 2.6m6.3-4.3 1.6 1.3" stroke="#67E8F9" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ApplicationStepOneForm({ onClose }: ApplicationStepOneFormProps) {
  const [applicationSubStep, setApplicationSubStep] = useState<ApplicationSubStep>(1);
  const [isTravelersStage, setIsTravelersStage] = useState(false);
  const [travelers, setTravelers] = useState<TravelerEntry[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

  const [passportCountry, setPassportCountry] = useState('Pakistan');
  const [passportInfoAvailable, setPassportInfoAvailable] = useState<YesNo>('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportIssueDay, setPassportIssueDay] = useState('');
  const [passportIssueMonth, setPassportIssueMonth] = useState('');
  const [passportIssueYear, setPassportIssueYear] = useState('');
  const [passportExpiryDay, setPassportExpiryDay] = useState('');
  const [passportExpiryMonth, setPassportExpiryMonth] = useState('');
  const [passportExpiryYear, setPassportExpiryYear] = useState('');

  const [residenceCountry, setResidenceCountry] = useState('Pakistan');
  const [homeAddress, setHomeAddress] = useState('');
  const [cityOrTown, setCityOrTown] = useState('');
  const [stateOrProvince, setStateOrProvince] = useState('');
  const [zipOrPostcode, setZipOrPostcode] = useState('');

  const [isEmployed, setIsEmployed] = useState<YesNo>('');
  const [hasCriminalOffense, setHasCriminalOffense] = useState<YesNo>('');
  const [reasonForTrip, setReasonForTrip] = useState('');
  const [hasConfirmedTravelPlans, setHasConfirmedTravelPlans] = useState<YesNo>('');
  const [expectedArrivalDay, setExpectedArrivalDay] = useState('');
  const [expectedArrivalMonth, setExpectedArrivalMonth] = useState('');
  const [expectedArrivalYear, setExpectedArrivalYear] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [subscribeToUpdates, setSubscribeToUpdates] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [showTravelerPrompt, setShowTravelerPrompt] = useState(false);
  const [travelerPromptCountdown, setTravelerPromptCountdown] = useState(5);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!showTravelerPrompt) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (travelerPromptCountdown <= 1) {
        setShowTravelerPrompt(false);
        setTravelerPromptCountdown(5);
        return;
      }

      setTravelerPromptCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [showTravelerPrompt, travelerPromptCountdown]);

  const resetTravelerDraft = () => {
    setApplicationSubStep(1);
    setFirstName('');
    setLastName('');
    setGender('');
    setPassportCountry('Pakistan');
    setPassportInfoAvailable('');
    setPassportNumber('');
    setPassportIssueDay('');
    setPassportIssueMonth('');
    setPassportIssueYear('');
    setPassportExpiryDay('');
    setPassportExpiryMonth('');
    setPassportExpiryYear('');
    setResidenceCountry('Pakistan');
    setHomeAddress('');
    setCityOrTown('');
    setStateOrProvince('');
    setZipOrPostcode('');
    setIsEmployed('');
    setHasCriminalOffense('');
    setReasonForTrip('');
    setHasConfirmedTravelPlans('');
    setExpectedArrivalDay('');
    setExpectedArrivalMonth('');
    setExpectedArrivalYear('');
  };

  const startTravelerApplication = () => {
    setIsTravelersStage(true);
    resetTravelerDraft();
  };

  const completeTravelerApplication = () => {
    const travelerName = `${firstName} ${lastName}`.trim() || `Traveler ${travelers.length + 1}`;
    setTravelers((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length + 1}`,
        name: travelerName,
        country: residenceCountry || passportCountry || 'United States'
      }
    ]);
    setIsTravelersStage(true);
    setApplicationSubStep(5);
  };

  const travelerNames = travelers.map((traveler) => traveler.name).join(', ');
  const currentStage: 1 | 2 | 3 | 4 = !isTravelersStage
    ? 1
    : applicationSubStep === 6
      ? 3
      : applicationSubStep === 7
        ? 4
        : 2;

  const pricingByCountry: Record<string, { currency: string; governmentFees: number; standard: number }> = {
    Pakistan: { currency: 'PKR', governmentFees: 42218.79, standard: 76529.99 },
    India: { currency: 'INR', governmentFees: 9950, standard: 17650 },
    Bangladesh: { currency: 'BDT', governmentFees: 12800, standard: 22900 },
    'United Arab Emirates': { currency: 'AED', governmentFees: 535, standard: 965 },
    'United States': { currency: 'USD', governmentFees: 149, standard: 269 }
  };
  const primaryTravelerCountry = travelers[0]?.country ?? 'United States';
  const selectedPricing = pricingByCountry[primaryTravelerCountry] ?? pricingByCountry['United States'];
  const applicantCount = Math.max(1, travelers.length);
  const totalPerApplicant = selectedPricing.governmentFees + selectedPricing.standard;
  const totalAllApplicants = totalPerApplicant * applicantCount;
  const formatMoney = (amount: number) => `${selectedPricing.currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="application-form-screen" role="region" aria-label="Visa application form">
      <button type="button" className="application-form-close" aria-label="Close form" onClick={onClose}>
        &#10005;
      </button>

      {showTravelerPrompt ? (
        <div className="application-notice" role="alert" aria-live="polite">
          <p>Please complete first traveler details before viewing all travelers.</p>
          <span>Closing in {travelerPromptCountdown}s</span>
          <button
            type="button"
            aria-label="Close notification"
            onClick={() => {
              setShowTravelerPrompt(false);
              setTravelerPromptCountdown(5);
            }}
          >
            &#10005;
          </button>
        </div>
      ) : null}

      <ol className="application-form-steps" aria-label="Application steps">
        {STEP_ITEMS.map((step, index) => {
          const stepIndex = index + 1;
          const isCompleted = stepIndex < currentStage;
          const isActive = stepIndex === currentStage;

          return (
            <li key={step} className={`application-form-step${isActive ? ' is-active' : ''}${isCompleted ? ' is-completed' : ''}`}>
              <button
                type="button"
                className="application-form-step__button"
                onClick={() => {
                  if (stepIndex === 1) {
                    setIsTravelersStage(false);
                    resetTravelerDraft();
                  }
                  if (stepIndex === 2) {
                    startTravelerApplication();
                  }
                  if (stepIndex === 3 && travelers.length > 0) {
                    setIsTravelersStage(true);
                    setApplicationSubStep(6);
                  }
                  if (stepIndex === 4 && travelers.length > 0) {
                    setIsTravelersStage(true);
                    setApplicationSubStep(7);
                  }
                }}
              >
                <span className="application-form-step__index">{isCompleted ? '\u2713' : stepIndex}</span>
                <span>{step}</span>
              </button>
            </li>
          );
        })}
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

          {applicationSubStep >= 2 || isTravelersStage ? (
            <div className="application-visa-card__line">
              <p>Travelers</p>
              <strong>{travelerNames || `${firstName} ${lastName}`.trim() || 'Waqas Akber'}</strong>
            </div>
          ) : null}

          <button
            type="button"
            className="application-view-travelers-button"
            onClick={() => {
              if (travelers.length === 0) {
                setShowTravelerPrompt(true);
                setTravelerPromptCountdown(5);
                return;
              }

              setIsTravelersStage(true);
              setApplicationSubStep(5);
            }}
          >
            View all travelers
          </button>

          {applicationSubStep === 7 ? (
            <div className="application-pricing-card">
              <h3>Choose a processing time</h3>
              <p>Get it: Standard Processing</p>
              <button type="button" className="application-pricing-option">
                <span>
                  <strong>Standard</strong>
                  <small>Get it in 28 days</small>
                </span>
                <strong>Fastest</strong>
              </button>
              <div className="application-pricing-breakdown">
                <p><span>Government fees</span><strong>{formatMoney(selectedPricing.governmentFees)}</strong></p>
                <p><span>Standard</span><strong>{formatMoney(selectedPricing.standard)}</strong></p>
                <p><span>Total ({applicantCount} applicant{applicantCount > 1 ? 's' : ''})</span><strong>{formatMoney(totalAllApplicants)}</strong></p>
              </div>
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

              <form className="application-step-form" onSubmit={(event) => { event.preventDefault(); setApplicationSubStep(2); }}>
                <div className="application-form-grid application-form-grid--two">
                  <label className="application-field">
                    <span>First and middle name</span>
                    <input type="text" name="firstName" placeholder="John William" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
                  </label>
                  <label className="application-field">
                    <span>Last name</span>
                    <input type="text" name="lastName" placeholder="Smith" autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
                  </label>
                </div>

                <fieldset className="application-fieldset">
                  <legend>Date of birth</legend>
                  <div className="application-form-grid application-form-grid--three">
                    <label className="application-field"><span className="sr-only">Day</span><select defaultValue=""><option value="" disabled>Day</option>{DAY_OPTIONS.map((day) => <option key={day} value={day}>{day}</option>)}</select></label>
                    <label className="application-field"><span className="sr-only">Month</span><select defaultValue=""><option value="" disabled>Month</option>{MONTH_OPTIONS.map((month) => <option key={month} value={month}>{month}</option>)}</select></label>
                    <label className="application-field"><span className="sr-only">Year</span><select defaultValue=""><option value="" disabled>Year</option>{YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
                  </div>
                </fieldset>

                <fieldset className="application-fieldset">
                  <legend>Gender</legend>
                  <div className="application-form-grid application-form-grid--two">
                    <button type="button" className={`application-gender-option${gender === 'male' ? ' is-selected' : ''}`} onClick={() => setGender('male')}><span className="application-gender-option__dot" aria-hidden="true" />Male</button>
                    <button type="button" className={`application-gender-option${gender === 'female' ? ' is-selected' : ''}`} onClick={() => setGender('female')}><span className="application-gender-option__dot" aria-hidden="true" />Female</button>
                  </div>
                </fieldset>

                <div className="application-form-actions"><button type="submit" className="application-continue-button">Continue</button></div>
              </form>
            </>
          ) : applicationSubStep === 2 ? (
            <>
              <header className="application-form-card__header"><h1>Passport Details</h1></header>

              <form className="application-step-form" onSubmit={(event) => { event.preventDefault(); setApplicationSubStep(3); }}>
                <label className="application-field">
                  <span>Passport</span>
                  <div className="application-select-wrap">
                    <span className="application-select-icon" aria-hidden="true">PK</span>
                    <select value={passportCountry} onChange={(event) => setPassportCountry(event.target.value)}>
                      <option>Pakistan</option><option>India</option><option>Bangladesh</option><option>United Arab Emirates</option><option>United States</option>
                    </select>
                  </div>
                </label>

                <fieldset className="application-fieldset">
                  <legend>Do you have passport information available?</legend>
                  <div className="application-form-grid application-form-grid--two">
                    <button type="button" className={`application-gender-option${passportInfoAvailable === 'yes' ? ' is-selected' : ''}`} onClick={() => setPassportInfoAvailable('yes')}><span className="application-gender-option__dot" aria-hidden="true" />Yes</button>
                    <button type="button" className={`application-gender-option${passportInfoAvailable === 'no' ? ' is-selected' : ''}`} onClick={() => setPassportInfoAvailable('no')}><span className="application-gender-option__dot" aria-hidden="true" />No</button>
                  </div>
                </fieldset>

                {passportInfoAvailable === 'yes' ? (
                  <>
                    <label className="application-field">
                      <span>Passport number</span>
                      <input type="text" name="passportNumber" placeholder="P9876543" value={passportNumber} onChange={(event) => setPassportNumber(event.target.value)} />
                    </label>

                    <div className="application-date-block">
                      <p>Passport issue date</p>
                      <div className="application-form-grid application-form-grid--three">
                        <label className="application-field"><span className="sr-only">Issue day</span><select value={passportIssueDay} onChange={(event) => setPassportIssueDay(event.target.value)}><option value="">Day</option>{DAY_OPTIONS.map((day) => <option key={`issue-${day}`} value={day}>{day}</option>)}</select></label>
                        <label className="application-field"><span className="sr-only">Issue month</span><select value={passportIssueMonth} onChange={(event) => setPassportIssueMonth(event.target.value)}><option value="">Month</option>{MONTH_OPTIONS.map((month) => <option key={`issue-${month}`} value={month}>{month}</option>)}</select></label>
                        <label className="application-field"><span className="sr-only">Issue year</span><select value={passportIssueYear} onChange={(event) => setPassportIssueYear(event.target.value)}><option value="">Year</option>{YEAR_OPTIONS.map((year) => <option key={`issue-${year}`} value={year}>{year}</option>)}</select></label>
                      </div>
                    </div>

                    <div className="application-date-block">
                      <p>Passport expiration date</p>
                      <div className="application-form-grid application-form-grid--three">
                        <label className="application-field"><span className="sr-only">Expiry day</span><select value={passportExpiryDay} onChange={(event) => setPassportExpiryDay(event.target.value)}><option value="">Day</option>{DAY_OPTIONS.map((day) => <option key={`expiry-${day}`} value={day}>{day}</option>)}</select></label>
                        <label className="application-field"><span className="sr-only">Expiry month</span><select value={passportExpiryMonth} onChange={(event) => setPassportExpiryMonth(event.target.value)}><option value="">Month</option>{MONTH_OPTIONS.map((month) => <option key={`expiry-${month}`} value={month}>{month}</option>)}</select></label>
                        <label className="application-field"><span className="sr-only">Expiry year</span><select value={passportExpiryYear} onChange={(event) => setPassportExpiryYear(event.target.value)}><option value="">Year</option>{YEAR_OPTIONS.map((year) => <option key={`expiry-${year}`} value={year}>{year}</option>)}</select></label>
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="application-form-actions"><button type="submit" className="application-continue-button">Continue</button></div>
              </form>
            </>
          ) : applicationSubStep === 3 ? (
            <>
              <header className="application-form-card__header"><h1>Address Details</h1></header>
              <form className="application-step-form" onSubmit={(event) => { event.preventDefault(); setApplicationSubStep(4); }}>
                <label className="application-field">
                  <span>Country of residence</span>
                  <div className="application-select-wrap">
                    <span className="application-select-icon" aria-hidden="true">PK</span>
                    <select value={residenceCountry} onChange={(event) => setResidenceCountry(event.target.value)}>
                      <option>Pakistan</option><option>India</option><option>Bangladesh</option><option>United Arab Emirates</option><option>United States</option>
                    </select>
                  </div>
                </label>
                <p className="application-field-note">The country where you live permanently.</p>

                <div className="application-form-grid application-form-grid--two">
                  <label className="application-field"><span>Home address</span><input type="text" name="homeAddress" placeholder="1234 Sesame St. Apt. 3, Springtown, Islamabad" value={homeAddress} onChange={(event) => setHomeAddress(event.target.value)} /></label>
                  <label className="application-field"><span>City or town</span><input type="text" name="cityOrTown" value={cityOrTown} onChange={(event) => setCityOrTown(event.target.value)} /></label>
                </div>
                <p className="application-field-note">The address must be in the country where you live.</p>

                <div className="application-form-grid application-form-grid--two">
                  <label className="application-field"><span>State or province</span><input type="text" name="stateOrProvince" value={stateOrProvince} onChange={(event) => setStateOrProvince(event.target.value)} /></label>
                  <label className="application-field"><span>ZIP or postcode</span><input type="text" name="zipOrPostcode" value={zipOrPostcode} onChange={(event) => setZipOrPostcode(event.target.value)} /></label>
                </div>

                <div className="application-form-actions"><button type="submit" className="application-continue-button">Continue</button></div>
              </form>
            </>
          ) : applicationSubStep === 4 ? (
            <>
              <header className="application-form-card__header"><h1>Additional Information</h1></header>
              <form className="application-step-form" onSubmit={(event) => { event.preventDefault(); completeTravelerApplication(); }}>
                <fieldset className="application-fieldset">
                  <legend>Are you employed?</legend>
                  <div className="application-form-grid application-form-grid--two">
                    <button type="button" className={`application-gender-option${isEmployed === 'yes' ? ' is-selected' : ''}`} onClick={() => setIsEmployed('yes')}><span className="application-gender-option__dot" aria-hidden="true" />Yes</button>
                    <button type="button" className={`application-gender-option${isEmployed === 'no' ? ' is-selected' : ''}`} onClick={() => setIsEmployed('no')}><span className="application-gender-option__dot" aria-hidden="true" />No</button>
                  </div>
                </fieldset>

                <fieldset className="application-fieldset">
                  <legend>Have you ever been convicted of a criminal offense?</legend>
                  <div className="application-form-grid application-form-grid--two">
                    <button type="button" className={`application-gender-option${hasCriminalOffense === 'yes' ? ' is-selected' : ''}`} onClick={() => setHasCriminalOffense('yes')}><span className="application-gender-option__dot" aria-hidden="true" />Yes</button>
                    <button type="button" className={`application-gender-option${hasCriminalOffense === 'no' ? ' is-selected' : ''}`} onClick={() => setHasCriminalOffense('no')}><span className="application-gender-option__dot" aria-hidden="true" />No</button>
                  </div>
                </fieldset>

                <label className="application-field">
                  <span>Reason for trip</span>
                  <select value={reasonForTrip} onChange={(event) => setReasonForTrip(event.target.value)}>
                    <option value="">Select an option</option>
                    {REASON_FOR_TRIP_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>

                <fieldset className="application-fieldset">
                  <legend>Do you have confirmed travel plans?</legend>
                  <div className="application-form-grid application-form-grid--two">
                    <button type="button" className={`application-gender-option${hasConfirmedTravelPlans === 'yes' ? ' is-selected' : ''}`} onClick={() => setHasConfirmedTravelPlans('yes')}><span className="application-gender-option__dot" aria-hidden="true" />Yes</button>
                    <button type="button" className={`application-gender-option${hasConfirmedTravelPlans === 'no' ? ' is-selected' : ''}`} onClick={() => setHasConfirmedTravelPlans('no')}><span className="application-gender-option__dot" aria-hidden="true" />No</button>
                  </div>
                </fieldset>
                {hasConfirmedTravelPlans === 'yes' ? (
                  <div className="application-date-block">
                    <p>Expected arrival date</p>
                    <div className="application-form-grid application-form-grid--three">
                      <label className="application-field"><span className="sr-only">Arrival day</span><select value={expectedArrivalDay} onChange={(event) => setExpectedArrivalDay(event.target.value)}><option value="">Day</option>{DAY_OPTIONS.map((day) => <option key={`arrival-${day}`} value={day}>{day}</option>)}</select></label>
                      <label className="application-field"><span className="sr-only">Arrival month</span><select value={expectedArrivalMonth} onChange={(event) => setExpectedArrivalMonth(event.target.value)}><option value="">Month</option>{MONTH_OPTIONS.map((month) => <option key={`arrival-${month}`} value={month}>{month}</option>)}</select></label>
                      <label className="application-field"><span className="sr-only">Arrival year</span><select value={expectedArrivalYear} onChange={(event) => setExpectedArrivalYear(event.target.value)}><option value="">Year</option>{YEAR_OPTIONS.map((year) => <option key={`arrival-${year}`} value={year}>{year}</option>)}</select></label>
                    </div>
                  </div>
                ) : null}

                <div className="application-form-actions"><button type="submit" className="application-continue-button">Continue</button></div>
              </form>
            </>
          ) : applicationSubStep === 5 ? (
            <>
              <header className="application-form-card__header"><h1>Travelers</h1></header>
              <div className="application-step-form">
                <div className="travelers-list">
                  {travelers.map((traveler) => (
                    <div key={traveler.id} className="traveler-row">
                      <span className="traveler-row__name"><span className="traveler-row__status">&#10003;</span>{traveler.name}</span>
                      <div className="traveler-row__actions">
                        <button type="button" className="traveler-row__action" onClick={startTravelerApplication} aria-label={`Edit ${traveler.name}`}>&#9998;</button>
                        <button type="button" className="traveler-row__action" aria-label={`Remove ${traveler.name}`} onClick={() => setTravelers((current) => current.filter((item) => item.id !== traveler.id))}>&#128465;</button>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" className="traveler-add-button" onClick={startTravelerApplication}><span aria-hidden="true">+</span> Add Another Traveler</button>
                <div className="application-form-actions">
                  <button type="button" className="application-continue-button" onClick={() => setApplicationSubStep(6)}>
                    Continue
                  </button>
                </div>
              </div>
            </>
          ) : applicationSubStep === 6 ? (
            <>
              <header className="application-form-card__header"><h1>Contact Details</h1></header>
              <form className="application-step-form" onSubmit={(event) => { event.preventDefault(); setApplicationSubStep(7); }}>
                <label className="application-field">
                  <span>Email address</span>
                  <input type="email" placeholder="johnsmith@gmail.com" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} />
                </label>
                <p className="application-field-note">Your Australia Visitor Visa will be sent to this email address</p>

                <label className="application-checkbox">
                  <input type="checkbox" checked={subscribeToUpdates} onChange={(event) => setSubscribeToUpdates(event.target.checked)} />
                  <span>
                    I want to receive iVisa&apos;s updates, product launches and personalized offers. I can opt out anytime.
                    <a href="#" onClick={(event) => event.preventDefault()}> Terms and Privacy Policy </a>
                    apply.
                  </span>
                </label>

                <div className="application-form-actions"><button type="submit" className="application-continue-button">Continue</button></div>
              </form>
            </>
          ) : applicationSubStep === 7 ? (
            <>
              <header className="application-form-card__header"><h1>Choose how to pay</h1></header>
              <div className="application-step-form">
                <button type="button" className="payment-wallet-button">G Pay | + Card</button>
                <div className="payment-divider"><span>Or pay with</span></div>
                <div className="payment-card-form">
                  <input type="text" placeholder="Card Number" value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} />
                  <div className="payment-card-form__row">
                    <input type="text" placeholder="MM/YY" value={cardExpiry} onChange={(event) => setCardExpiry(event.target.value)} />
                    <input type="text" placeholder="CVV" value={cardCvv} onChange={(event) => setCardCvv(event.target.value)} />
                  </div>
                  <input type="text" placeholder="Cardholder name" value={cardholderName} onChange={(event) => setCardholderName(event.target.value)} />
                </div>
                <button type="button" className="payment-submit-button" disabled>
                  &#128274; Submit payment
                </button>
                <p className="payment-note">
                  By submitting payment I acknowledge that I have read and accept the iVisa
                  <a href="#" onClick={(event) => event.preventDefault()}> Terms of Service</a>,
                  <a href="#" onClick={(event) => event.preventDefault()}> Privacy policy</a>, and
                  <a href="#" onClick={(event) => event.preventDefault()}> Refund Policy</a>.
                </p>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
