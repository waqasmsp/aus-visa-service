import { useEffect, useState, type FormEvent } from 'react';

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
const FORM_STORAGE_KEY = 'aus-visa-application-draft-v1';

function VisaBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="#1D4ED8" />
      <path d="M12 5.2 9.3 9.5l3.2-.8-1.3 3.8 3.9-5.3-3.2.6L12 5.2Z" fill="#fff" />
      <path d="m7.4 12.2 2.9 2.6m6.3-4.3 1.6 1.3" stroke="#67E8F9" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ApplicationStepOneForm() {
  const [applicationSubStep, setApplicationSubStep] = useState<ApplicationSubStep>(1);
  const [isTravelersStage, setIsTravelersStage] = useState(false);
  const [travelers, setTravelers] = useState<TravelerEntry[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
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
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const rawDraft = window.localStorage.getItem(FORM_STORAGE_KEY);
      if (!rawDraft) {
        setIsDraftHydrated(true);
        return;
      }

      const draft = JSON.parse(rawDraft) as Record<string, unknown>;
      setApplicationSubStep((draft.applicationSubStep as ApplicationSubStep) ?? 1);
      setIsTravelersStage((draft.isTravelersStage as boolean) ?? false);
      setTravelers((draft.travelers as TravelerEntry[]) ?? []);
      setFirstName((draft.firstName as string) ?? '');
      setLastName((draft.lastName as string) ?? '');
      setBirthDay((draft.birthDay as string) ?? '');
      setBirthMonth((draft.birthMonth as string) ?? '');
      setBirthYear((draft.birthYear as string) ?? '');
      setGender((draft.gender as 'male' | 'female' | '') ?? '');
      setPassportCountry((draft.passportCountry as string) ?? 'Pakistan');
      setPassportInfoAvailable((draft.passportInfoAvailable as YesNo) ?? '');
      setPassportNumber((draft.passportNumber as string) ?? '');
      setPassportIssueDay((draft.passportIssueDay as string) ?? '');
      setPassportIssueMonth((draft.passportIssueMonth as string) ?? '');
      setPassportIssueYear((draft.passportIssueYear as string) ?? '');
      setPassportExpiryDay((draft.passportExpiryDay as string) ?? '');
      setPassportExpiryMonth((draft.passportExpiryMonth as string) ?? '');
      setPassportExpiryYear((draft.passportExpiryYear as string) ?? '');
      setResidenceCountry((draft.residenceCountry as string) ?? 'Pakistan');
      setHomeAddress((draft.homeAddress as string) ?? '');
      setCityOrTown((draft.cityOrTown as string) ?? '');
      setStateOrProvince((draft.stateOrProvince as string) ?? '');
      setZipOrPostcode((draft.zipOrPostcode as string) ?? '');
      setIsEmployed((draft.isEmployed as YesNo) ?? '');
      setHasCriminalOffense((draft.hasCriminalOffense as YesNo) ?? '');
      setReasonForTrip((draft.reasonForTrip as string) ?? '');
      setHasConfirmedTravelPlans((draft.hasConfirmedTravelPlans as YesNo) ?? '');
      setExpectedArrivalDay((draft.expectedArrivalDay as string) ?? '');
      setExpectedArrivalMonth((draft.expectedArrivalMonth as string) ?? '');
      setExpectedArrivalYear((draft.expectedArrivalYear as string) ?? '');
      setEmailAddress((draft.emailAddress as string) ?? '');
      setSubscribeToUpdates((draft.subscribeToUpdates as boolean) ?? false);
    } catch {
      // Ignore malformed browser draft data.
    } finally {
      setIsDraftHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !isDraftHydrated) {
      return;
    }

    const draft = {
      applicationSubStep,
      isTravelersStage,
      travelers,
      firstName,
      lastName,
      birthDay,
      birthMonth,
      birthYear,
      gender,
      passportCountry,
      passportInfoAvailable,
      passportNumber,
      passportIssueDay,
      passportIssueMonth,
      passportIssueYear,
      passportExpiryDay,
      passportExpiryMonth,
      passportExpiryYear,
      residenceCountry,
      homeAddress,
      cityOrTown,
      stateOrProvince,
      zipOrPostcode,
      isEmployed,
      hasCriminalOffense,
      reasonForTrip,
      hasConfirmedTravelPlans,
      expectedArrivalDay,
      expectedArrivalMonth,
      expectedArrivalYear,
      emailAddress,
      subscribeToUpdates
    };

    window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(draft));
  }, [
    isDraftHydrated,
    applicationSubStep,
    isTravelersStage,
    travelers,
    firstName,
    lastName,
    birthDay,
    birthMonth,
    birthYear,
    gender,
    passportCountry,
    passportInfoAvailable,
    passportNumber,
    passportIssueDay,
    passportIssueMonth,
    passportIssueYear,
    passportExpiryDay,
    passportExpiryMonth,
    passportExpiryYear,
    residenceCountry,
    homeAddress,
    cityOrTown,
    stateOrProvince,
    zipOrPostcode,
    isEmployed,
    hasCriminalOffense,
    reasonForTrip,
    hasConfirmedTravelPlans,
    expectedArrivalDay,
    expectedArrivalMonth,
    expectedArrivalYear,
    emailAddress,
    subscribeToUpdates
  ]);

  const resetTravelerDraft = () => {
    setApplicationSubStep(1);
    setFirstName('');
    setLastName('');
    setBirthDay('');
    setBirthMonth('');
    setBirthYear('');
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
    setValidationErrors(new Set());
  };

  const hasError = (field: string) => validationErrors.has(field);

  const clearError = (field: string) => {
    setValidationErrors((current) => {
      if (!current.has(field)) {
        return current;
      }

      const next = new Set(current);
      next.delete(field);
      return next;
    });
  };

  const applyValidation = (fields: string[]) => {
    setValidationErrors(new Set(fields));
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
  const selectedPricing = pricingByCountry['United States'];
  const applicantCount = Math.max(1, travelers.length);
  const totalPerApplicant = selectedPricing.governmentFees + selectedPricing.standard;
  const totalAllApplicants = totalPerApplicant * applicantCount;
  const formatMoney = (amount: number) => `${selectedPricing.currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const submitStepOne = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: string[] = [];
    if (!firstName.trim()) errors.push('firstName');
    if (!lastName.trim()) errors.push('lastName');
    if (!birthDay) errors.push('birthDay');
    if (!birthMonth) errors.push('birthMonth');
    if (!birthYear) errors.push('birthYear');
    if (!gender) errors.push('gender');
    applyValidation(errors);
    if (errors.length === 0) {
      setApplicationSubStep(2);
    }
  };

  const submitStepTwo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: string[] = [];
    if (!passportInfoAvailable) errors.push('passportInfoAvailable');
    if (passportInfoAvailable === 'yes') {
      if (!passportNumber.trim()) errors.push('passportNumber');
      if (!passportIssueDay) errors.push('passportIssueDay');
      if (!passportIssueMonth) errors.push('passportIssueMonth');
      if (!passportIssueYear) errors.push('passportIssueYear');
      if (!passportExpiryDay) errors.push('passportExpiryDay');
      if (!passportExpiryMonth) errors.push('passportExpiryMonth');
      if (!passportExpiryYear) errors.push('passportExpiryYear');
    }
    applyValidation(errors);
    if (errors.length === 0) {
      setApplicationSubStep(3);
    }
  };

  const submitStepThree = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: string[] = [];
    if (!homeAddress.trim()) errors.push('homeAddress');
    if (!cityOrTown.trim()) errors.push('cityOrTown');
    if (!stateOrProvince.trim()) errors.push('stateOrProvince');
    if (!zipOrPostcode.trim()) errors.push('zipOrPostcode');
    applyValidation(errors);
    if (errors.length === 0) {
      setApplicationSubStep(4);
    }
  };

  const submitStepFour = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: string[] = [];
    if (!isEmployed) errors.push('isEmployed');
    if (!hasCriminalOffense) errors.push('hasCriminalOffense');
    if (!reasonForTrip) errors.push('reasonForTrip');
    if (!hasConfirmedTravelPlans) errors.push('hasConfirmedTravelPlans');
    if (hasConfirmedTravelPlans === 'yes') {
      if (!expectedArrivalDay) errors.push('expectedArrivalDay');
      if (!expectedArrivalMonth) errors.push('expectedArrivalMonth');
      if (!expectedArrivalYear) errors.push('expectedArrivalYear');
    }
    applyValidation(errors);
    if (errors.length === 0) {
      completeTravelerApplication();
    }
  };

  const submitContactStep = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailAddress.trim() || !emailRegex.test(emailAddress)) {
      errors.push('emailAddress');
    }
    applyValidation(errors);
    if (errors.length === 0) {
      setApplicationSubStep(7);
    }
  };

  const goToPreviousStep = () => {
    setValidationErrors(new Set());

    if (applicationSubStep === 1) {
      if (isTravelersStage) {
        setApplicationSubStep(5);
        return;
      }

      if (typeof window !== 'undefined') {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.assign('/');
        }
      }
      return;
    }

    if (applicationSubStep === 2) {
      setApplicationSubStep(1);
      return;
    }

    if (applicationSubStep === 3) {
      setApplicationSubStep(2);
      return;
    }

    if (applicationSubStep === 4) {
      setApplicationSubStep(3);
      return;
    }

    if (applicationSubStep === 5) {
      setApplicationSubStep(4);
      return;
    }

    if (applicationSubStep === 6) {
      setApplicationSubStep(5);
      return;
    }

    setApplicationSubStep(6);
  };

  return (
    <div className="application-form-screen" role="region" aria-label="Visa application form">
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
          {applicationSubStep === 7 ? (
            <div className="application-payment-notice" role="status" aria-live="polite">
              <p><span>Government fees</span><strong>{formatMoney(selectedPricing.governmentFees)}</strong></p>
              <p><span>Standard processing</span><strong>{formatMoney(selectedPricing.standard)}</strong></p>
              <p><span>Total ({applicantCount} applicant{applicantCount > 1 ? 's' : ''})</span><strong>{formatMoney(totalAllApplicants)}</strong></p>
            </div>
          ) : null}

          {applicationSubStep === 1 ? (
            <>
              <header className="application-form-card__header">
                <h1>Personal Details</h1>
                <p>Enter the details as they appear on your passport</p>
              </header>

              <form className="application-step-form" onSubmit={submitStepOne}>
                <div className="application-form-grid application-form-grid--two">
                  <label className={`application-field${hasError('firstName') ? ' application-field--error' : ''}`}>
                    <span>First and middle name</span>
                    <input type="text" name="firstName" placeholder="John William" autoComplete="given-name" value={firstName} onChange={(event) => { setFirstName(event.target.value); clearError('firstName'); }} aria-invalid={hasError('firstName')} />
                  </label>
                  <label className={`application-field${hasError('lastName') ? ' application-field--error' : ''}`}>
                    <span>Last name</span>
                    <input type="text" name="lastName" placeholder="Smith" autoComplete="family-name" value={lastName} onChange={(event) => { setLastName(event.target.value); clearError('lastName'); }} aria-invalid={hasError('lastName')} />
                  </label>
                </div>

                <fieldset className={`application-fieldset${hasError('birthDay') || hasError('birthMonth') || hasError('birthYear') ? ' application-fieldset--error' : ''}`}>
                  <legend>Date of birth</legend>
                  <div className="application-form-grid application-form-grid--three">
                    <label className={`application-field${hasError('birthDay') ? ' application-field--error' : ''}`}><span className="sr-only">Day</span><select value={birthDay} onChange={(event) => { setBirthDay(event.target.value); clearError('birthDay'); }} aria-invalid={hasError('birthDay')}><option value="">Day</option>{DAY_OPTIONS.map((day) => <option key={day} value={day}>{day}</option>)}</select></label>
                    <label className={`application-field${hasError('birthMonth') ? ' application-field--error' : ''}`}><span className="sr-only">Month</span><select value={birthMonth} onChange={(event) => { setBirthMonth(event.target.value); clearError('birthMonth'); }} aria-invalid={hasError('birthMonth')}><option value="">Month</option>{MONTH_OPTIONS.map((month) => <option key={month} value={month}>{month}</option>)}</select></label>
                    <label className={`application-field${hasError('birthYear') ? ' application-field--error' : ''}`}><span className="sr-only">Year</span><select value={birthYear} onChange={(event) => { setBirthYear(event.target.value); clearError('birthYear'); }} aria-invalid={hasError('birthYear')}><option value="">Year</option>{YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
                  </div>
                </fieldset>

                <fieldset className={`application-fieldset${hasError('gender') ? ' application-fieldset--error' : ''}`}>
                  <legend>Gender</legend>
                  <div className="application-form-grid application-form-grid--two">
                    <button type="button" className={`application-gender-option${gender === 'male' ? ' is-selected' : ''}${hasError('gender') ? ' is-error' : ''}`} onClick={() => { setGender('male'); clearError('gender'); }}><span className="application-gender-option__dot" aria-hidden="true" />Male</button>
                    <button type="button" className={`application-gender-option${gender === 'female' ? ' is-selected' : ''}${hasError('gender') ? ' is-error' : ''}`} onClick={() => { setGender('female'); clearError('gender'); }}><span className="application-gender-option__dot" aria-hidden="true" />Female</button>
                  </div>
                </fieldset>

                <div className="application-form-actions application-form-actions--split">
                  <button type="button" className="application-back-button" onClick={goToPreviousStep}>Back</button>
                  <button type="submit" className="application-continue-button">Continue</button>
                </div>
              </form>
            </>
          ) : applicationSubStep === 2 ? (
            <>
              <header className="application-form-card__header"><h1>Passport Details</h1></header>

              <form className="application-step-form" onSubmit={submitStepTwo}>
                <label className="application-field">
                  <span>Passport</span>
                  <div className="application-select-wrap">
                    <span className="application-select-icon" aria-hidden="true">PK</span>
                    <select value={passportCountry} onChange={(event) => setPassportCountry(event.target.value)}>
                      <option>Pakistan</option><option>India</option><option>Bangladesh</option><option>United Arab Emirates</option><option>United States</option>
                    </select>
                  </div>
                </label>

                <fieldset className={`application-fieldset${hasError('passportInfoAvailable') ? ' application-fieldset--error' : ''}`}>
                  <legend>Do you have passport information available?</legend>
                  <div className="application-form-grid application-form-grid--two">
                    <button type="button" className={`application-gender-option${passportInfoAvailable === 'yes' ? ' is-selected' : ''}${hasError('passportInfoAvailable') ? ' is-error' : ''}`} onClick={() => { setPassportInfoAvailable('yes'); clearError('passportInfoAvailable'); }}><span className="application-gender-option__dot" aria-hidden="true" />Yes</button>
                    <button type="button" className={`application-gender-option${passportInfoAvailable === 'no' ? ' is-selected' : ''}${hasError('passportInfoAvailable') ? ' is-error' : ''}`} onClick={() => { setPassportInfoAvailable('no'); clearError('passportInfoAvailable'); }}><span className="application-gender-option__dot" aria-hidden="true" />No</button>
                  </div>
                </fieldset>

                {passportInfoAvailable === 'yes' ? (
                  <>
                    <label className={`application-field${hasError('passportNumber') ? ' application-field--error' : ''}`}>
                      <span>Passport number</span>
                      <input type="text" name="passportNumber" placeholder="P9876543" value={passportNumber} onChange={(event) => { setPassportNumber(event.target.value); clearError('passportNumber'); }} aria-invalid={hasError('passportNumber')} />
                    </label>

                    <div className="application-date-block">
                      <p>Passport issue date</p>
                      <div className="application-form-grid application-form-grid--three">
                        <label className={`application-field${hasError('passportIssueDay') ? ' application-field--error' : ''}`}><span className="sr-only">Issue day</span><select value={passportIssueDay} onChange={(event) => { setPassportIssueDay(event.target.value); clearError('passportIssueDay'); }} aria-invalid={hasError('passportIssueDay')}><option value="">Day</option>{DAY_OPTIONS.map((day) => <option key={`issue-${day}`} value={day}>{day}</option>)}</select></label>
                        <label className={`application-field${hasError('passportIssueMonth') ? ' application-field--error' : ''}`}><span className="sr-only">Issue month</span><select value={passportIssueMonth} onChange={(event) => { setPassportIssueMonth(event.target.value); clearError('passportIssueMonth'); }} aria-invalid={hasError('passportIssueMonth')}><option value="">Month</option>{MONTH_OPTIONS.map((month) => <option key={`issue-${month}`} value={month}>{month}</option>)}</select></label>
                        <label className={`application-field${hasError('passportIssueYear') ? ' application-field--error' : ''}`}><span className="sr-only">Issue year</span><select value={passportIssueYear} onChange={(event) => { setPassportIssueYear(event.target.value); clearError('passportIssueYear'); }} aria-invalid={hasError('passportIssueYear')}><option value="">Year</option>{YEAR_OPTIONS.map((year) => <option key={`issue-${year}`} value={year}>{year}</option>)}</select></label>
                      </div>
                    </div>

                    <div className="application-date-block">
                      <p>Passport expiration date</p>
                      <div className="application-form-grid application-form-grid--three">
                        <label className={`application-field${hasError('passportExpiryDay') ? ' application-field--error' : ''}`}><span className="sr-only">Expiry day</span><select value={passportExpiryDay} onChange={(event) => { setPassportExpiryDay(event.target.value); clearError('passportExpiryDay'); }} aria-invalid={hasError('passportExpiryDay')}><option value="">Day</option>{DAY_OPTIONS.map((day) => <option key={`expiry-${day}`} value={day}>{day}</option>)}</select></label>
                        <label className={`application-field${hasError('passportExpiryMonth') ? ' application-field--error' : ''}`}><span className="sr-only">Expiry month</span><select value={passportExpiryMonth} onChange={(event) => { setPassportExpiryMonth(event.target.value); clearError('passportExpiryMonth'); }} aria-invalid={hasError('passportExpiryMonth')}><option value="">Month</option>{MONTH_OPTIONS.map((month) => <option key={`expiry-${month}`} value={month}>{month}</option>)}</select></label>
                        <label className={`application-field${hasError('passportExpiryYear') ? ' application-field--error' : ''}`}><span className="sr-only">Expiry year</span><select value={passportExpiryYear} onChange={(event) => { setPassportExpiryYear(event.target.value); clearError('passportExpiryYear'); }} aria-invalid={hasError('passportExpiryYear')}><option value="">Year</option>{YEAR_OPTIONS.map((year) => <option key={`expiry-${year}`} value={year}>{year}</option>)}</select></label>
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="application-form-actions application-form-actions--split">
                  <button type="button" className="application-back-button" onClick={goToPreviousStep}>Back</button>
                  <button type="submit" className="application-continue-button">Continue</button>
                </div>
              </form>
            </>
          ) : applicationSubStep === 3 ? (
            <>
              <header className="application-form-card__header"><h1>Address Details</h1></header>
              <form className="application-step-form" onSubmit={submitStepThree}>
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
                  <label className={`application-field${hasError('homeAddress') ? ' application-field--error' : ''}`}><span>Home address</span><input type="text" name="homeAddress" placeholder="1234 Sesame St. Apt. 3, Springtown, Islamabad" value={homeAddress} onChange={(event) => { setHomeAddress(event.target.value); clearError('homeAddress'); }} aria-invalid={hasError('homeAddress')} /></label>
                  <label className={`application-field${hasError('cityOrTown') ? ' application-field--error' : ''}`}><span>City or town</span><input type="text" name="cityOrTown" value={cityOrTown} onChange={(event) => { setCityOrTown(event.target.value); clearError('cityOrTown'); }} aria-invalid={hasError('cityOrTown')} /></label>
                </div>
                <p className="application-field-note">The address must be in the country where you live.</p>

                <div className="application-form-grid application-form-grid--two">
                  <label className={`application-field${hasError('stateOrProvince') ? ' application-field--error' : ''}`}><span>State or province</span><input type="text" name="stateOrProvince" value={stateOrProvince} onChange={(event) => { setStateOrProvince(event.target.value); clearError('stateOrProvince'); }} aria-invalid={hasError('stateOrProvince')} /></label>
                  <label className={`application-field${hasError('zipOrPostcode') ? ' application-field--error' : ''}`}><span>ZIP or postcode</span><input type="text" name="zipOrPostcode" value={zipOrPostcode} onChange={(event) => { setZipOrPostcode(event.target.value); clearError('zipOrPostcode'); }} aria-invalid={hasError('zipOrPostcode')} /></label>
                </div>

                <div className="application-form-actions application-form-actions--split">
                  <button type="button" className="application-back-button" onClick={goToPreviousStep}>Back</button>
                  <button type="submit" className="application-continue-button">Continue</button>
                </div>
              </form>
            </>
          ) : applicationSubStep === 4 ? (
            <>
              <header className="application-form-card__header"><h1>Additional Information</h1></header>
              <form className="application-step-form" onSubmit={submitStepFour}>
                <fieldset className={`application-fieldset${hasError('isEmployed') ? ' application-fieldset--error' : ''}`}>
                  <legend>Are you employed?</legend>
                  <div className="application-form-grid application-form-grid--two">
                    <button type="button" className={`application-gender-option${isEmployed === 'yes' ? ' is-selected' : ''}${hasError('isEmployed') ? ' is-error' : ''}`} onClick={() => { setIsEmployed('yes'); clearError('isEmployed'); }}><span className="application-gender-option__dot" aria-hidden="true" />Yes</button>
                    <button type="button" className={`application-gender-option${isEmployed === 'no' ? ' is-selected' : ''}${hasError('isEmployed') ? ' is-error' : ''}`} onClick={() => { setIsEmployed('no'); clearError('isEmployed'); }}><span className="application-gender-option__dot" aria-hidden="true" />No</button>
                  </div>
                </fieldset>

                <fieldset className={`application-fieldset${hasError('hasCriminalOffense') ? ' application-fieldset--error' : ''}`}>
                  <legend>Have you ever been convicted of a criminal offense?</legend>
                  <div className="application-form-grid application-form-grid--two">
                    <button type="button" className={`application-gender-option${hasCriminalOffense === 'yes' ? ' is-selected' : ''}${hasError('hasCriminalOffense') ? ' is-error' : ''}`} onClick={() => { setHasCriminalOffense('yes'); clearError('hasCriminalOffense'); }}><span className="application-gender-option__dot" aria-hidden="true" />Yes</button>
                    <button type="button" className={`application-gender-option${hasCriminalOffense === 'no' ? ' is-selected' : ''}${hasError('hasCriminalOffense') ? ' is-error' : ''}`} onClick={() => { setHasCriminalOffense('no'); clearError('hasCriminalOffense'); }}><span className="application-gender-option__dot" aria-hidden="true" />No</button>
                  </div>
                </fieldset>

                <label className={`application-field${hasError('reasonForTrip') ? ' application-field--error' : ''}`}>
                  <span>Reason for trip</span>
                  <select value={reasonForTrip} onChange={(event) => { setReasonForTrip(event.target.value); clearError('reasonForTrip'); }} aria-invalid={hasError('reasonForTrip')}>
                    <option value="">Select an option</option>
                    {REASON_FOR_TRIP_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>

                <fieldset className={`application-fieldset${hasError('hasConfirmedTravelPlans') ? ' application-fieldset--error' : ''}`}>
                  <legend>Do you have confirmed travel plans?</legend>
                  <div className="application-form-grid application-form-grid--two">
                    <button type="button" className={`application-gender-option${hasConfirmedTravelPlans === 'yes' ? ' is-selected' : ''}${hasError('hasConfirmedTravelPlans') ? ' is-error' : ''}`} onClick={() => { setHasConfirmedTravelPlans('yes'); clearError('hasConfirmedTravelPlans'); }}><span className="application-gender-option__dot" aria-hidden="true" />Yes</button>
                    <button type="button" className={`application-gender-option${hasConfirmedTravelPlans === 'no' ? ' is-selected' : ''}${hasError('hasConfirmedTravelPlans') ? ' is-error' : ''}`} onClick={() => { setHasConfirmedTravelPlans('no'); clearError('hasConfirmedTravelPlans'); }}><span className="application-gender-option__dot" aria-hidden="true" />No</button>
                  </div>
                </fieldset>
                {hasConfirmedTravelPlans === 'yes' ? (
                  <div className="application-date-block">
                    <p>Expected arrival date</p>
                    <div className="application-form-grid application-form-grid--three">
                      <label className={`application-field${hasError('expectedArrivalDay') ? ' application-field--error' : ''}`}><span className="sr-only">Arrival day</span><select value={expectedArrivalDay} onChange={(event) => { setExpectedArrivalDay(event.target.value); clearError('expectedArrivalDay'); }} aria-invalid={hasError('expectedArrivalDay')}><option value="">Day</option>{DAY_OPTIONS.map((day) => <option key={`arrival-${day}`} value={day}>{day}</option>)}</select></label>
                      <label className={`application-field${hasError('expectedArrivalMonth') ? ' application-field--error' : ''}`}><span className="sr-only">Arrival month</span><select value={expectedArrivalMonth} onChange={(event) => { setExpectedArrivalMonth(event.target.value); clearError('expectedArrivalMonth'); }} aria-invalid={hasError('expectedArrivalMonth')}><option value="">Month</option>{MONTH_OPTIONS.map((month) => <option key={`arrival-${month}`} value={month}>{month}</option>)}</select></label>
                      <label className={`application-field${hasError('expectedArrivalYear') ? ' application-field--error' : ''}`}><span className="sr-only">Arrival year</span><select value={expectedArrivalYear} onChange={(event) => { setExpectedArrivalYear(event.target.value); clearError('expectedArrivalYear'); }} aria-invalid={hasError('expectedArrivalYear')}><option value="">Year</option>{YEAR_OPTIONS.map((year) => <option key={`arrival-${year}`} value={year}>{year}</option>)}</select></label>
                    </div>
                  </div>
                ) : null}

                <div className="application-form-actions application-form-actions--split">
                  <button type="button" className="application-back-button" onClick={goToPreviousStep}>Back</button>
                  <button type="submit" className="application-continue-button">Continue</button>
                </div>
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
                <div className="application-form-actions application-form-actions--split">
                  <button type="button" className="application-back-button" onClick={goToPreviousStep}>Back</button>
                  <button type="button" className="application-continue-button" onClick={() => setApplicationSubStep(6)}>
                    Continue
                  </button>
                </div>
              </div>
            </>
          ) : applicationSubStep === 6 ? (
            <>
              <header className="application-form-card__header"><h1>Contact Details</h1></header>
              <form className="application-step-form" onSubmit={submitContactStep}>
                <label className={`application-field${hasError('emailAddress') ? ' application-field--error' : ''}`}>
                  <span>Email address</span>
                  <input type="email" placeholder="johnsmith@gmail.com" value={emailAddress} onChange={(event) => { setEmailAddress(event.target.value); clearError('emailAddress'); }} aria-invalid={hasError('emailAddress')} />
                </label>
                <p className="application-field-note">Your Australia Visitor Visa will be sent to this email address</p>

                <label className="application-checkbox">
                  <input type="checkbox" checked={subscribeToUpdates} onChange={(event) => setSubscribeToUpdates(event.target.checked)} />
                  <span>
                    I want to receive Global Visas updates, product launches and personalized offers. I can opt out anytime.
                    <a href="/privacy-policy"> Terms and Privacy Policy </a>
                    apply.
                  </span>
                </label>

                <div className="application-form-actions application-form-actions--split">
                  <button type="button" className="application-back-button" onClick={goToPreviousStep}>Back</button>
                  <button type="submit" className="application-continue-button">Continue</button>
                </div>
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
                  By submitting payment I acknowledge that I have read and accept the Global Visas
                  <a href="#" onClick={(event) => event.preventDefault()}> Terms of Service</a>,
                  <a href="/privacy-policy"> Privacy policy</a>, and
                  <a href="#" onClick={(event) => event.preventDefault()}> Refund Policy</a>.
                </p>
                <div className="application-form-actions">
                  <button type="button" className="application-back-button" onClick={goToPreviousStep}>Back</button>
                </div>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
