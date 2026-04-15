import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { CountryOption, VisaTypeOption } from '../../constants/landingContent';
import { PrimaryButton } from '../primitives/PrimaryButton';
import { SectionContainer } from '../primitives/SectionContainer';
import { HeroVisual } from './HeroVisual';

type HeroVisaSearchProps = {
  title: string;
  subtitle: string;
  originCountryLabel: string;
  destinationCountryLabel: string;
  visaTypeLabel: string;
  originCountryOptions: CountryOption[];
  destinationCountryOptions: CountryOption[];
  visaTypeOptions: VisaTypeOption[];
  primaryCta: string;
  illustrationAlt?: string;
  onStartApplication?: () => void;
};

type SelectOption = {
  code: string;
  name: string;
};

type SelectComboboxProps<T extends SelectOption> = {
  label: string;
  options: T[];
  placeholder: string;
  value?: T | null;
  onChange?: (option: T) => void;
  disabled?: boolean;
  renderLeadingVisual?: (option: T | null) => ReactNode;
};

const HERO_TITLE_ROTATION_MS = 2200;
const HERO_TRUST_BADGES = ['99% approval-guided applications', '24/7 visa expert support', '50,000+ happy travelers'];

type ParsedHeroTitle = {
  before: string;
  variants: string[];
  after: string;
};

function getFlagAssetUrl(flagCode?: string) {
  if (!flagCode) {
    return undefined;
  }

  return `https://flagcdn.com/w40/${flagCode.toLowerCase()}.png`;
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 12h18M12 3a15 15 0 0 0 0 18M12 3a15 15 0 0 1 0 18" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function VisaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="6" width="16" height="12" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10h8M8 14h5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CountryFlag({
  country,
  brokenFlags,
  onFlagError
}: {
  country: CountryOption;
  brokenFlags: Set<string>;
  onFlagError: (flagCode: string) => void;
}) {
  const flagCode = country.flagCode?.toLowerCase();
  const isFlagUnavailable = !flagCode || brokenFlags.has(flagCode);

  if (isFlagUnavailable) {
    return (
      <span className="hero-country-flag" aria-hidden="true">
        <GlobeIcon />
      </span>
    );
  }

  return (
    <span className="hero-country-flag" aria-hidden="true">
      <img src={getFlagAssetUrl(flagCode)} alt="" loading="lazy" onError={() => onFlagError(flagCode)} />
    </span>
  );
}

