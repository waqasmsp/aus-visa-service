import heroTravelIllustration from '../assets/hero-travel-illustration.svg';
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
    icon: 'STAR',
    title: 'Simplified Application Process',
    description:
      'Our platform guides you step-by-step, making the visa application process straightforward, clear and easy to follow.'
  },
  {
    icon: 'OK',
    title: 'Accurate Applications',
    description:
      'Structured guidance ensures your application is complete, consistent and meets official requirements, reducing the risk of errors or delays.'
  },
  {
    icon: 'DIY',
    title: 'Do-It-Yourself Made Easy',
    description:
      'Take control of your visa application with confidence. Our tools and instructions make it simple to prepare and submit your application correctly, every time.'
  }
];

const trustStats = [
  { icon: 'STAR', text: 'Over 2.6M applicants have trusted Global Visas to process travel documents with confidence.' },
  { icon: 'PLUS', text: '10+ years of industry experience delivering structured and reliable online visa support.' },
  { icon: 'GLB', text: 'A global team with 200+ professionals supporting applicants across multiple regions.' }
];

const directAccreditations = [
  { country: 'Australia', label: 'AU', detail: 'Registered with the Migration Agents Registration Authority (MARA).' },
  { country: 'New Zealand', label: 'NZ', detail: 'Registered with the New Zealand Immigration Advisers Authority.' },
  { country: 'USA', label: 'US', detail: 'Licensed company operations in the State of Florida.' },
  { country: 'China', label: 'CN', detail: 'Approved delivery agent for Chinese visa document submission.' },
  { country: 'United Kingdom', label: 'UK', detail: 'Level 1 Immigration Consultant operations support.' },
  {
    country: 'Canada',
    label: 'CA',
    detail: 'Class L2 RCIC-certified immigration and citizenship consultant support via CICC standards.'
  },
  { country: 'India', label: 'IN', detail: 'Used in India National Integrated Database of Hospitality Industry (NIDHI).' }
];

const partnerBrands = [
  'PrinceVisa Service',
  'Atlys',
  'Musafir.com',
  'CIBT Visas',
  'Generations Visa Service',
  'Global Singapore',
  'Bali Business Consulting'
];

