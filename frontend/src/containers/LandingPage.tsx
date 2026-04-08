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
    <div className="page-shell">
      <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} />
      <main className="landing-main">
        <HeroVisaSearch {...hero} />
        <ComparisonPanel {...comparison} />
        <StatsStrip stats={stats} />
        <EasyProcess title={process.title} steps={process.steps} />
        <Testimonials title={testimonials.title} items={testimonials.items} />
      </main>
      <FooterMega columns={footer.columns} socialLinks={footer.socialLinks} copyright={footer.copyright} />
    </div>
  );
}
