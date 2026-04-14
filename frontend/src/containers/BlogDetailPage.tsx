import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { NewsletterSignup } from '../components/landing/NewsletterSignup';
import { VisiaChat } from '../components/landing/VisiaChat';
import { landingContent } from '../constants/landingContent';

type BlogDetailPageProps = {
  pathname: string;
};

const relatedPosts = [
  {
    title: 'Supporting Documents That Improve Visitor Visa Confidence',
    href: '/blog/supporting-documents-that-improve-visitor-visa-confidence'
  },
  {
    title: 'Travel History: How to Present It Clearly in Your Application',
    href: '/blog/travel-history-how-to-present-it-clearly'
  },
  {
    title: 'How Financial Evidence Is Reviewed for Tourist Visas',
    href: '/blog/how-financial-evidence-is-reviewed-for-tourist-visas'
  }
];

export function BlogDetailPage({ pathname }: BlogDetailPageProps) {
  const { brandName, navItems, loginCta, newsletter, footer } = landingContent;

  const openApplicationPage = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/application');
    }
  };

  return (
    <div className="landing-page blog-page blog-detail-page">
      <section className="landing-section landing-section--header">
        <div className="content-container">
          <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} pathname={pathname} />
        </div>
      </section>

      <main className="landing-main blog-main">
        <section className="landing-section blog-detail-shell">
          <div className="content-container">
            <nav className="blog-breadcrumbs" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <span>/</span>
              <a href="/blog">Blog</a>
              <span>/</span>
              <span>Australia Visitor Visa Document Checklist</span>
            </nav>

            <header className="blog-detail-header">
              <p className="blog-kicker">Visitor Visa · Updated April 9, 2026</p>
              <h1>Australia Visitor Visa (Subclass 600): Document Checklist for Faster Review</h1>
              <p className="blog-detail-excerpt">
                Build a complete and consistent application packet with this practical checklist covering identity,
                finances, travel intent, and ties to your home country.
              </p>
              <div className="blog-meta-row">
                <span>By Global Visas Editorial Team</span>
                <span>April 9, 2026</span>
                <span>7 min read</span>
              </div>
            </header>

            <figure className="blog-featured-image" aria-label="Featured article image">
              <div className="blog-featured-image__placeholder" aria-hidden="true" />
              <figcaption>Organized documentation helps reduce avoidable review delays.</figcaption>
            </figure>

            <article className="blog-article-content">
              <p>
                A well-prepared Subclass 600 application is easier for case officers to assess and often reduces
                back-and-forth requests. The goal is not to submit more files, but to submit the right evidence in a
                clear format.
              </p>
              <h2>Start with identity and travel context</h2>
              <p>
                Ensure your passport, personal details, and travel purpose align across every uploaded document.
                Inconsistent naming, outdated IDs, or unclear itinerary notes can trigger unnecessary follow-ups.
              </p>
              <h2>Prove financial capacity with traceable evidence</h2>
              <p>
                Include recent bank statements, income proof, and supporting documents that explain major inflows or
                sponsor support. Keep all records current and legible.
              </p>
              <h2>Demonstrate strong ties to your home country</h2>
              <p>
                Employment letters, study enrollment, property records, and family commitments can strengthen your
                intent to return. Use concise cover notes when context is needed.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-section blog-related-section" aria-label="Related posts">
          <div className="content-container">
            <div className="blog-section-header">
              <h2>Related articles</h2>
            </div>
            <div className="blog-related-grid">
              {relatedPosts.map((post) => (
                <article key={post.href} className="blog-related-card">
                  <h3>
                    <a href={post.href}>{post.title}</a>
                  </h3>
                </article>
              ))}
            </div>
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

      <MobileBottomNav pathname={pathname} onApplyNow={openApplicationPage} />
      <VisiaChat />
    </div>
  );
}
