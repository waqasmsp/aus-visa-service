import { useEffect, useRef, useState } from 'react';
import logo from '../../global-visa-logo.png';
import { visaNavItems } from '../../constants/visaContent';
import { PrimaryButton } from '../primitives/PrimaryButton';

type HeaderNavProps = {
  brandName: string;
  navItems: string[];
  loginCta: string;
  pathname: string;
};

const resolveNavHref = (item: string): string => {
  switch (item) {
    case 'Home':
      return '/';
    case 'Visa Services':
      return '/visa-services';
    case 'About Us':
      return '/about-us';
    case 'Pricing':
      return '/pricing';
    case 'Blog':
    case 'Blogs':
      return '/blog';
    case 'Contact Us':
      return '/contact-us';
    default:
      return '#';
  }
};

const normalizePathname = (value: string): string => value.toLowerCase().replace(/\/+$/, '') || '/';
const MENU_CLOSE_DELAY_MS = 240;

const getVisaIcon = (title: string): string => {
  if (title.includes('Subclass 600')) {
    return '🧳';
  }
  if (title.includes('601')) {
    return '⚡';
  }
  if (title.includes('651')) {
    return '🌍';
  }
  return '📊';
};

export function HeaderNav({ brandName, navItems, loginCta, pathname }: HeaderNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisaDropdownOpen, setIsVisaDropdownOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const hasDropdown = (item: string) => item === 'Visa Services';
  const currentPath = normalizePathname(pathname);
  const goToApplication = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/application');
    }
  };

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    document.body.classList.toggle('body--menu-open', isMobileMenuOpen);
    return () => document.body.classList.remove('body--menu-open');
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)');
    const syncMenuState = () => {
      if (!query.matches) {
        setIsMobileMenuOpen(false);
      }
    };

    syncMenuState();
    query.addEventListener('change', syncMenuState);
    return () => query.removeEventListener('change', syncMenuState);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openVisaDropdown = () => {
    clearCloseTimer();
    setIsVisaDropdownOpen(true);
  };

  const queueCloseVisaDropdown = () => {
    clearCloseTimer();
    if (typeof window !== 'undefined') {
      closeTimerRef.current = window.setTimeout(() => {
        setIsVisaDropdownOpen(false);
        closeTimerRef.current = null;
      }, MENU_CLOSE_DELAY_MS);
    }
  };

  useEffect(
    () => () => {
      clearCloseTimer();
    },
    []
  );

  return (
    <>
      <header className="landing-header top-header">
        <button
          type="button"
          className="top-header__menu-button"
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-sidepanel"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 7.5h16" />
            <path d="M7 12h13" />
            <path d="M4 16.5h16" />
          </svg>
        </button>

        <a href="/" className="brand top-header__brand" aria-label={brandName}>
          <img src={logo} alt={`${brandName} logo`} />
        </a>

        <nav className="landing-nav top-header__nav" aria-label="Primary">
          {navItems.map((item) => {
            const href = resolveNavHref(item);
            const normalizedHref = normalizePathname(href);
            const isCurrent =
              normalizedHref === '/visa-services'
                ? currentPath === '/visa-services' || currentPath.startsWith('/visa/')
                : normalizedHref === currentPath;
            const dropdownEnabled = hasDropdown(item);

            return (
              <div
                key={item}
                className={`top-header__nav-item${dropdownEnabled ? ' top-header__nav-item--mega' : ''}${isVisaDropdownOpen ? ' is-open' : ''}`}
                onMouseEnter={dropdownEnabled ? openVisaDropdown : undefined}
                onMouseLeave={dropdownEnabled ? queueCloseVisaDropdown : undefined}
              >
                <a href={href} aria-current={isCurrent ? 'page' : undefined}>
                  <span>{item}</span>
                  {dropdownEnabled ? <span className="top-header__nav-indicator">&#9662;</span> : null}
                </a>

                {dropdownEnabled ? (
                  <div
                    className="mega-menu"
                    role="group"
                    aria-label="Visa service types"
                    onMouseEnter={openVisaDropdown}
                    onMouseLeave={queueCloseVisaDropdown}
                  >
                    <div className="mega-menu__layout">
                      <div className="mega-menu__media" aria-hidden="true">
                        <div className="mega-menu__media-placeholder">Image Holder</div>
                      </div>

                      <div className="mega-menu__content">
                        <a href="/visa-services" className="mega-menu__overview">
                          <strong>
                            <span className="mega-menu__icon" aria-hidden="true">
                              🗂️
                            </span>
                            All Visa Services
                          </strong>
                          <span>View complete visa services page with detailed guidance.</span>
                        </a>
                        <div className="mega-menu__grid">
                          {visaNavItems.map((visaItem) => (
                            <a key={visaItem.href} href={visaItem.href} className="mega-menu__link">
                              <span>
                                <span className="mega-menu__icon" aria-hidden="true">
                                  {getVisaIcon(visaItem.title)}
                                </span>
                                {visaItem.title}
                              </span>
                              <small>{visaItem.summary}</small>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="top-header__actions">
          <PrimaryButton variant="outline" onClick={goToApplication}>
            {loginCta}
          </PrimaryButton>
        </div>
      </header>

      <div
        id="mobile-sidepanel"
        className={`mobile-sidepanel${isMobileMenuOpen ? ' is-open' : ''}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <button type="button" className="mobile-sidepanel__backdrop" aria-label="Close menu" onClick={closeMobileMenu} />
        <aside className="mobile-sidepanel__panel" role="dialog" aria-modal="true" aria-label="Mobile menu">
          <div className="mobile-sidepanel__header">
            <a href="/" className="brand mobile-sidepanel__brand" onClick={closeMobileMenu} aria-label={brandName}>
              <img src={logo} alt={`${brandName} logo`} />
            </a>
            <button type="button" className="mobile-sidepanel__close" aria-label="Close menu" onClick={closeMobileMenu}>
              &#10005;
            </button>
          </div>

          <nav className="mobile-sidepanel__nav" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const href = resolveNavHref(item);
              const normalizedHref = normalizePathname(href);
              const isCurrent =
                normalizedHref === '/visa-services'
                  ? currentPath === '/visa-services' || currentPath.startsWith('/visa/')
                  : normalizedHref === currentPath;
              const dropdownEnabled = hasDropdown(item);

              return (
                <div key={`mobile-${item}`} className="mobile-sidepanel__nav-group">
                  <a href={href} onClick={closeMobileMenu} aria-current={isCurrent ? 'page' : undefined}>
                    <span>{item}</span>
                    {dropdownEnabled ? <span className="mobile-sidepanel__nav-indicator">&#9662;</span> : null}
                  </a>
                  {dropdownEnabled ? (
                    <div className="mobile-sidepanel__subnav">
                      {visaNavItems.map((visaItem) => (
                        <a key={`mobile-${visaItem.href}`} href={visaItem.href} onClick={closeMobileMenu}>
                          <span className="mobile-sidepanel__subnav-icon" aria-hidden="true">
                            {getVisaIcon(visaItem.title)}
                          </span>
                          {visaItem.title}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <PrimaryButton variant="outline" className="mobile-sidepanel__login-button" onClick={goToApplication}>
            {loginCta}
          </PrimaryButton>
        </aside>
      </div>
    </>
  );
}
