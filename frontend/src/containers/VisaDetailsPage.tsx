import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { VisiaChat } from '../components/landing/VisiaChat';
import { PageHero } from '../components/primitives/PageHero';
import { landingContent } from '../constants/landingContent';
import { visaNavItems, visaPages } from '../constants/visaContent';

type VisaDetailsPageProps = {
  pathname: string;
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
        <PageHero
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Visa Services', href: '/visa-services' },
            { label: content.title }
          ]}
          title={content.title}
          description={content.intro}
        />
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
                <h2>{content.title}</h2>
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
            copyright={footer.copyright}
          />
        </div>
      </section>

      <MobileBottomNav pathname={pathname} onApplyNow={navigateToApplication} />
      <VisiaChat />
    </div>
  );
}
