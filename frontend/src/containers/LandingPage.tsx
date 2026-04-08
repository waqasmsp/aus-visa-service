import { ComparisonPanel } from '../components/landing/ComparisonPanel';
import { EasyProcess } from '../components/landing/EasyProcess';
import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { HeroVisaSearch } from '../components/landing/HeroVisaSearch';
import { StatsStrip } from '../components/landing/StatsStrip';
import { Testimonials } from '../components/landing/Testimonials';
import { landingContent } from '../constants/landingContent';

export function LandingPage() {
  const { hero, comparison, stats, process, testimonials, footer, brandName, navItems, loginCta } = landingContent;

  return (
    <div className="landing-page">
      <div className="content-container">
        <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} />
      </div>

      <main className="landing-main">
        <section className="landing-section landing-section--hero">
          <div className="content-container">
            <HeroVisaSearch {...hero} />
          </div>
        </section>

        <section className="landing-section">
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

      <section className="landing-section landing-section--footer">
        <div className="content-container">
          <FooterMega columns={footer.columns} socialLinks={footer.socialLinks} copyright={footer.copyright} />
        </div>
      </section>
    </div>
  );
}
