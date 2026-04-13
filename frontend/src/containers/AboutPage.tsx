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

const heroChips = ['2.6M+ guided applicants', '99% document accuracy', 'Global support network'];

const trustStats = [
  {
    metric: '2.6M+',
    label: 'Applicants Served',
    detail: 'Trusted by families and travelers for complete visa preparation support.'
  },
  {
    metric: '10+',
    label: 'Years Experience',
    detail: 'A decade of proven process optimization across evolving immigration requirements.'
  },
  {
    metric: '200+',
    label: 'Global Team',
    detail: 'Specialists and support members helping applicants across multiple regions.'
  }
];

const dreamHighlights = [
  'Professionally structured guidance from profile review to final checklist.',
  'Clear and compliant documentation flow that helps reduce avoidable mistakes.',
  'Transparent support that keeps applicants informed at every stage.'
];

const trustPoints = [
  {
    icon: '01',
    title: 'Simplified Application Process',
    description:
      'Our platform guides you step-by-step, making the visa application process straightforward, clear and easy to follow.'
  },
  {
    icon: '02',
    title: 'Accurate Applications',
    description:
      'Structured guidance ensures your application is complete, consistent and meets official requirements, reducing the risk of errors or delays.'
  },
  {
    icon: '03',
    title: 'Do-It-Yourself Made Easy',
    description:
      'Take control of your visa application with confidence. Our tools and instructions make it simple to prepare and submit your application correctly, every time.'
  }
];

const directAccreditations = [
  {
    country: 'Australia',
    label: 'AU',
    authority: 'Migration Agents Registration Authority',
    detail: 'Registered with professional compliance standards for migration advisory services.'
  },
  {
    country: 'New Zealand',
    label: 'NZ',
    authority: 'Immigration Advisers Authority',
    detail: 'Aligned with recognized advisory standards for immigration pathway guidance.'
  },
  {
    country: 'USA',
    label: 'US',
    authority: 'Licensed Business Operations',
    detail: 'Licensed operations in the State of Florida for service reliability and accountability.'
  },
  {
    country: 'China',
    label: 'CN',
    authority: 'Approved Delivery Agent',
    detail: 'Approved handling support for visa documentation and regulated submission flows.'
  },
  {
    country: 'United Kingdom',
    label: 'UK',
    authority: 'Immigration Consultancy Support',
    detail: 'Structured support aligned with UK immigration consultancy requirements.'
  },
  {
    country: 'Canada',
    label: 'CA',
    authority: 'CICC-Aligned Consultant Support',
    detail: 'Advisory and process support aligned with recognized Canadian immigration standards.'
  },
  {
    country: 'India',
    label: 'IN',
    authority: 'NIDHI Integration',
    detail: 'Integrated support model aligned with India NIDHI travel and hospitality data standards.'
  }
];

const partnerBrands = [
  { name: 'PrinceVisa Service', tag: 'Travel Processing' },
  { name: 'Atlys', tag: 'Digital Visas' },
  { name: 'Musafir.com', tag: 'Travel Platform' },
  { name: 'CIBT Visas', tag: 'Business Mobility' },
  { name: 'Generations Visa Service', tag: 'Documentation' },
  { name: 'Global Singapore', tag: 'Regional Support' },
  { name: 'Bali Business Consulting', tag: 'Advisory' }
];

const legalItems = [
  {
    title: 'Mailing Address',
    value: 'United States: 8 The Green, STE #5986, Dover, Delaware, 19901, United States'
  },
  { title: 'Company Representatives', value: 'Sergio Merino Gonzalez and David Perez' },
  { title: 'Contact Email', value: 'help@ausvisaservice.com' },
  { title: 'Sales Phone Number', value: '+1 510-288-5920' }
];

