import logo from '../../assets/logo.svg';

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
      <button type="button" className="btn btn-outline">{loginCta}</button>
    </header>
  );
}
