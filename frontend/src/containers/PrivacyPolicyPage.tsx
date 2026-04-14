import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { VisiaChat } from '../components/landing/VisiaChat';
import { PageHero } from '../components/primitives/PageHero';
import { landingContent } from '../constants/landingContent';

type PrivacyPolicyPageProps = {
  pathname: string;
};

const sections = [
  {
    title: '1. Information We Collect',
    intro: 'We collect information that helps us provide, maintain, and improve our Service, including:',
    points: [
      {
        heading: 'a) Personal Information',
        items: [
          'Name, date of birth, contact details (email, phone number), address, and passport information.',
          'Information required for visa applications (e.g., travel history, employment details).'
        ]
      },
      {
        heading: 'b) Account Information',
        items: ['Login credentials, account settings, and user preferences.']
      },
      {
        heading: 'c) Payment Information',
        items: ['Payment details, billing information, and transaction history.']
      },
      {
        heading: 'd) Technical Information',
        items: ['IP address, browser type, operating system, device information, and usage patterns on our platform.']
      },
      {
        heading: 'e) Cookies and Tracking',
        items: ['We may use cookies and similar technologies to enhance your user experience and collect anonymous data.']
      }
    ]
  },
  {
    title: '2. How We Use Your Information',
    intro: 'We use your information to:',
    bullets: [
      'Provide and manage the Service, including guiding you through your visa application.',
      'Verify, process, and submit applications accurately.',
      'Communicate with you regarding updates, support, and notifications.',
      'Improve and personalize the Service.',
      'Ensure security, prevent fraud, and comply with legal obligations.'
    ]
  },
  {
    title: '3. Sharing Your Information',
    intro: 'We do not sell or rent your personal information. We may share information with:',
    bullets: [
      'Government and Visa Authorities: to submit and process your visa applications.',
      'Service Providers: trusted partners who assist in payment processing, IT services, or analytics.',
      'Legal Requirements: if required by law, legal process, or to protect rights and safety.'
    ]
  },
  {
    title: '4. Data Storage and Security',
    bullets: [
      'Your personal information is stored securely using industry-standard practices.',
      'We implement reasonable technical, administrative, and physical measures to protect against unauthorized access, loss, or disclosure.',
      'While we strive to protect your data, no online system can be completely secure.'
    ]
  },
  {
    title: '5. Your Rights',
    intro: 'Under the Privacy Act 1988 (Cth), you have the right to:',
    bullets: [
      'Access the personal information we hold about you.',
      'Request correction of inaccurate or incomplete information.',
      'Withdraw consent for certain uses of your information (where applicable).',
      'Make a privacy complaint, which we will investigate promptly.'
    ],
    outro: 'To exercise these rights, please contact us at [Insert Contact Email].'
  },
  {
    title: '6. Cookies and Tracking',
    bullets: [
      'Our website may use cookies and tracking technologies to improve functionality, analyze traffic, and enhance user experience.',
      'You can adjust your browser settings to block cookies, but some features of the Service may not function properly if cookies are disabled.'
    ]
  },
  {
    title: '7. Third-Party Services',
    intro:
      'Our Service may include links to third-party websites or services. This Privacy Policy does not apply to third-party sites, and we are not responsible for their privacy practices. We encourage you to read their privacy policies before providing personal information.'
  },
  {
    title: '8. Retention of Information',
    bullets: [
      'We retain your personal information only as long as necessary to provide the Service, comply with legal obligations, resolve disputes, and enforce our agreements.',
      'Once no longer needed, personal information will be securely deleted or anonymized.'
    ]
  },
  {
    title: '9. Updates to this Privacy Policy',
    intro:
      'We may update this Privacy Policy from time to time. Updated policies will be posted on our website with the effective date. Your continued use of the Service after changes indicates your acceptance of the updated Privacy Policy.'
  }
];

const navigateToApplication = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.location.assign('/application');
};

export function PrivacyPolicyPage({ pathname }: PrivacyPolicyPageProps) {
  const { brandName, navItems, loginCta, footer } = landingContent;

  return (
    <div className="landing-page privacy-page">
      <section className="landing-section landing-section--header">
        <div className="content-container">
          <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} pathname={pathname} />
        </div>
      </section>

      <main className="landing-main privacy-main">
        <PageHero
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Privacy Policy' }
          ]}
          title="Privacy Policy"
          description="Learn how Global Visas collects, uses, stores, and protects your personal information while you use our services."
        />

        <section className="landing-section landing-section--privacy">
          <div className="content-container">
            <article className="privacy-policy-card" aria-labelledby="privacy-policy-title">
              <p className="privacy-policy-card__kicker">GLOBAL VISAS PRIVACY AND POLICY</p>
              <h2 id="privacy-policy-title">Privacy Policy</h2>
              <p className="privacy-policy-card__effective-date">
                <strong>Effective Date:</strong> <em>Jan 10 2025</em>
              </p>
              <p>
                GLOBAL VISAS Pty Ltd (&ldquo;Global Visas&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to
                protecting your privacy. This Privacy Policy explains how we collect, use, store, and disclose your
                personal information when you access or use our website and services (collectively, the
                &ldquo;Service&rdquo;). By using our Service, you agree to the practices described in this Policy.
              </p>

              <div className="privacy-policy-card__sections">
                {sections.map((section) => (
                  <section key={section.title} className="privacy-policy-card__section">
                    <h2>{section.title}</h2>
                    {section.intro ? <p>{section.intro}</p> : null}
                    {'points' in section && section.points ? (
                      <div className="privacy-policy-card__subsections">
                        {section.points.map((point) => (
                          <div key={point.heading}>
                            <h3>{point.heading}</h3>
                            <ul>
                              {point.items.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {'bullets' in section && section.bullets ? (
                      <ul>
                        {section.bullets.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {'outro' in section && section.outro ? <p>{section.outro}</p> : null}
                  </section>
                ))}
              </div>
            </article>
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
