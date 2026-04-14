import { useEffect, useState } from 'react';
import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { NewsletterSignup } from '../components/landing/NewsletterSignup';
import { VisiaChat } from '../components/landing/VisiaChat';
import { Card } from '../components/primitives/Card';
import { PageHero } from '../components/primitives/PageHero';
import { PrimaryButton } from '../components/primitives/PrimaryButton';
import { SectionContainer } from '../components/primitives/SectionContainer';
import { landingContent } from '../constants/landingContent';
import { useBlogFilters } from '../hooks/useBlogFilters';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { trackBlogEvent } from '../services/blogAnalyticsService';
import { listCategories } from '../services/blogService';
import type { BlogCategory } from '../types/blog';
import { buildUtmSafeHref } from '../utils/utm';

type BlogListingPageProps = {
  pathname: string;
};

export function BlogListingPage({ pathname }: BlogListingPageProps) {
  const { brandName, navItems, loginCta, newsletter, footer } = landingContent;
  const { filters, setFilter, resetFilters } = useBlogFilters();
  const { posts, total, hasNextPage, loading, error } = useBlogPosts(filters, 5);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  useEffect(() => {
    let active = true;

    listCategories()
      .then((items) => {
        if (!active) return;
        setCategories(items);
      })
      .catch(() => {
        if (!active) return;
        setCategories([]);
      });

    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    if (loading || error || posts.length === 0) return;

    trackBlogEvent('blog_list_impression', {
      metadata: {
        visiblePosts: posts.length,
        totalResults: total,
        page: filters.page,
        category: filters.category || 'all',
        tag: filters.tag || 'all'
      }
    });
  }, [error, filters.category, filters.page, filters.tag, loading, posts.length, total]);

  const featuredPosts = posts.slice(0, 3);
  const latestPosts = posts.slice(3);

  const openApplicationPage = () => {
    if (typeof window !== 'undefined') {
      window.location.assign(buildUtmSafeHref('/application'));
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

        <section className="landing-section blog-listing-section" aria-label="Blog filters">
          <div className="content-container">
            <SectionContainer className="blog-filters">
              <div className="blog-section-header">
                <h2>Find articles faster</h2>
                <p>Search and filter by category, tag, and page with URL-synced filters.</p>
              </div>

              <div className="blog-filter-row">
                <input
                  value={filters.q}
                  onChange={(event) => setFilter('q', event.target.value)}
                  placeholder="Search posts"
                  aria-label="Search blog posts"
                />
                <select value={filters.category} onChange={(event) => setFilter('category', event.target.value)} aria-label="Filter category">
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name.toLowerCase()}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input
                  value={filters.tag}
                  onChange={(event) => setFilter('tag', event.target.value)}
                  placeholder="Tag"
                  aria-label="Filter tag"
                />
                <PrimaryButton type="button" variant="outline" onClick={resetFilters}>
                  Clear filters
                </PrimaryButton>
              </div>
            </SectionContainer>
          </div>
        </section>

        {!loading && !error && featuredPosts.length > 0 ? (
          <section className="landing-section blog-hero-band">
            <div className="content-container">
              <p className="blog-kicker">Featured this week</p>
              <div className="blog-card-grid blog-featured-grid">
                {featuredPosts.map((post) => (
                  <Card key={post.slug} className="blog-card blog-featured-card">
                    <div className="blog-card-image-placeholder blog-card-image-placeholder--compact" aria-hidden="true" />
                    <div className="blog-card__meta">
                      <span>{post.categoryIds[0] ?? 'Blog'}</span>
                      <span>{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      <span>{post.readingTimeMinutes ?? 5} min read</span>
                    </div>
                    <h3>
                      <a href={buildUtmSafeHref(`/blog/${post.slug}`)}>{post.title}</a>
                    </h3>
                    <p>{post.excerpt}</p>
                  </Card>
                ))}
              </div>
              <div className="blog-featured-cta-wrap">
                <a className="blog-link-cta" href={buildUtmSafeHref('/blog')}>
                  View all blog articles
                </a>
              </div>
            </div>
          </section>
        ) : null}

        <section className="landing-section blog-listing-section" aria-label="Latest blog posts">
          <div className="content-container">
            <div className="blog-section-header">
              <h2>Latest articles</h2>
              <p>{total} result(s) found.</p>
            </div>

            {loading ? <p className="dashboard-panel__note">Loading blog posts...</p> : null}
            {error ? <p className="dashboard-auth__message is-error">{error}</p> : null}
            {!loading && !error && posts.length === 0 ? (
              <article className="dashboard-panel">
                <p className="dashboard-panel__note">No posts match your current filters.</p>
              </article>
            ) : null}

            {!loading && !error ? (
              <div className="blog-card-grid">
                {latestPosts.map((post) => (
                  <Card key={post.slug} className="blog-card">
                    <div className="blog-card-image-placeholder" aria-hidden="true" />
                    <div className="blog-card__meta">
                      <span>{post.categoryIds[0] ?? 'blog'}</span>
                      <span>{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      <span>{post.readingTimeMinutes ?? 5} min read</span>
                    </div>
                    <h3>
                      <a href={buildUtmSafeHref(`/blog/${post.slug}`)}>{post.title}</a>
                    </h3>
                    <p>{post.excerpt}</p>
                    <div className="blog-tag-row">
                      {post.tagIds.map((tag) => (
                        <a key={tag} href={buildUtmSafeHref(`/blog?tag=${encodeURIComponent(tag)}`)}>
                          #{tag}
                        </a>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ) : null}

            <div className="blog-load-more-wrap">
              <PrimaryButton type="button" variant="outline" className="blog-load-more-btn" disabled={loading || !hasNextPage} onClick={() => setFilter('page', filters.page + 1)}>
                {hasNextPage ? 'Load more posts' : 'No more posts'}
              </PrimaryButton>
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
