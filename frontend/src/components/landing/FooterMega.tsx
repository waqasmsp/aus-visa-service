import logo from '../../assets/logo-custom-variant.svg';
import { SectionContainer } from '../primitives/SectionContainer';

type FooterMegaProps = {
  brandName: string;
  tagline: string;
  visaRoutes: string[];
  visaNews: string[];
  blogs: string[];
  companyLinks: Array<{
    label: string;
    href: string;
  }>;
  socialLinks: string[];
  copyright: string;
};

export function FooterMega({
  brandName,
  tagline,
  visaRoutes,
  visaNews,
  blogs,
  companyLinks,
  socialLinks,
  copyright
}: FooterMegaProps) {
  return (
    <SectionContainer as="footer" className="footer-mega footer-mega--enhanced">
      <div className="footer-mega__brand">
        <a href="#" className="brand footer-mega__brand-link">
          <img src={logo} alt={`${brandName} logo`} />
          <span>{brandName}</span>
        </a>
        <p>{tagline}</p>
      </div>

      <div className="footer-mega__grid">
        <div className="footer-mega__column">
          <h3>Visas by Nationality</h3>
          <ul>
            {visaRoutes.map((route) => (
              <li key={route}>
                <a href="#">{route}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-mega__column">
          <h3>Latest Visa News</h3>
          <ul>
            {visaNews.map((newsItem) => (
              <li key={newsItem}>
                <a href="#">{newsItem}</a>
              </li>
            ))}
          </ul>

          <h3 className="footer-mega__subheading">Recent Blogs</h3>
          <ul>
            {blogs.map((blog) => (
              <li key={blog}>
                <a href="#">{blog}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-mega__column">
          <h3>Company</h3>
          <ul>
            {companyLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-mega__bottom">
        <div className="footer-mega__social-wrap">
          <span>Connect with us:</span>
          <ul className="footer-social-links" aria-label="Social links">
            {socialLinks.map((label) => (
              <li key={label}>
                <a href="#" aria-label={label}>
                  {label.slice(0, 2).toUpperCase()}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-mega__stores" aria-label="App download links">
          <a href="#" className="footer-store-badge">
            <strong>Available on</strong>
            <span>App Store</span>
          </a>
          <a href="#" className="footer-store-badge">
            <strong>Available on</strong>
            <span>Google Play</span>
          </a>
        </div>
      </div>

      <p className="footer-mega__copyright">{copyright}</p>
    </SectionContainer>
  );
}
