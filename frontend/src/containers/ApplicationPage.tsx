import { ApplicationStepOneForm } from '../components/landing/ApplicationStepOneForm';
import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { NewsletterSignup } from '../components/landing/NewsletterSignup';
import { landingContent } from '../constants/landingContent';

type ApplicationPageProps = {
  pathname: string;
};

const navigateTo = (path: string) => {
  if (typeof window !== 'undefined') {
    window.location.assign(path);
  }
};

export function ApplicationPage({ pathname }: ApplicationPageProps) {
  const { brandName, navItems, loginCta, newsletter, footer } = landingContent;

  return (
    <div className="landing-page">
      <section className="landing-section landing-section--header">
        <div className="content-container">
          <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} pathname={pathname} />
        </div>
      </section>

      <main className="landing-main landing-main--application">
        <section className="landing-section landing-section--application">
          <ApplicationStepOneForm />
        </section>
      </main>

      <section className="landing-section landing-section--newsletter">
        <div className="content-container">
          <NewsletterSignup
            title={newsletter.title}
            description={newsletter.description}
            emailPlaceholder={newsletter.emailPlaceholder}
            ctaLabel={newsletter.ctaLabel}
          />
        </div>
      </section>

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

      <MobileBottomNav pathname={pathname} onApplyNow={() => navigateTo('/application')} />
    </div>
  );
}
