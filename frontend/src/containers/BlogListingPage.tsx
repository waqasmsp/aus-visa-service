import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { NewsletterSignup } from '../components/landing/NewsletterSignup';
import { VisiaChat } from '../components/landing/VisiaChat';
import { PageHero } from '../components/primitives/PageHero';
import { landingContent } from '../constants/landingContent';

type BlogListingPageProps = {
  pathname: string;
};

type BlogListItem = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readingTime: string;
};

const blogPosts: BlogListItem[] = [
  {
    slug: 'australia-visitor-visa-subclass-600-document-checklist',
    title: 'Australia Visitor Visa (Subclass 600): Document Checklist for Faster Review',
    excerpt: 'A practical checklist to help you submit complete, consistent, and compliant visitor visa documentation.',
    category: 'Visitor Visa',
    tags: ['Subclass 600', 'Checklist'],
    publishedAt: 'March 20, 2026',
    readingTime: '7 min read'
  },
  {
    slug: 'eta-601-vs-evisitor-651-which-one-to-choose',
    title: 'ETA 601 vs eVisitor 651: Which Australian Travel Visa Should You Choose?',
    excerpt: 'Understand eligibility, validity, and travel use-cases so you can choose the right short-stay pathway.',
    category: 'Travel Planning',
    tags: ['ETA 601', 'eVisitor 651'],
    publishedAt: 'March 12, 2026',
    readingTime: '6 min read'
  },
  {
    slug: 'how-to-write-a-strong-genuine-temporary-entrant-statement',
    title: 'How to Write a Strong Genuine Temporary Entrant Statement',
    excerpt: 'Clear writing framework and common pitfalls to avoid when preparing your application narrative.',
    category: 'Application Tips',
    tags: ['GTE', 'Best Practices'],
    publishedAt: 'March 4, 2026',
    readingTime: '8 min read'
  },
  {
    slug: 'common-reasons-visitor-visas-are-delayed',
    title: '5 Common Reasons Visitor Visa Applications Are Delayed',
    excerpt: 'Learn the most frequent causes of processing delays and proactive steps that reduce rework.',
    category: 'Policy & Process',
    tags: ['Processing', 'Avoid Delays'],
    publishedAt: 'February 27, 2026',
    readingTime: '5 min read'
  }
];

export function BlogListingPage({ pathname }: BlogListingPageProps) {
  const { brandName, navItems, loginCta, newsletter, footer } = landingContent;
  const featuredPost = blogPosts[0];
  const latestPosts = blogPosts.slice(1);

  const openApplicationPage = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/application');
    }
  };

  return (
    <div className="landing-page blog-page">
      <section className="landing-section landing-section--header">
        <div className="content-container">
          <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} pathname={pathname} />
        </div>
      </section>

      <main className="landing-main blog-main">
        <PageHero
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Blog' }]}
          title="Visa guidance, updates, and practical travel insights"
          description="Explore expert-written resources for planning, preparing, and submitting stronger visa applications."
        />

        <section className="landing-section blog-hero-band">
          <div className="content-container">
            <div className="blog-hero-panel">
              <p className="blog-kicker">Featured this week</p>
              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.excerpt}</p>
              <div className="blog-meta-row">
                <span>{featuredPost.category}</span>
                <span>{featuredPost.publishedAt}</span>
                <span>{featuredPost.readingTime}</span>
              </div>
              <a className="blog-link-cta" href={`/blog/${featuredPost.slug}`}>
                Read featured article
              </a>
            </div>
          </div>
        </section>

        <section className="landing-section blog-listing-section" aria-label="Latest blog posts">
          <div className="content-container">
            <div className="blog-section-header">
              <h2>Latest articles</h2>
              <p>Stay up to date with policy updates, application strategy, and travel preparation guidance.</p>
            </div>

            <div className="blog-card-grid">
              {latestPosts.map((post) => (
                <article key={post.slug} className="blog-card">
                  <div className="blog-card__meta">
                    <span>{post.category}</span>
                    <span>{post.publishedAt}</span>
                    <span>{post.readingTime}</span>
                  </div>
                  <h3>
                    <a href={`/blog/${post.slug}`}>{post.title}</a>
                  </h3>
                  <p>{post.excerpt}</p>
                  <div className="blog-tag-row">
                    {post.tags.map((tag) => (
                      <a key={tag} href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}>
                        #{tag}
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="blog-load-more-wrap">
              <button type="button" className="blog-load-more-btn">
                Load more posts
              </button>
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