const officeLocations = [
  {
    country: 'United States',
    address: '19333 Collins Ave #804, Sunny Isles Beach, FL 33160',
    phone: '+1 510-288-5920',
    mediaClass: 'office-card__media--us'
  },
  {
    country: 'Spain',
    address: 'Calle Estrecho de Mesina 13, 28023, Madrid 28043',
    phone: '+34 919 01 62 78',
    mediaClass: 'office-card__media--es'
  },
  {
    country: 'Peru',
    address: 'Calle Miguel Dasso 134, Piso 301, San Isidro, Lima 15073',
    phone: '+51 01 705 8207',
    mediaClass: 'office-card__media--pe'
  },
  {
    country: 'India',
    address: 'E2/3, Block EP & GP, Sector V, Salt Lake, Kolkata 700091',
    phone: '+91 01171816613',
    mediaClass: 'office-card__media--in'
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
        <section className="landing-section landing-section--hero about-hero-band">
          <div className="content-container">
            <div className="about-hero-shell">
              <SectionContainer className="about-hero-card about-hero-card--mini">
                <p className="about-kicker">About Us</p>
                <h1>Turning Your Travel Dreams into Reality</h1>
                <p>
                  Global Visas makes obtaining your visa simple, reliable and stress-free. We provide guidance through
                  clear eligibility assessments, step-by-step documentation support and transparent assistance
                  throughout the process.
                </p>
                <p>
                  Our platform helps applicants submit accurate, well-prepared visa applications with confidence,
                  reducing errors and increasing your chances of approval. Global Visas gives you a clear, reliable
                  path to securing your visa and making your travel dreams a reality.
                </p>
              </SectionContainer>
              <img
                src={heroTravelIllustration}
                alt="Travel route and destination illustrations."
                className="about-hero-visual"
              />
            </div>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <div className="about-trust-stat-panel">
              <div className="about-trust-stat-head">
                <p className="about-kicker">Why Clients Trust Us</p>
                <h2>We make traveling easy for everyone</h2>
                <p>Learn why families and travelers continue to rely on Global Visas across the world.</p>
              </div>
              <div className="about-trust-stat-grid">
                {trustStats.map((stat) => (
                  <article key={stat.text} className="about-trust-stat-card">
                    <span>{stat.icon}</span>
                    <p>{stat.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <div className="about-info-card">
              <h2>Making Your Dreams a Reality</h2>
              <p>
                Global Visas was founded to provide clear, reliable and professionally structured visa services for
                families and individuals planning to travel abroad. As international travel becomes more complex and
                visa requirements increasingly detailed, we simplify the process, helping applicants prepare accurate,
                consistent and fully compliant applications with ease. Our goal is to make applying for your visa
                straightforward, stress-free and efficient, so you can focus on planning your trip.
              </p>
            </div>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <div className="about-why-card">
              <h2>Reasons to Trust Global Visas</h2>
              <div className="about-trust-grid">
                {trustPoints.map((point) => (
                  <article key={point.title} className="about-trust-item">
                    <span className="about-trust-item__icon" aria-hidden="true">
                      {point.icon}
                    </span>
                    <h3>{point.title}</h3>
                    <p>{point.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <div className="about-accreditations-card">
              <div className="about-section-header">
                <p className="about-kicker">Professional Standards</p>
                <h2>Our Direct Government Accreditations</h2>
                <p>
                  To better serve you, we work with migration entities and licensed partners in specific countries so
                  applications are handled with consistency and professional care.
                </p>
              </div>
              <div className="about-accreditations-grid">
                {directAccreditations.map((item) => (
                  <article key={item.country} className="about-accreditation-item">
                    <h3>
                      <span aria-hidden="true">{item.label}</span> {item.country}
                    </h3>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <div className="about-partners-card">
              <div className="about-section-header">
                <p className="about-kicker">Global Network</p>
                <h2>Partner Government Accreditations</h2>
                <p>
                  We partner with trusted organizations licensed by governments to provide stable, dependable visa
                  support services.
                </p>
              </div>
              <div className="about-partner-strip" aria-label="Partner brands">
                {partnerBrands.map((partner) => (
                  <span key={partner}>{partner}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <div className="about-legal-card">
              <div className="about-section-header">
                <h2>Legal Information</h2>
              </div>
              <div className="about-legal-grid">
                <article className="about-legal-item">
                  <h3>Mailing Address</h3>
                  <p>
                    <strong>United States:</strong> 8 The Green, STE #5986, Dover, Delaware, 19901, United States
                  </p>
                </article>
                <article className="about-legal-item">
                  <h3>Company Representatives</h3>
                  <p>Sergio Merino Gonzalez</p>
                  <p>David Perez</p>
                </article>
                <article className="about-legal-item">
                  <h3>Contact Email</h3>
                  <p>help@ausvisaservice.com</p>
                </article>
                <article className="about-legal-item">
                  <h3>Sales Phone Number</h3>
                  <p>+1 510-288-5920</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <div className="about-offices-card">
              <div className="about-section-header">
                <h2>Our offices around the world</h2>
              </div>
              <div className="about-offices-grid">
                {officeLocations.map((office) => (
                  <article key={office.country} className="office-card">
                    <div className={`office-card__media ${office.mediaClass}`} />
                    <div className="office-card__body">
                      <h3>{office.country}</h3>
                      <p>{office.address}</p>
                      <p>{office.phone}</p>
                    </div>
                    <span className="office-card__arrow" aria-hidden="true">
                      -&gt;
                    </span>
                  </article>
                ))}
              </div>
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
