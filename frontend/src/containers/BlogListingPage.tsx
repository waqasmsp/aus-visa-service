import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { NewsletterSignup } from '../components/landing/NewsletterSignup';
import { VisiaChat } from '../components/landing/VisiaChat';
import { PageHero } from '../components/primitives/PageHero';
import { landingContent } from '../constants/landingContent';
import { blogPosts, isPublishedPost } from '../config/blog';

type BlogListingPageProps = {
  pathname: string;
};

export function BlogListingPage({ pathname }: BlogListingPageProps) {
  const { brandName, navItems, loginCta, newsletter, footer } = landingContent;
  const publishedPosts = blogPosts.filter((post) => isPublishedPost(post));
  const featuredPost = publishedPosts[0];
  const latestPosts = publishedPosts.slice(1);

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
              <h2>{featuredPost?.title ?? 'Latest visa guidance'}</h2>
              <p>{featuredPost?.excerpt ?? 'Explore actionable guidance from our editorial team.'}</p>
              <div className="blog-meta-row">
                <span>{featuredPost?.category ?? 'Blog'}</span>
                <span>{featuredPost ? new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Updated weekly'}</span>
                <span>{featuredPost?.readingTime ?? '5 min read'}</span>
              </div>
              <a className="blog-link-cta" href={featuredPost ? `/blog/${featuredPost.slug}` : '/blog'}>
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
                    <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
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
