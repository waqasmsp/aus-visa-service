import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { VisiaChat } from '../components/landing/VisiaChat';
import { landingContent } from '../constants/landingContent';

type VisaDetailsPageProps = {
  pathname: string;
};

type VisaNavItem = {
  title: string;
  href: string;
};

type VisaPageContent = {
  title: string;
  intro: string;
  countryColumns?: string[][];
  bullets?: string[];
  streams?: { heading: string; points: string[] }[];
  table?: { headers: string[]; rows: string[][] };
};

const visaNavItems: VisaNavItem[] = [
  { title: 'Visitor Visa (Subclass 600)', href: '/visa/visitor-visa-subclass-600' },
  {
    title: 'Electronic Travel Authority (ETA) – Subclass 601',
    href: '/visa/electronic-travel-authority-eta-subclass-601'
  },
  { title: 'eVisitor Visa – Subclass 651', href: '/visa/evisitor-visa-subclass-651' },
  { title: 'visitor visas under the subclass 600', href: '/visa/visitor-visas-under-the-subclass-600' }
];

const visaPages: Record<string, VisaPageContent> = {
  '/visa/visitor-visa-subclass-600': {
    title: 'Visitor Visa (Subclass 600)',
    intro: 'This is the most common visitor visa and includes several streams:',
    streams: [
      {
        heading: 'Tourist Stream (Apply outside Australia or within Australia)',
        points: [
          'For people visiting for holidays, recreation, or to visit family and friends.',
          'Duration: Usually up to 3, 6, or 12 months.',
          'Can be applied for from inside or outside Australia.'
        ]
      },
      {
        heading: 'Sponsored Family Stream',
        points: [
          'For people sponsored by an eligible Australian citizen or permanent resident.',
          'The sponsor may need to provide a security bond.',
          'Extra checks apply to ensure visitor intent and return plans.'
        ]
      },
      {
        heading: 'Business Visitor Stream',
        points: [
          'For short business visits such as meetings, conferences, or negotiations.',
          'Does not allow paid work in Australia.',
          'Usually granted for up to 3 months per entry.'
        ]
      }
    ],
    bullets: ['Applications are assessed case-by-case based on documents and travel intent.']
  },
  '/visa/electronic-travel-authority-eta-subclass-601': {
    title: 'Electronic Travel Authority (ETA) – Subclass 601',
    intro: 'For passport holders from certain countries.',
    countryColumns: [
      ['Andorra', 'Austria', 'Belgium', 'Brunei', 'Canada', 'Denmark', 'Finland', 'France', 'Germany', 'Greece'],
      ['Hong Kong (SAR of China)', 'Iceland', 'Ireland', 'Italy', 'Japan', 'Liechtenstein', 'Luxembourg', 'Malaysia', 'Malta', 'Monaco'],
      ['Norway', 'Portugal', 'Republic of San Marino', 'Singapore', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 'United Kingdom', 'United States of America']
    ],
    bullets: [
      'For tourism or business visitor activities.',
      'Valid for 12 months, allowing multiple entries and stays of up to 3 months each.',
      'Apply digitally and keep passport details up to date before travel.'
    ]
  },
  '/visa/evisitor-visa-subclass-651': {
    title: 'eVisitor Visa – Subclass 651',
    intro: 'For passport holders of the EU and select European countries.',
    countryColumns: [
      ['Andorra', 'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland'],
      ['France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania'],
      ['Luxembourg', 'Malta', 'Monaco', 'The Netherlands', 'Norway', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia']
    ],
    bullets: [
      'Free of charge.',
      'Valid for 12 months, allows multiple entries and 3-month stays.',
      'For tourism or business visitor purposes.'
    ]
  },
  '/visa/visitor-visas-under-the-subclass-600': {
    title: 'visitor visas under the subclass 600',
    intro: 'Compare the major streams available under Subclass 600.',
    table: {
      headers: ['Visa Type', 'Purpose', 'Who Can Apply', 'Stay Duration'],
      rows: [
        ['Subclass 600 – Tourist', 'Tourism, visiting family', 'All nationalities', 'Up to 3, 6, or 12 months'],
        [
          'Subclass 600 – Sponsored Family',
          'Visiting family (with sponsor)',
          'All nationalities (with Australian sponsor)',
          'Up to 12 months'
        ],
        ['Subclass 600 – Business Visitor', 'Business meetings and events', 'All nationalities', 'Up to 3 months'],
        ['Subclass 600 – ADS Stream', 'Tour groups from China', 'Citizens of China via approved agents', 'Usually up to 30 days']
      ]
    },
    bullets: ['Choose the stream that best matches your purpose of travel and supporting documents.']
  }
};

const normalizedPath = (pathname: string) => pathname.toLowerCase().replace(/\/+$/, '') || '/';

const navigateToApplication = () => {
  if (typeof window !== 'undefined') {
    window.location.assign('/application');
  }
};

export function VisaDetailsPage({ pathname }: VisaDetailsPageProps) {
  const { brandName, navItems, loginCta, footer } = landingContent;
  const activePath = normalizedPath(pathname);
  const content = visaPages[activePath] ?? visaPages['/visa/visitor-visa-subclass-600'];

  return (
    <div className="landing-page visa-details-page">
      <section className="landing-section landing-section--header">
        <div className="content-container">
          <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} pathname={pathname} />
        </div>
      </section>

      <main className="landing-main visa-details-main">
        <section className="landing-section visa-details-section">
          <div className="content-container visa-details-layout">
            <aside className="visa-side-nav" aria-label="Visa categories">
              {visaNavItems.map((item) => {
                const isActive = item.href === activePath;
                return (
                  <a key={item.href} href={item.href} className={`visa-side-nav__item${isActive ? ' is-active' : ''}`}>
                    <span>{item.title}</span>
                    <span aria-hidden="true">›</span>
                  </a>
                );
              })}
            </aside>

            <section className="visa-content" aria-label={content.title}>
              <div className="visa-content__hero">
                <h1>{content.title}</h1>
                <p>{content.intro}</p>
              </div>

              {content.countryColumns ? (
                <div className="visa-country-grid" role="list" aria-label="Eligible countries">
                  {content.countryColumns.map((column, columnIndex) => (
                    <ul key={`${content.title}-column-${columnIndex}`}>
                      {column.map((country) => (
                        <li key={country}>{country}</li>
                      ))}
                    </ul>
                  ))}
                </div>
              ) : null}

              {content.streams ? (
                <div className="visa-streams">
                  {content.streams.map((stream) => (
                    <article key={stream.heading} className="visa-stream-card">
                      <h2>{stream.heading}</h2>
                      <ul>
                        {stream.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              ) : null}

              {content.table ? (
                <div className="visa-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        {content.table.headers.map((header) => (
                          <th key={header} scope="col">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {content.table.rows.map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell) => (
                            <td key={cell}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {content.bullets ? (
                <ul className="visa-summary-bullets">
                  {content.bullets.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}

              <button type="button" className="visa-apply-button" onClick={navigateToApplication}>
                Apply Now
              </button>
            </section>
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

      <MobileBottomNav pathname={pathname} onApplyNow={navigateToApplication} />
      <VisiaChat />
    </div>
  );
}
