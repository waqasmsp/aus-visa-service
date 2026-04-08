import logo from '../../assets/logo-custom-variant.svg';
import { PrimaryButton } from '../primitives/PrimaryButton';

type HeaderNavProps = {
  brandName: string;
  navItems: string[];
  loginCta: string;
};

export function HeaderNav({ brandName, navItems, loginCta }: HeaderNavProps) {
  const hasDropdown = (item: string) => !['Home', 'Contact Us'].includes(item);

  return (
    <header className="landing-header top-header">
      <a href="#" className="brand top-header__brand">
        <img src={logo} alt={`${brandName} logo`} />
        <span>{brandName}</span>
      </a>

      <nav className="landing-nav top-header__nav" aria-label="Primary">
        {navItems.map((item) => (
          <a key={item} href="#">
            <span>{item}</span>
            {hasDropdown(item) ? <span className="top-header__nav-indicator">▾</span> : null}
          </a>
        ))}
      </nav>

      <div className="top-header__actions">
        <button className="top-header__icon-button" type="button" aria-label="Change language">
          🌐
        </button>
        <PrimaryButton variant="outline">{loginCta}</PrimaryButton>
      </div>
    </header>
  );
}
