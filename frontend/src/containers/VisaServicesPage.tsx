import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { VisiaChat } from '../components/landing/VisiaChat';
import { landingContent } from '../constants/landingContent';
import { visaNavItems } from '../constants/visaContent';

export function VisaServicesPage({ pathname }: { pathname: string }) {
  const { brandName, navItems, loginCta, footer } = landingContent;

  const openApplicationPage = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/application');
    }
  };

  return (
    <div className="landing-page visa-services-page">
      <section className="landing-section landing-section--header">
        <div className="content-container">
          <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} pathname={pathname} />
        </div>
      </section>

      <main className="landing-main visa-services-main">
        <section className="landing-section visa-services-hero">
          <div className="content-container visa-services-hero__inner">
            <p className="visa-services-hero__eyebrow">VISA SERVICES</p>
            <h1>Explore Australian visa options with clear guidance for every pathway</h1>
            <p>
              Compare all major visitor visa types, understand eligibility faster, and move from research to application
              with confidence. Every service below has a dedicated details page and a direct action path.
            </p>
          </div>
        </section>

        <section className="landing-section visa-services-summary" aria-label="Visa types summary table">
          <div className="content-container visa-services-summary__inner">
            <p className="visa-services-summary__title">
              <strong>Summary Table</strong>
            </p>
            <div className="visa-services-summary__table-wrap">
              <table className="visa-services-summary__table">
                <thead>
                  <tr>
                    <th>Visa Type</th>
                    <th>Purpose</th>
                    <th>Who Can Apply</th>
                    <th>Stay Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Subclass 600 – Tourist</td>
                    <td>Tourism, visiting family</td>
                    <td>All nationalities</td>
                    <td>Up to 3, 6, or 12 months</td>
                  </tr>
                  <tr>
                    <td>Subclass 600 – Sponsored</td>
                    <td>Visiting family (with sponsor)</td>
                    <td>All nationalities (with Aussie sponsor)</td>
                    <td>Up to 12 months</td>
                  </tr>
                  <tr>
                    <td>Subclass 600 – Business</td>
                    <td>Business-related visits</td>
                    <td>All nationalities</td>
                    <td>Up to 3 months</td>
                  </tr>
                  <tr>
                    <td>Subclass 601 – ETA</td>
                    <td>Tourism/Business</td>
                    <td>Certain countries (e.g., US, Canada)</td>
                    <td>12 months, 3 months/visit</td>
                  </tr>
                  <tr>
                    <td>Subclass 651 – eVisitor</td>
                    <td>Tourism/Business</td>
                    <td>EU and some European countries</td>
                    <td>12 months, 3 months/visit</td>
                  </tr>
                  <tr>
                    <td>Subclass 600 – ADS</td>
                    <td>Organized tour groups</td>
                    <td>Chinese citizens</td>
                    <td>Per tour duration</td>
                  </tr>
                  <tr>
                    <td>Subclass 600 – Frequent Traveller</td>
                    <td>Repeat travel</td>
                    <td>Chinese citizens</td>
                    <td>Up to 10 years, 3 months/visit</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="landing-section visa-services-list" aria-label="Visa services list">
          <div className="content-container visa-services-list__inner">
            {visaNavItems.map((item, index) => {
              const isReversed = index % 2 !== 0;
              return (
                <article key={item.href} className={`visa-service-feature${isReversed ? ' is-reversed' : ''}`}>
                  <div className={`visa-service-feature__image visa-service-feature__image--${item.imageVariant}`} aria-hidden="true" />
                  <div className="visa-service-feature__content">
                    <p className="visa-service-feature__label">Service {index + 1}</p>
                    <h2>{item.title}</h2>
                    <p>{item.summary}</p>
                    <a href={item.href} className="visa-service-feature__cta">
                      More Details
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <section className="landing-section landing-section--footer">
        <div className="content-container">
          <FooterMega
            brandName={brandName}
            tagline={footer.tagline}
            visaRoutes={footer.visaRoutes}
            visaNews={footer.visaNews}
            blogs={footer.blogs}
            companyLinks={footer.companyLinks}
            socialLinks={footer.socialLinks}
            copyright={footer.copyright}
          />
        </div>
      </section>

      <MobileBottomNav pathname={pathname} onApplyNow={openApplicationPage} />
      <VisiaChat />
    </div>
  );
}
