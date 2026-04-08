import logo from '../../assets/logo.svg';
import { PrimaryButton } from '../primitives/PrimaryButton';

type HeaderNavProps = {
  brandName: string;
  navItems: string[];
  loginCta: string;
};

export function HeaderNav({ brandName, navItems, loginCta }: HeaderNavProps) {
  return (
    <header className="landing-header">
      <a href="#" className="brand">
        <img src={logo} alt={`${brandName} logo`} />
        <span>{brandName}</span>
      </a>
      <nav className="landing-nav">
        {navItems.map((item) => (
          <a key={item} href="#">{item}</a>
        ))}
      </nav>
      <PrimaryButton variant="outline">{loginCta}</PrimaryButton>
    </header>
  );
}
