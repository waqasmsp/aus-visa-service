import { ComparisonPanel } from '../components/landing/ComparisonPanel';
import { EasyProcess } from '../components/landing/EasyProcess';
import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { HeroVisaSearch } from '../components/landing/HeroVisaSearch';
import { Inc5000Highlight } from '../components/landing/Inc5000Highlight';
import { NewsletterSignup } from '../components/landing/NewsletterSignup';
import { StatsStrip } from '../components/landing/StatsStrip';
import { Testimonials } from '../components/landing/Testimonials';
import { VisiaChat } from '../components/landing/VisiaChat';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { landingContent } from '../constants/landingContent';

export function LandingPage({ pathname }: { pathname: string }) {
  const { hero, comparison, stats, process, testimonials, newsletter, footer, brandName, navItems, loginCta } =
    landingContent;

  return (
    <div className="landing-page">
      <section className="landing-section landing-section--header">
        <div className="content-container">
          <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} pathname={pathname} />
        </div>
      </section>

      <main className="landing-main">
        <section className="landing-section landing-section--hero">
          <HeroVisaSearch {...hero} />
        </section>

        <section className="landing-section landing-section--comparison">
          <div className="content-container">
            <ComparisonPanel {...comparison} />
          </div>
        </section>

        <section className="landing-section landing-section--stats">
          <div className="content-container">
            <StatsStrip stats={stats} />
          </div>
        </section>

        <section className="landing-section">
          <div className="content-container">
            <EasyProcess title={process.title} steps={process.steps} />
          </div>
        </section>

        <section className="landing-section landing-section--testimonials">
          <div className="content-container">
            <Testimonials title={testimonials.title} items={testimonials.items} />
          </div>
        </section>
      </main>

      <section className="landing-section landing-section--inc-highlight">
        <div className="content-container">
          <Inc5000Highlight />
        </div>
      </section>

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

      <MobileBottomNav pathname={pathname} />
      <VisiaChat />
    </div>
  );
}