function SelectCombobox<T extends SelectOption>({
  label,
  options,
  placeholder,
  value,
  onChange,
  disabled = false,
  renderLeadingVisual
}: SelectComboboxProps<T>) {
  const [internalSelected, setInternalSelected] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [brokenFlags, setBrokenFlags] = useState<Set<string>>(new Set());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const labelId = useId();
  const listboxId = useId();
  const isControlled = value !== undefined;
  const selected = isControlled ? (value ?? null) : internalSelected;

  const applySelected = (option: T) => {
    if (!isControlled) {
      setInternalSelected(option);
    }

    onChange?.(option);
  };

  const onFlagError = (flagCode: string) => {
    setBrokenFlags((current) => {
      if (current.has(flagCode)) {
        return current;
      }

      const updated = new Set(current);
      updated.add(flagCode);
      return updated;
    });
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    listboxRef.current?.focus();

    const onOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [isOpen]);

  const openWithIndex = (index: number) => {
    setIsOpen(true);
    setActiveIndex(index);
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || options.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openWithIndex(selected ? options.findIndex((option) => option.code === selected.code) : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openWithIndex(selected ? options.findIndex((option) => option.code === selected.code) : options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen((current) => !current);
    }
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (options.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % options.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + options.length) % options.length);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const activeOption = options[activeIndex];
      applySelected(activeOption);
      setIsOpen(false);
    }
  };

  const leadingVisual = renderLeadingVisual
    ? renderLeadingVisual(selected)
    : (
      <CountryFlag
        country={(selected as CountryOption | null) ?? { code: '', name: placeholder }}
        brokenFlags={brokenFlags}
        onFlagError={onFlagError}
      />
    );

  return (
    <div className="hero-country-field" ref={wrapperRef}>
      <span id={labelId}>{label}</span>
      <div
        className="hero-country-combobox"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-labelledby={labelId}
        aria-disabled={disabled}
      >
        <button
          type="button"
          className="hero-country-trigger"
          onClick={() => {
            if (!disabled && options.length > 0) {
              setIsOpen((current) => !current);
            }
          }}
          onKeyDown={onTriggerKeyDown}
          disabled={disabled}
        >
          <span className="hero-country-option">
            {leadingVisual}
            <span>{selected?.name ?? placeholder}</span>
          </span>
          <span className="hero-country-caret" aria-hidden="true">&#9662;</span>
        </button>
        {isOpen && (
          <ul
            id={listboxId}
            ref={listboxRef}
            className="hero-country-listbox"
            role="listbox"
            tabIndex={-1}
            aria-labelledby={labelId}
            onKeyDown={onListKeyDown}
          >
            {options.map((option, index) => {
              const isSelected = selected?.code === option.code;
              const isActive = index === activeIndex;

              return (
                <li
                  key={option.code}
                  role="option"
                  aria-selected={isSelected}
                  className={`hero-country-list-option${isActive ? ' is-active' : ''}${isSelected ? ' is-selected' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    applySelected(option);
                    setIsOpen(false);
                  }}
                >
                  <span className="hero-country-option">
                    {renderLeadingVisual ? (
                      renderLeadingVisual(option)
                    ) : (
                      <CountryFlag country={option as CountryOption} brokenFlags={brokenFlags} onFlagError={onFlagError} />
                    )}
                    <span>{option.name}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function parseHeroTitle(title: string): ParsedHeroTitle | null {
  const match = title.match(/\[\[(.*?)\]\]/);

  if (!match || match.index === undefined) {
    return null;
  }

  const [fullMatch, rawVariants] = match;
  const variants = rawVariants
    .split('|')
    .map((variant) => variant.trim())
    .filter((variant) => variant.length > 0);

  if (variants.length === 0) {
    return null;
  }

  return {
    before: title.slice(0, match.index),
    variants,
    after: title.slice(match.index + fullMatch.length)
  };
}

function AnimatedHeroTitle({ title }: { title: string }) {
  const parsedTitle = parseHeroTitle(title);
  const variantsCount = parsedTitle?.variants.length ?? 0;
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  useEffect(() => {
    setActiveWordIndex(0);

    if (variantsCount < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveWordIndex((currentIndex) => (currentIndex + 1) % variantsCount);
    }, HERO_TITLE_ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [title, variantsCount]);

  if (!parsedTitle) {
    return <h1>{title}</h1>;
  }

  const activeWord = parsedTitle.variants[activeWordIndex] ?? parsedTitle.variants[0];

  return (
    <h1>
      {parsedTitle.before}
      <span key={activeWord} className="hero-search-title-accent hero-search-title-accent--animated">{activeWord}</span>
      {parsedTitle.after}
    </h1>
  );
}

export function HeroVisaSearch({
  title,
  subtitle,
  originCountryLabel,
  destinationCountryLabel,
  visaTypeLabel,
  originCountryOptions,
  destinationCountryOptions,
  visaTypeOptions,
  primaryCta,
  illustrationAlt,
  onStartApplication
}: HeroVisaSearchProps) {
  const [originCountry, setOriginCountry] = useState<CountryOption | null>(null);
  const [destinationCountry, setDestinationCountry] = useState<CountryOption | null>(
    destinationCountryOptions.find((option) => option.code === 'AU' || option.name.toLowerCase() === 'australia') ?? destinationCountryOptions[0] ?? null
  );

  useEffect(() => {
    const australiaOption =
      destinationCountryOptions.find((option) => option.code === 'AU' || option.name.toLowerCase() === 'australia') ??
      destinationCountryOptions[0] ??
      null;

    setDestinationCountry(australiaOption);
  }, [originCountry, destinationCountryOptions]);

  return (
    <section className="hero-search-band">
      <div className="hero-search-background" aria-hidden="true">
        <div className="hero-search-glow hero-search-glow--cta" />
        <div className="hero-search-glow hero-search-glow--visual" />
        <div className="hero-search-wave hero-search-wave--one">
          <svg viewBox="0 0 1200 280" preserveAspectRatio="none">
            <path d="M0,102 C180,18 360,220 540,146 C696,82 836,34 1040,108 C1114,136 1162,176 1200,192 L1200,280 L0,280 Z" />
          </svg>
        </div>
        <div className="hero-search-wave hero-search-wave--two">
          <svg viewBox="0 0 1200 280" preserveAspectRatio="none">
            <path d="M0,126 C138,168 254,56 392,84 C560,122 712,214 872,172 C996,140 1088,56 1200,88 L1200,280 L0,280 Z" />
          </svg>
        </div>
        <div className="hero-search-wave hero-search-wave--three">
          <svg viewBox="0 0 1200 280" preserveAspectRatio="none">
            <path d="M0,184 C184,98 306,132 478,214 C658,300 796,162 976,156 C1072,152 1146,180 1200,196 L1200,280 L0,280 Z" />
          </svg>
        </div>
      </div>
      <SectionContainer className="hero-search">
        <div className="hero-search-layout">
          <div className="hero-search-content">
            <header className="hero-search-copy">
              <AnimatedHeroTitle title={title} />
              <p>{subtitle}</p>
            </header>
          </div>
          <div className="hero-search-visual">
            <HeroVisual alt={illustrationAlt} cutout={false} />
          </div>
        </div>
        <div className="hero-search-panel">
          <div className="hero-search-controls">
            <SelectCombobox
              label={originCountryLabel}
              options={originCountryOptions}
              placeholder="Select country"
              value={originCountry}
              onChange={setOriginCountry}
            />
            <SelectCombobox
              label={destinationCountryLabel}
              options={destinationCountry ? [destinationCountry] : destinationCountryOptions}
              placeholder="Select country"
              value={destinationCountry}
              disabled
            />
            <SelectCombobox
              label={visaTypeLabel}
              options={visaTypeOptions}
              placeholder="Select visa type"
              renderLeadingVisual={() => (
                <span className="hero-country-flag" aria-hidden="true">
                  <VisaIcon />
                </span>
              )}
            />
            <PrimaryButton onClick={onStartApplication}>{primaryCta}</PrimaryButton>
          </div>
        </div>
        <ul className="hero-search-trust-badges" aria-label="Trust highlights">
          {HERO_TRUST_BADGES.map((badge) => (
            <li key={badge}>{badge}</li>
          ))}
        </ul>
      </SectionContainer>
    </section>
  );
}
