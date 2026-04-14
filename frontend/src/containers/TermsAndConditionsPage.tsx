import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { VisiaChat } from '../components/landing/VisiaChat';
import { landingContent } from '../constants/landingContent';

type TermsAndConditionsPageProps = {
  pathname: string;
};

type TermsSection = {
  title: string;
  intro?: string;
  bullets?: string[];
};

const sections: TermsSection[] = [
  {
    title: '1. Acceptance of Terms',
    intro:
      'By using our platform to prepare or submit visa applications, you confirm that you have read, understood, and agree to comply with these Terms and our Privacy Policy. You also acknowledge that these Terms form a legally binding agreement between you and Global Visas.'
  },
  {
    title: '2. Eligibility',
    intro:
      'The Service is intended for individuals who are at least 18 years old. If you are under 18, you may only use the Service with involvement and consent of a parent or legal guardian.'
  },
  {
    title: '3. Our Service',
    bullets: [
      'Global Visas provides an online, simplified visa preparation and submission platform to help users accurately complete and lodge visa applications with official authorities. The Service includes structured application forms, document checklists, guidance content, and submission tools.',
      'Important: We do not act as a government agency, immigration authority, or legal advisor. Use of our Service does not guarantee approval of any visa, entry permit, or travel document by any official authority.'
    ]
  },
  {
    title: '4. Your Information and Account',
    bullets: [
      'You agree to provide accurate, current, and complete information when using the Service.',
      'You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.',
      'You must immediately notify us if you suspect any unauthorized use of your account or information.'
    ]
  },
  {
    title: '5. Use of the Service',
    intro: 'You agree not to use the Service for any unlawful or prohibited purpose, including but not limited to:',
    bullets: [
      'Submitting inaccurate, fraudulent, or misleading information;',
      'Attempting to disrupt or interfere with the operation of the Service;',
      'Copying or reproducing Service content beyond personal use.'
    ]
  },
  {
    title: '6. Fees and Payment',
    intro:
      'Use of parts of the Service may require payment of fees. All fees are described on our website at the time of purchase. Payments are final unless otherwise stated in our Refund Policy.'
  },
  {
    title: '7. Refunds and Cancellations',
    bullets: [
      'Refunds are only provided where explicitly stated in our Refund Policy.',
      'Once an application is submitted to the relevant authority through our Service, it cannot be cancelled or refunded.',
      'Users are responsible for checking requirements and accuracy before submitting applications.'
    ]
  },
  {
    title: '8. Limitation of Liability',
    intro:
      'To the maximum extent permitted by law, Global Visas and its affiliates will not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Service, including but not limited to:',
    bullets: ['Loss of data or documents;', 'Loss of profits or opportunities;', 'Visa denial or delays by authorities.']
  },
  {
    title: '9. No Guarantees',
    intro:
      'While we provide tools and guidance to help you prepare accurate applications, the Service does not guarantee that any visa application will be accepted, approved, or processed in a specific timeframe by the relevant government or immigration authority.'
  },
  {
    title: '10. Intellectual Property',
    intro:
      'All content on the Site (text, graphics, logos, software, and materials) is owned by or licensed to Global Visas. You may only use such content as permitted by these Terms.'
  },
  {
    title: '11. Third-Party Links and Services',
    intro:
      'Our Service may contain links to third-party websites or services. We do not control these sites and are not responsible for their content, privacy practices, or availability. Links do not imply endorsement by Global Visas.'
  },
  {
    title: '12. User-Generated Content',
    intro: 'If you upload or submit documents through the Service:',
    bullets: [
      'You confirm that you have the right to provide the content;',
      'Global Visas may use the content solely to process your visa application;',
      'We do not claim ownership of your personal documents.'
    ]
  },
  {
    title: '13. Dispute Resolution',
    bullets: [
      'Any disputes arising from the use of the Service should first be addressed by contacting Global Visas via our support channels.',
      'If unresolved, disputes will be governed by the laws of Australia and must be resolved in Australian courts.',
      'You agree to attempt informal resolution before initiating legal action.'
    ]
  },
  {
    title: '14. Governing Law and Applicable Legislation',
    intro: 'These Terms and your use of the Service are governed by the laws of Australia. The following federal legislation may apply:',
    bullets: [
      'Competition and Consumer Act 2010 (Cth) — including the Australian Consumer Law, which protects consumers against unfair contract terms and guarantees service quality.',
      'Privacy Act 1988 (Cth) — governing collection, use, and storage of personal information (see our Privacy Policy).',
      'Electronic Transactions Act 1999 (Cth) — providing legal recognition for electronic contracts and signatures.'
    ]
  }
];

const navigateToApplication = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.location.assign('/application');
};

export function TermsAndConditionsPage({ pathname }: TermsAndConditionsPageProps) {
  const { brandName, navItems, loginCta, footer } = landingContent;

  return (
    <div className="landing-page privacy-page">
      <section className="landing-section landing-section--header">
        <div className="content-container">
          <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} pathname={pathname} />
        </div>
      </section>

      <main className="landing-main privacy-main">
        <section className="landing-section landing-section--privacy">
          <div className="content-container">
            <article className="privacy-policy-card" aria-labelledby="terms-and-conditions-title">
              <p className="privacy-policy-card__kicker">GLOBAL VISAS TERMS AND CONDITIONS</p>
              <h1 id="terms-and-conditions-title">Terms and Conditions</h1>
              <p className="privacy-policy-card__effective-date">
                <strong>Effective Date:</strong> <em>Jan 10 2025</em>
              </p>
              <p>
                Welcome to <strong>GLOBAL VISAS Pty Ltd</strong> (&ldquo;Global Visas&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
                &ldquo;our&rdquo;). These Terms and Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the{' '}
                <strong>Global Visas</strong> website, tools, and services (collectively, the &ldquo;Service&rdquo;). By
                accessing or using the Service, you agree to be bound by these Terms. If you do not agree with any
                part of these Terms, you must not use the Service.
              </p>

              <div className="privacy-policy-card__sections">
                {sections.map((section) => (
                  <section key={section.title} className="privacy-policy-card__section">
                    <h2>{section.title}</h2>
                    {section.intro ? <p>{section.intro}</p> : null}
                    {section.bullets ? (
                      <ul>
                        {section.bullets.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>

              <p>
                These laws are intended to ensure fair, transparent, and compliant business practices. Any provisions
                inconsistent with mandatory Australian law will be overridden to the extent required by law.
              </p>
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
