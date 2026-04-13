import { useEffect, useState } from 'react';
import logo from '../../assets/logo-custom-variant.svg';
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
    case 'About Us':
      return '/about-us';
    case 'Contact Us':
      return '/contact-us';
    default:
      return '#';
  }
};

const normalizePathname = (value: string): string => value.toLowerCase().replace(/\/+$/, '') || '/';

export function HeaderNav({ brandName, navItems, loginCta, pathname }: HeaderNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hasDropdown = (item: string) => !['Home', 'About Us', 'Contact Us'].includes(item);
  const currentPath = normalizePathname(pathname);
  const goToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/dashboard/login');
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

        <a href="/" className="brand top-header__brand">
          <img src={logo} alt={`${brandName} logo`} />
          <span>{brandName}</span>
        </a>

        <nav className="landing-nav top-header__nav" aria-label="Primary">
          {navItems.map((item) => {
            const href = resolveNavHref(item);
            const isCurrent = normalizePathname(href) === currentPath;

            return (
              <a key={item} href={href} aria-current={isCurrent ? 'page' : undefined}>
              <span>{item}</span>
              {hasDropdown(item) ? <span className="top-header__nav-indicator">&#9662;</span> : null}
            </a>
            );
          })}
        </nav>

        <div className="top-header__actions">
          <button className="top-header__icon-button" type="button" aria-label="Change language">
            &#127760;
          </button>
          <PrimaryButton variant="outline" onClick={goToLogin}>
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
            <a href="/" className="brand mobile-sidepanel__brand" onClick={closeMobileMenu}>
              <img src={logo} alt={`${brandName} logo`} />
              <span>{brandName}</span>
            </a>
            <button type="button" className="mobile-sidepanel__close" aria-label="Close menu" onClick={closeMobileMenu}>
              &#10005;
            </button>
          </div>

          <nav className="mobile-sidepanel__nav" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const href = resolveNavHref(item);
              const isCurrent = normalizePathname(href) === currentPath;

              return (
                <a
                  key={`mobile-${item}`}
                  href={href}
                  onClick={closeMobileMenu}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                <span>{item}</span>
                {hasDropdown(item) ? <span className="mobile-sidepanel__nav-indicator">&#9662;</span> : null}
              </a>
              );
            })}
          </nav>

          <PrimaryButton variant="outline" className="mobile-sidepanel__login-button" onClick={goToLogin}>
            {loginCta}
          </PrimaryButton>
        </aside>
      </div>
    </>
  );
}
