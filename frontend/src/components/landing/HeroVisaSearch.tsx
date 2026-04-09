import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import heroIllustration from '../../assets/hero-travel-illustration.svg';
import type { CountryOption, VisaTypeOption } from '../../constants/landingContent';
import { PrimaryButton } from '../primitives/PrimaryButton';
import { SectionContainer } from '../primitives/SectionContainer';

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
  illustrationAlt: string;
};

type SelectOption = {
  code: string;
  name: string;
};

type SelectComboboxProps<T extends SelectOption> = {
  label: string;
  options: T[];
  placeholder: string;
  renderLeadingVisual?: (option: T | null) => ReactNode;
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
  renderLeadingVisual
}: SelectComboboxProps<T>) {
  const [selected, setSelected] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [brokenFlags, setBrokenFlags] = useState<Set<string>>(new Set());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const labelId = useId();
  const listboxId = useId();

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
      setSelected(activeOption);
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
      >
        <button
          type="button"
          className="hero-country-trigger"
          onClick={() => setIsOpen((current) => !current)}
          onKeyDown={onTriggerKeyDown}
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
                    setSelected(option);
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

function renderHeroTitle(title: string) {
  const match = title.match(/\[\[(.*?)\]\]/);

  if (!match || match.index === undefined) {
    return title;
  }

  const [fullMatch, highlighted] = match;
  const before = title.slice(0, match.index);
  const after = title.slice(match.index + fullMatch.length);

  return (
    <>
      {before}
      <span className="hero-search-title-accent">{highlighted}</span>
      {after}
    </>
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
  illustrationAlt
}: HeroVisaSearchProps) {
  return (
    <section className="hero-search-band">
      <SectionContainer className="hero-search">
        <div className="hero-search-layout">
          <header className="hero-search-copy">
            <h1>{renderHeroTitle(title)}</h1>
            <p>{subtitle}</p>
          </header>
          <div className="hero-search-panel">
            <div className="hero-search-controls">
              <SelectCombobox label={originCountryLabel} options={originCountryOptions} placeholder="Select country" />
              <SelectCombobox label={destinationCountryLabel} options={destinationCountryOptions} placeholder="Select country" />
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
              <PrimaryButton>{primaryCta}</PrimaryButton>
            </div>
          </div>
        </div>
      </SectionContainer>
      <img className="hero-illustration hero-illustration--subtle" src={heroIllustration} alt={illustrationAlt} loading="lazy" />
    </section>
  );
}
