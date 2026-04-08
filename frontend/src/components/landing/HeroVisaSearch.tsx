import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import heroIllustration from '../../assets/hero-travel-illustration.svg';
import type { CountryOption } from '../../constants/landingContent';
import { PrimaryButton } from '../primitives/PrimaryButton';
import { SectionContainer } from '../primitives/SectionContainer';

type HeroVisaSearchProps = {
  title: string;
  subtitle: string;
  selectOneLabel: string;
  selectTwoLabel: string;
  selectOneOptions: CountryOption[];
  selectTwoOptions: CountryOption[];
  primaryCta: string;
  illustrationAlt: string;
};

type CountryComboboxProps = {
  label: string;
  options: CountryOption[];
  placeholder: string;
};

function CountryCombobox({ label, options, placeholder }: CountryComboboxProps) {
  const [selected, setSelected] = useState<CountryOption | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const labelId = useId();
  const listboxId = useId();

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
            <span className="hero-country-flag" aria-hidden="true">{selected?.flagEmoji ?? '🌐'}</span>
            <span>{selected?.name ?? placeholder}</span>
          </span>
          <span className="hero-country-caret" aria-hidden="true">▾</span>
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
                    <span className="hero-country-flag" aria-hidden="true">{option.flagEmoji ?? '🌐'}</span>
                    <span>{option.name}</span>
                  </span>
                  {!option.flagEmoji && <span className="hero-country-fallback">Flag unavailable</span>}
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
  selectOneLabel,
  selectTwoLabel,
  selectOneOptions,
  selectTwoOptions,
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
              <CountryCombobox label={selectOneLabel} options={selectOneOptions} placeholder="Select country" />
              <CountryCombobox label={selectTwoLabel} options={selectTwoOptions} placeholder="Select destination" />
              <PrimaryButton>{primaryCta}</PrimaryButton>
            </div>
          </div>
        </div>
      </SectionContainer>
      <img className="hero-illustration hero-illustration--subtle" src={heroIllustration} alt={illustrationAlt} loading="lazy" />
    </section>
  );
}
