import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { VisiaChat } from '../components/landing/VisiaChat';
import { PageHero } from '../components/primitives/PageHero';
import { landingContent } from '../constants/landingContent';

type PricingPageProps = {
  pathname: string;
};

type PricingPlan = {
  label: string;
  title: string;
  description: string;
  points: string[];
  price: string;
  mediaClassName: string;
};

const pricingPlans: PricingPlan[] = [
  {
    label: 'Immigration Services',
    title: 'Electronic Travel Authority (ETA) - Subclass 601',
    description: 'For passport holders from certain countries.',
    points: [
      'For tourism or business visitor activities',
      'Valid for 12 months, allowing multiple entries and stays of up to 3 months each'
    ],
    price: '$49.00',
    mediaClassName: 'pricing-plan__media pricing-plan__media--eta'
  },
  {
    label: 'Visa Processing',
    title: 'Visitor Visa (Subclass 600)',
    description: 'This is the most common visitor visa and includes several streams.',
    points: [
      'Tourist Stream (Apply outside Australia or within Australia)',
      'Sponsored Family Stream',
      'Business Visitor Stream',
      'Approved Destination Status (ADS) Stream'
    ],
    price: '$699.00',
    mediaClassName: 'pricing-plan__media pricing-plan__media--visitor'
  }
];

const navigateToApplication = () => {
  if (typeof window !== 'undefined') {
    window.location.assign('/application');
  }
};

export function PricingPage({ pathname }: PricingPageProps) {
  const { brandName, navItems, loginCta, footer } = landingContent;

  return (
    <div className="landing-page pricing-page">
      <section className="landing-section landing-section--header">
        <div className="content-container">
          <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} pathname={pathname} />
        </div>
      </section>

      <main className="landing-main pricing-main">
        <PageHero
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Pricing' }
          ]}
          title="Choose the right visa package with transparent pricing"
          description="Compare Global Visas pricing for ETA and Visitor Visa services and get started with guided support."
        />

        <section className="landing-section pricing-packages">
          <div className="content-container">
            <div className="pricing-packages__stack">
              {pricingPlans.map((plan) => (
                <article key={plan.title} className="pricing-plan">
                  <div className="pricing-plan__intro">
                    <div className="pricing-plan__intro-copy">
                      <p>{plan.label}</p>
                      <h2>{plan.title}</h2>
                      <p>{plan.description}</p>
                    </div>
                    <div className={plan.mediaClassName} aria-hidden="true" />
                  </div>

                  <ul className="pricing-plan__benefits">
                    {plan.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>

                  <div className="pricing-plan__cta">
                    <p>{plan.price}</p>
                    <span>Per attempt</span>
                    <button type="button" onClick={navigateToApplication}>
                      Get Started
                    </button>
                  </div>
                </article>
              ))}
            </div>
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
            copyright={footer.copyright}
          />
        </div>
      </section>

      <MobileBottomNav pathname={pathname} onApplyNow={navigateToApplication} />
      <VisiaChat />
    </div>
  );
}
