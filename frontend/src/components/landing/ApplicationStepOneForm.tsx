import { useEffect, useState, type FormEvent } from 'react';
import { currentLocationCountryOptions, reasonForVisitingAustraliaOptions, type Option } from '../../constants/applicationFormOptions';

type YesNo = 'yes' | 'no' | '';
type ApplicationSubStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

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
const STEP_ITEMS = ['Application', 'Add Travelers', 'Contact Details', 'Confirm & Submit'];
const FORM_STORAGE_KEY = 'aus-visa-application-draft-v1';
const AUTH_SESSION_KEY = 'aus-visa-auth-session';
const DEFAULT_COUNTRY = currentLocationCountryOptions.find((option) => option.label === 'PAKISTAN')?.value ?? currentLocationCountryOptions[0]?.value ?? '';

type ApplicationSelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  error?: boolean;
  includeEmptyOption?: string;
  iconText?: string;
};

function ApplicationSelectField({ label, value, onChange, options, error = false, includeEmptyOption, iconText }: ApplicationSelectFieldProps) {
  return (
    <label className={`application-field form-field-group${error ? ' application-field--error' : ''}`}>
      <span>{label}</span>
      <div className="application-select-wrap">
        {iconText ? <span className="application-select-icon" aria-hidden="true">{iconText}</span> : null}
        <select value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={error}>
          {includeEmptyOption ? <option value="">{includeEmptyOption}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

type ApplicationDateRowProps = {
  label: string;
  valueDay: string;
  valueMonth: string;
  valueYear: string;
  onChangeDay: (value: string) => void;
  onChangeMonth: (value: string) => void;
  onChangeYear: (value: string) => void;
  dayError?: boolean;
  monthError?: boolean;
  yearError?: boolean;
  optionPrefix: string;
};

function ApplicationDateRow({
  label,
  valueDay,
  valueMonth,
  valueYear,
  onChangeDay,
  onChangeMonth,
  onChangeYear,
  dayError = false,
  monthError = false,
  yearError = false,
  optionPrefix
}: ApplicationDateRowProps) {
  return (
    <div className="application-date-block">
      <p>{label}</p>
      <div className="application-form-grid application-form-grid--three">
        <label className={`application-field form-field-group${dayError ? ' application-field--error' : ''}`}>
          <span className="sr-only">{label} day</span>
          <select value={valueDay} onChange={(event) => onChangeDay(event.target.value)} aria-invalid={dayError}>
            <option value="">Day</option>
            {DAY_OPTIONS.map((day) => <option key={`${optionPrefix}-day-${day}`} value={day}>{day}</option>)}
          </select>
        </label>
        <label className={`application-field form-field-group${monthError ? ' application-field--error' : ''}`}>
          <span className="sr-only">{label} month</span>
          <select value={valueMonth} onChange={(event) => onChangeMonth(event.target.value)} aria-invalid={monthError}>
            <option value="">Month</option>
            {MONTH_OPTIONS.map((month) => <option key={`${optionPrefix}-month-${month}`} value={month}>{month}</option>)}
          </select>
        </label>
        <label className={`application-field form-field-group${yearError ? ' application-field--error' : ''}`}>
          <span className="sr-only">{label} year</span>
          <select value={valueYear} onChange={(event) => onChangeYear(event.target.value)} aria-invalid={yearError}>
            <option value="">Year</option>
            {YEAR_OPTIONS.map((year) => <option key={`${optionPrefix}-year-${year}`} value={year}>{year}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

type ApplicationRadioPillGroupOption<T extends string> = {
  label: string;
  value: T;
};

type ApplicationRadioPillGroupProps<T extends string> = {
  legend: string;
  value: T | '';
  onChange: (value: T) => void;
  options: ApplicationRadioPillGroupOption<T>[];
  error?: boolean;
};

function ApplicationRadioPillGroup<T extends string>({ legend, value, onChange, options, error = false }: ApplicationRadioPillGroupProps<T>) {
  return (
    <fieldset className={`application-fieldset form-section-panel${error ? ' application-fieldset--error' : ''}`}>
      <legend>{legend}</legend>
      <div className="application-form-grid application-form-grid--two">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`application-gender-option${value === option.value ? ' is-selected' : ''}${error ? ' is-error' : ''}`}
            onClick={() => onChange(option.value)}
          >
            <span className="application-gender-option__dot" aria-hidden="true" />
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function VisaBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="var(--color-primary)" />
      <path d="M12 5.2 9.3 9.5l3.2-.8-1.3 3.8 3.9-5.3-3.2.6L12 5.2Z" fill="var(--color-surface)" />
      <path d="m7.4 12.2 2.9 2.6m6.3-4.3 1.6 1.3" stroke="var(--color-brand-cyan-500)" strokeWidth="1.3" strokeLinecap="round" />
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

  const [passportCountry, setPassportCountry] = useState(DEFAULT_COUNTRY);
  const [passportNationality, setPassportNationality] = useState(DEFAULT_COUNTRY);
  const [passportInfoAvailable, setPassportInfoAvailable] = useState<YesNo>('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportIssueDay, setPassportIssueDay] = useState('');
  const [passportIssueMonth, setPassportIssueMonth] = useState('');
  const [passportIssueYear, setPassportIssueYear] = useState('');
  const [passportExpiryDay, setPassportExpiryDay] = useState('');
  const [passportExpiryMonth, setPassportExpiryMonth] = useState('');
  const [passportExpiryYear, setPassportExpiryYear] = useState('');

  const [residenceCountry, setResidenceCountry] = useState(DEFAULT_COUNTRY);
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
  const [hasAuthSession, setHasAuthSession] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncAuthState = () => {
      const rawSession = window.localStorage.getItem(AUTH_SESSION_KEY);
      if (!rawSession) {
        setHasAuthSession(false);
        return;
      }

      try {
        const parsed = JSON.parse(rawSession) as { role?: string };
        setHasAuthSession(parsed.role === 'admin' || parsed.role === 'manager' || parsed.role === 'user');
      } catch {
        setHasAuthSession(false);
      }
    };

    syncAuthState();
    window.addEventListener('storage', syncAuthState);
    return () => window.removeEventListener('storage', syncAuthState);
  }, []);

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
      setPassportCountry((draft.passportCountry as string) ?? DEFAULT_COUNTRY);
      setPassportNationality((draft.passportNationality as string) ?? DEFAULT_COUNTRY);
      setPassportInfoAvailable((draft.passportInfoAvailable as YesNo) ?? '');
      setPassportNumber((draft.passportNumber as string) ?? '');
      setPassportIssueDay((draft.passportIssueDay as string) ?? '');
      setPassportIssueMonth((draft.passportIssueMonth as string) ?? '');
      setPassportIssueYear((draft.passportIssueYear as string) ?? '');
      setPassportExpiryDay((draft.passportExpiryDay as string) ?? '');
      setPassportExpiryMonth((draft.passportExpiryMonth as string) ?? '');
      setPassportExpiryYear((draft.passportExpiryYear as string) ?? '');
      setResidenceCountry((draft.residenceCountry as string) ?? DEFAULT_COUNTRY);
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
      passportNationality,
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
    passportNationality,
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
    setPassportCountry(DEFAULT_COUNTRY);
    setPassportNationality(DEFAULT_COUNTRY);
    setPassportInfoAvailable('');
    setPassportNumber('');
    setPassportIssueDay('');
    setPassportIssueMonth('');
    setPassportIssueYear('');
    setPassportExpiryDay('');
    setPassportExpiryMonth('');
    setPassportExpiryYear('');
    setResidenceCountry(DEFAULT_COUNTRY);
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

  const getCountryLabel = (countryCode: string) =>
    currentLocationCountryOptions.find((option) => option.value === countryCode)?.label ?? countryCode;

  const completeTravelerApplication = () => {
    const travelerName = `${firstName} ${lastName}`.trim() || `Traveler ${travelers.length + 1}`;
    setTravelers((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length + 1}`,
        name: travelerName,
        country: getCountryLabel(residenceCountry || passportCountry || DEFAULT_COUNTRY)
      }
    ]);
    setIsTravelersStage(true);
    setApplicationSubStep(6);
  };

  const travelerNames = travelers.map((traveler) => traveler.name).join(', ');
  const currentStage: 1 | 2 | 3 | 4 = !isTravelersStage
    ? 1
    : applicationSubStep === 7
      ? 3
      : applicationSubStep === 8
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
    if (!passportCountry) errors.push('passportCountry');
    if (!passportNationality) errors.push('passportNationality');
    applyValidation(errors);
    if (errors.length === 0) {
      setApplicationSubStep(4);
    }
  };

  const submitStepFour = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: string[] = [];
    if (!homeAddress.trim()) errors.push('homeAddress');
    if (!cityOrTown.trim()) errors.push('cityOrTown');
    if (!stateOrProvince.trim()) errors.push('stateOrProvince');
    if (!zipOrPostcode.trim()) errors.push('zipOrPostcode');
    applyValidation(errors);
    if (errors.length === 0) {
      setApplicationSubStep(5);
    }
  };

  const submitStepFive = (event: FormEvent<HTMLFormElement>) => {
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
      setApplicationSubStep(8);
    }
  };

  const goToPreviousStep = () => {
    setValidationErrors(new Set());

    if (applicationSubStep === 1) {
      if (isTravelersStage) {
        setApplicationSubStep(6);
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

    if (applicationSubStep === 7) {
      setApplicationSubStep(6);
      return;
    }

    setApplicationSubStep(7);
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
                    setApplicationSubStep(7);
                  }
                  if (stepIndex === 4 && travelers.length > 0) {
                    setIsTravelersStage(true);
                    setApplicationSubStep(8);
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
              setApplicationSubStep(6);
            }}
          >
            View all travelers
          </button>

          <div className="application-member-cta" aria-live="polite">
            {hasAuthSession ? (
              <>
                <p>Welcome back! You can continue from your dashboard.</p>
                <a className="application-member-cta__button" href="/dashboard/applications">
                  View Applications
                </a>
              </>
            ) : (
              <>
                <p>
                  Already a member?{' '}
                  <a href="/dashboard/login?next=%2Fdashboard%2Fapplications">Login here</a>
                </p>
                <a className="application-member-cta__button" href="/dashboard/login?next=%2Fdashboard%2Fapplications">
                  Login
                </a>
              </>
            )}
          </div>

          {applicationSubStep === 8 ? (
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
          {applicationSubStep === 8 ? (
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

                <ApplicationDateRow
                  label="Date of birth"
                  valueDay={birthDay}
                  valueMonth={birthMonth}
                  valueYear={birthYear}
                  onChangeDay={(value) => { setBirthDay(value); clearError('birthDay'); }}
                  onChangeMonth={(value) => { setBirthMonth(value); clearError('birthMonth'); }}
                  onChangeYear={(value) => { setBirthYear(value); clearError('birthYear'); }}
                  dayError={hasError('birthDay')}
                  monthError={hasError('birthMonth')}
                  yearError={hasError('birthYear')}
                  optionPrefix="birth"
                />

                <ApplicationRadioPillGroup
                  legend="Gender"
                  value={gender}
                  onChange={(value) => { setGender(value); clearError('gender'); }}
                  options={[
                    { label: 'Male', value: 'male' },
                    { label: 'Female', value: 'female' }
                  ]}
                  error={hasError('gender')}
                />

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
                <ApplicationRadioPillGroup
                  legend="Do you have passport information available?"
                  value={passportInfoAvailable}
                  onChange={(value) => { setPassportInfoAvailable(value); clearError('passportInfoAvailable'); }}
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' }
                  ]}
                  error={hasError('passportInfoAvailable')}
                />

                {passportInfoAvailable === 'yes' ? (
                  <>
                    <label className={`application-field${hasError('passportNumber') ? ' application-field--error' : ''}`}>
                      <span>Passport number</span>
                      <input type="text" name="passportNumber" placeholder="P9876543" value={passportNumber} onChange={(event) => { setPassportNumber(event.target.value); clearError('passportNumber'); }} aria-invalid={hasError('passportNumber')} />
                    </label>

                    <ApplicationDateRow
                      label="Passport issue date"
                      valueDay={passportIssueDay}
                      valueMonth={passportIssueMonth}
                      valueYear={passportIssueYear}
                      onChangeDay={(value) => { setPassportIssueDay(value); clearError('passportIssueDay'); }}
                      onChangeMonth={(value) => { setPassportIssueMonth(value); clearError('passportIssueMonth'); }}
                      onChangeYear={(value) => { setPassportIssueYear(value); clearError('passportIssueYear'); }}
                      dayError={hasError('passportIssueDay')}
                      monthError={hasError('passportIssueMonth')}
                      yearError={hasError('passportIssueYear')}
                      optionPrefix="issue"
                    />

                    <ApplicationDateRow
                      label="Passport expiration date"
                      valueDay={passportExpiryDay}
                      valueMonth={passportExpiryMonth}
                      valueYear={passportExpiryYear}
                      onChangeDay={(value) => { setPassportExpiryDay(value); clearError('passportExpiryDay'); }}
                      onChangeMonth={(value) => { setPassportExpiryMonth(value); clearError('passportExpiryMonth'); }}
                      onChangeYear={(value) => { setPassportExpiryYear(value); clearError('passportExpiryYear'); }}
                      dayError={hasError('passportExpiryDay')}
                      monthError={hasError('passportExpiryMonth')}
                      yearError={hasError('passportExpiryYear')}
                      optionPrefix="expiry"
                    />
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
              <header className="application-form-card__header"><h1>Step 3 · Passport Country Details</h1></header>
              <form className="application-step-form" onSubmit={submitStepThree}>
                <ApplicationSelectField
                  label="Country of passport"
                  value={passportCountry}
                  onChange={(value) => { setPassportCountry(value); clearError('passportCountry'); }}
                  options={currentLocationCountryOptions}
                  iconText={passportCountry.slice(0, 2)}
                  error={hasError('passportCountry')}
                />
                <ApplicationSelectField
                  label="Nationality of passport holder"
                  value={passportNationality}
                  onChange={(value) => { setPassportNationality(value); clearError('passportNationality'); }}
                  options={currentLocationCountryOptions}
                  iconText={passportNationality.slice(0, 2)}
                  error={hasError('passportNationality')}
                />
                <div className="application-form-actions application-form-actions--split">
                  <button type="button" className="application-back-button" onClick={goToPreviousStep}>Back</button>
                  <button type="submit" className="application-continue-button">Continue</button>
                </div>
              </form>
            </>
          ) : applicationSubStep === 4 ? (
            <>
              <header className="application-form-card__header"><h1>Address Details</h1></header>
              <form className="application-step-form" onSubmit={submitStepFour}>
                <ApplicationSelectField
                  label="Country of residence"
                  value={residenceCountry}
                  onChange={setResidenceCountry}
                  options={currentLocationCountryOptions}
                  iconText={residenceCountry.slice(0, 2)}
                />
                <p className="application-field-note">The country where you live permanently.</p>

                <label className={`application-field${hasError('homeAddress') ? ' application-field--error' : ''}`}><span>Home address</span><input type="text" name="homeAddress" placeholder="1234 Sesame St. Apt. 3, Springtown, Islamabad" value={homeAddress} onChange={(event) => { setHomeAddress(event.target.value); clearError('homeAddress'); }} aria-invalid={hasError('homeAddress')} /></label>
                <p className="application-field-note">The address must be in the country where you live.</p>

                <div className="application-form-grid application-form-grid--compact">
                  <label className={`application-field${hasError('cityOrTown') ? ' application-field--error' : ''}`}><span>City or town</span><input type="text" name="cityOrTown" value={cityOrTown} onChange={(event) => { setCityOrTown(event.target.value); clearError('cityOrTown'); }} aria-invalid={hasError('cityOrTown')} /></label>
                  <label className={`application-field${hasError('zipOrPostcode') ? ' application-field--error' : ''}`}><span>ZIP or postcode</span><input type="text" name="zipOrPostcode" value={zipOrPostcode} onChange={(event) => { setZipOrPostcode(event.target.value); clearError('zipOrPostcode'); }} aria-invalid={hasError('zipOrPostcode')} /></label>
                </div>
                <label className={`application-field${hasError('stateOrProvince') ? ' application-field--error' : ''}`}><span>State or province</span><input type="text" name="stateOrProvince" value={stateOrProvince} onChange={(event) => { setStateOrProvince(event.target.value); clearError('stateOrProvince'); }} aria-invalid={hasError('stateOrProvince')} /></label>

                <div className="application-form-actions application-form-actions--split">
                  <button type="button" className="application-back-button" onClick={goToPreviousStep}>Back</button>
                  <button type="submit" className="application-continue-button">Continue</button>
                </div>
              </form>
            </>
          ) : applicationSubStep === 5 ? (
            <>
              <header className="application-form-card__header"><h1>Additional Information</h1></header>
              <form className="application-step-form" onSubmit={submitStepFive}>
                <ApplicationRadioPillGroup
                  legend="Are you employed?"
                  value={isEmployed}
                  onChange={(value) => { setIsEmployed(value); clearError('isEmployed'); }}
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' }
                  ]}
                  error={hasError('isEmployed')}
                />

                <ApplicationRadioPillGroup
                  legend="Have you ever been convicted of a criminal offense?"
                  value={hasCriminalOffense}
                  onChange={(value) => { setHasCriminalOffense(value); clearError('hasCriminalOffense'); }}
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' }
                  ]}
                  error={hasError('hasCriminalOffense')}
                />

                <ApplicationSelectField
                  label="Reason for trip"
                  value={reasonForTrip}
                  onChange={(value) => { setReasonForTrip(value); clearError('reasonForTrip'); }}
                  options={reasonForVisitingAustraliaOptions}
                  includeEmptyOption="Select an option"
                  error={hasError('reasonForTrip')}
                />

                <ApplicationRadioPillGroup
                  legend="Do you have confirmed travel plans?"
                  value={hasConfirmedTravelPlans}
                  onChange={(value) => { setHasConfirmedTravelPlans(value); clearError('hasConfirmedTravelPlans'); }}
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' }
                  ]}
                  error={hasError('hasConfirmedTravelPlans')}
                />
                {hasConfirmedTravelPlans === 'yes' ? (
                  <ApplicationDateRow
                    label="Expected arrival date"
                    valueDay={expectedArrivalDay}
                    valueMonth={expectedArrivalMonth}
                    valueYear={expectedArrivalYear}
                    onChangeDay={(value) => { setExpectedArrivalDay(value); clearError('expectedArrivalDay'); }}
                    onChangeMonth={(value) => { setExpectedArrivalMonth(value); clearError('expectedArrivalMonth'); }}
                    onChangeYear={(value) => { setExpectedArrivalYear(value); clearError('expectedArrivalYear'); }}
                    dayError={hasError('expectedArrivalDay')}
                    monthError={hasError('expectedArrivalMonth')}
                    yearError={hasError('expectedArrivalYear')}
                    optionPrefix="arrival"
                  />
                ) : null}

                <div className="application-form-actions application-form-actions--split">
                  <button type="button" className="application-back-button" onClick={goToPreviousStep}>Back</button>
                  <button type="submit" className="application-continue-button">Continue</button>
                </div>
              </form>
            </>
          ) : applicationSubStep === 6 ? (
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
                  <button type="button" className="application-continue-button" onClick={() => setApplicationSubStep(7)}>
                    Continue
                  </button>
                </div>
              </div>
            </>
          ) : applicationSubStep === 7 ? (
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
          ) : applicationSubStep === 8 ? (
            <>
              <header className="application-form-card__header"><h1>Choose how to pay</h1></header>
              <div className="application-step-form">
                <button type="button" className="payment-wallet-button">G Pay | + Card</button>
                <div className="payment-divider"><span>Or pay with</span></div>
                <div className="payment-card-form">
                  <input type="text" placeholder="Card Number" value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} />
                  <div className="payment-card-form__row application-form-grid--compact">
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
