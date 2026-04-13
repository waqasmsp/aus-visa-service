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
