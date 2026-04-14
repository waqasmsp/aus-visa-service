import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { NewsletterSignup } from '../components/landing/NewsletterSignup';
import { VisiaChat } from '../components/landing/VisiaChat';
import { landingContent } from '../constants/landingContent';
import { useBlogPost } from '../hooks/useBlogPost';

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
  const slug = pathname.toLowerCase().replace(/\/+$/, '').replace('/blog/', '');
  const { post, loading, error } = useBlogPost(slug);

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
              <span>{post?.title ?? 'Article'}</span>
            </nav>

            {loading ? <p className="dashboard-panel__note">Loading article...</p> : null}
            {error ? <p className="dashboard-auth__message is-error">{error}</p> : null}

            {!loading && !error && post ? (
              <>
                <header className="blog-detail-header">
                  <p className="blog-kicker">{post.categoryIds[0] ?? 'Blog'} · Updated {new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <h1>{post.title}</h1>
                  <p className="blog-detail-excerpt">{post.excerpt}</p>
                  <div className="blog-meta-row">
                    <span>By {post.authorName}</span>
                    <span>{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span>{post.readingTimeMinutes ?? 5} min read</span>
                  </div>
                </header>

                <figure className="blog-featured-image" aria-label="Featured article image">
                  <div className="blog-featured-image__placeholder" aria-hidden="true" />
                  <figcaption>{post.imageAlt ?? 'Article image'}</figcaption>
                </figure>

                <article className="blog-article-content">
                  {post.contentHtml ? <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} /> : <p>{post.excerpt}</p>}
                </article>
              </>
            ) : null}

            {!loading && !error && !post ? (
              <article className="dashboard-panel">
                <p className="dashboard-panel__note">This post is unavailable or has not been published yet.</p>
                <a href="/blog" className="dashboard-primary-link">Return to blog listing</a>
              </article>
            ) : null}
          </div>
        </section>

        <section className="landing-section blog-related-section" aria-label="Related posts">
          <div className="content-container">
            <div className="blog-section-header">
              <h2>Related articles</h2>
            </div>
            <div className="blog-related-grid">
              {relatedPosts.map((postItem) => (
                <article key={postItem.href} className="blog-related-card">
                  <h3>
                    <a href={postItem.href}>{postItem.title}</a>
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
