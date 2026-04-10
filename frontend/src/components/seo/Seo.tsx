import { Helmet } from 'react-helmet-async';
import { buildCanonicalUrl, defaultSeo, siteUrl } from '../../config/seo';

type SeoProps = {
  title?: string;
  description?: string;
  keywords?: string[];
  pathname: string;
  noIndex?: boolean;
};

export function Seo({ title, description, keywords, pathname, noIndex = false }: SeoProps) {
  const pageTitle = title ?? defaultSeo.title;
  const pageDescription = description ?? defaultSeo.description;
  const pageKeywords = keywords ?? defaultSeo.keywords;
  const canonical = buildCanonicalUrl(pathname);
  const robots = noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  const twitterCard = noIndex ? 'summary' : 'summary_large_image';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: defaultSeo.siteName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/?query={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords.join(', ')} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={defaultSeo.siteName} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={defaultSeo.image} />

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={defaultSeo.image} />

      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