const officeLocations = [
  {
    country: 'United States',
    region: 'North America',
    address: '19333 Collins Ave #804, Sunny Isles Beach, FL 33160',
    phone: '+1 510-288-5920',
    mediaClass: 'office-card__media--us'
  },
  {
    country: 'Spain',
    region: 'Europe',
    address: 'Calle Estrecho de Mesina 13, 28023, Madrid 28043',
    phone: '+34 919 01 62 78',
    mediaClass: 'office-card__media--es'
  },
  {
    country: 'Peru',
    region: 'South America',
    address: 'Calle Miguel Dasso 134, Piso 301, San Isidro, Lima 15073',
    phone: '+51 01 705 8207',
    mediaClass: 'office-card__media--pe'
  },
  {
    country: 'India',
    region: 'Asia',
    address: 'E2/3, Block EP and GP, Sector V, Salt Lake, Kolkata 700091',
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
                <p className="about-kicker">About Global Visas</p>
                <h1>Turning Your Travel Dreams into Reality</h1>
                <p>
                  Global Visas makes obtaining your visa simple, reliable and stress-free. We provide guidance through
                  clear eligibility assessments, step-by-step documentation support and transparent assistance
                  throughout the process.
                </p>
                <div className="about-hero-chip-row">
                  {heroChips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
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
              <div className="about-section-header about-section-header--center">
                <p className="about-kicker">Why Clients Trust Us</p>
                <h2>We make traveling easy for everyone</h2>
                <p>Learn why families and travelers continue to rely on Global Visas across the world.</p>
              </div>
              <div className="about-trust-stat-grid">
                {trustStats.map((stat) => (
                  <article key={stat.label} className="about-trust-stat-card">
                    <span className="about-trust-stat-metric">{stat.metric}</span>
                    <h3>{stat.label}</h3>
                    <p>{stat.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <div className="about-info-card">
              <div className="about-info-layout">
                <div>
                  <h2>Making Your Dreams a Reality</h2>
                  <p>
                    Global Visas was founded to provide clear, reliable and professionally structured visa services for
                    families and individuals planning to travel abroad. As international travel becomes more complex and
                    visa requirements increasingly detailed, we simplify the process, helping applicants prepare
                    accurate, consistent and fully compliant applications with ease.
                  </p>
                  <p>
                    Our goal is to make applying for your visa straightforward, stress-free and efficient, so you can
                    focus on planning your trip.
                  </p>
                </div>
                <ul className="about-highlight-list">
                  {dreamHighlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <div className="about-why-card">
              <div className="about-section-header">
                <h2>Reasons to Trust Global Visas</h2>
              </div>
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
                      <span aria-hidden="true">{item.label}</span>
                      {item.country}
                    </h3>
                    <strong>{item.authority}</strong>
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
              <div className="about-section-header about-section-header--center">
                <p className="about-kicker">Global Network</p>
                <h2>Partner Government Accreditations</h2>
                <p>
                  We partner with trusted organizations licensed by governments to provide stable, dependable visa
                  support services.
                </p>
              </div>
              <div className="about-partner-strip" aria-label="Partner brands">
                {partnerBrands.map((partner) => (
                  <article key={partner.name}>
                    <strong>{partner.name}</strong>
                    <span>{partner.tag}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <div className="about-legal-card">
              <div className="about-section-header about-section-header--center">
                <h2>Legal Information</h2>
              </div>
              <div className="about-legal-grid">
                {legalItems.map((item) => (
                  <article key={item.title} className="about-legal-item">
                    <h3>{item.title}</h3>
                    <p>{item.value}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section about-section">
          <div className="content-container">
            <div className="about-offices-card">
              <div className="about-section-header about-section-header--center">
                <h2>Our offices around the world</h2>
              </div>
              <div className="about-offices-grid">
                {officeLocations.map((office) => (
                  <article key={office.country} className="office-card">
                    <div className={`office-card__media ${office.mediaClass}`} />
                    <div className="office-card__body">
                      <span>{office.region}</span>
                      <h3>{office.country}</h3>
                      <p>{office.address}</p>
                      <p>{office.phone}</p>
                    </div>
                    <span className="office-card__arrow" aria-hidden="true">
                      &rarr;
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
