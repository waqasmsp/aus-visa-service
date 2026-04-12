function ApplyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4.5h10l2.5 2.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5.5 19V6A1.5 1.5 0 0 1 7 4.5Z" />
      <path d="M14.5 4.5V8h3.5" />
      <path d="M8.5 11.5h7M8.5 14.5h7" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m4.5 11.3 7-6.1a.8.8 0 0 1 1 0l7 6.1V19a1.5 1.5 0 0 1-1.5 1.5h-3.3V14h-5.4v6.5H6A1.5 1.5 0 0 1 4.5 19v-7.7Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10v5" />
      <circle cx="12" cy="7.2" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

const normalizePathname = (value: string): string => value.toLowerCase().replace(/\/+$/, '') || '/';

type MobileBottomNavProps = {
  pathname: string;
  onApplyNow?: () => void;
};

export function MobileBottomNav({ pathname, onApplyNow }: MobileBottomNavProps) {
  const currentPath = normalizePathname(pathname);
  const isHome = currentPath === '/';
  const isAbout = currentPath === '/about-us';

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile quick navigation">
      <button type="button" className="mobile-bottom-nav__item mobile-bottom-nav__item--apply" onClick={onApplyNow}>
        <span className="mobile-bottom-nav__icon">
          <ApplyIcon />
        </span>
        <span>Apply Now</span>
      </button>
      <a
        href="/"
        className={`mobile-bottom-nav__item${isHome ? ' mobile-bottom-nav__item--active' : ''}`}
        aria-current={isHome ? 'page' : undefined}
      >
        <span className="mobile-bottom-nav__icon">
          <HomeIcon />
        </span>
        <span>Home</span>
      </a>
      <a
        href="/about-us"
        className={`mobile-bottom-nav__item${isAbout ? ' mobile-bottom-nav__item--active' : ''}`}
        aria-current={isAbout ? 'page' : undefined}
      >
        <span className="mobile-bottom-nav__icon">
          <InfoIcon />
        </span>
        <span>About Us</span>
      </a>
    </nav>
  );
}
