import logo from '../../global-visa-logo.png';
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
  copyright: string;
};

export function FooterMega({
  brandName,
  tagline,
  visaRoutes,
  visaNews,
  blogs,
  companyLinks,
  copyright
}: FooterMegaProps) {
  return (
    <SectionContainer as="footer" className="footer-mega footer-mega--enhanced">
      <div className="footer-mega__brand">
        <a href="#" className="brand footer-mega__brand-link">
          <img src={logo} alt={`${brandName} logo`} />
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

      <p className="footer-mega__copyright">{copyright}</p>
    </SectionContainer>
  );
}
