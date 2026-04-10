import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { VisiaChat } from '../components/landing/VisiaChat';
import { SectionContainer } from '../components/primitives/SectionContainer';
import { landingContent } from '../constants/landingContent';

type AboutPageProps = {
  pathname: string;
};

const trustPoints = [
  {
    title: 'Simplified Application Process',
    description:
      'Our platform guides you step-by-step, making the visa application process straightforward, clear and easy to follow.'
  },
  {
    title: 'Accurate Applications',
    description:
      'Structured guidance ensures your application is complete, consistent and meets official requirements, reducing the risk of errors or delays.'
  },
  {
    title: 'Do-It-Yourself Made Easy',
    description:
      'Take control of your visa application with confidence. Our tools and instructions make it simple to prepare and submit your application correctly, every time.'
  }
];

export function AboutPage({ pathname }: AboutPageProps) {
  const { brandName, navItems, loginCta, footer } = landingContent;

  return (
    <div className="landing-page about-page">
      <section className="landing-section landing-section--header">
        <div className="content-container">
          <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} pathname={pathname} />
        </div>
      </section>

      <main className="landing-main about-main">
        <section className="landing-section about-section about-section--hero">
          <div className="content-container">
            <SectionContainer className="about-hero-card">
              <p className="about-kicker">About Global Visas</p>
              <h1>Turning Your Travel Dreams into Reality</h1>
              <p>
                Global Visas makes obtaining your visa simple, reliable and stress-free. We provide guidance through
                clear eligibility assessments, step-by-step documentation support and transparent assistance throughout
                the process. Our platform helps applicants submit accurate, well-prepared visa applications with
                confidence, reducing errors and increasing your chances of approval. Global Visas gives you a clear,
                reliable path to securing your visa and making your travel dreams a reality.
              </p>
            </SectionContainer>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <SectionContainer className="about-info-card">
              <h2>Making Your Dreams a Reality</h2>
              <p>
                Global Visas was founded to provide clear, reliable and professionally structured visa services for
                families and individuals planning to travel abroad. As international travel becomes more complex and
                visa requirements increasingly detailed, we simplify the process, helping applicants prepare accurate,
                consistent and fully compliant applications with ease. Our goal is to make applying for your visa
                straightforward, stress-free and efficient, so you can focus on planning your trip.
              </p>
            </SectionContainer>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <SectionContainer className="about-why-card">
              <h2>Reasons to Trust Global Visas</h2>
              <div className="about-trust-grid">
                {trustPoints.map((point) => (
                  <article key={point.title} className="about-trust-item">
                    <h3>{point.title}</h3>
                    <p>{point.description}</p>
                  </article>
                ))}
              </div>
            </SectionContainer>
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

      <MobileBottomNav pathname={pathname} />
      <VisiaChat />
    </div>
  );
}
