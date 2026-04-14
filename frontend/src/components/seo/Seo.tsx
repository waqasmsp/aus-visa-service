import { useEffect } from 'react';
import { buildCanonicalUrl, defaultSeo, siteUrl } from '../../config/seo';

type SeoType = 'website' | 'article';

type SeoProps = {
  title?: string;
  description?: string;
  keywords?: string[];
  pathname: string;
  noIndex?: boolean;
  type?: SeoType;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalOverride?: string;
  noArchive?: boolean;
};

const upsertMeta = (selector: string, attributes: Record<string, string>): void => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value);
  });
};

const removeNode = (selector: string): void => {
  document.head.querySelector(selector)?.remove();
};

const upsertLink = (selector: string, attributes: Record<string, string>): void => {
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value);
  });
};

const upsertJsonLd = (id: string, payload: object): void => {
  let element = document.head.querySelector<HTMLScriptElement>(`script[data-seo-id="${id}"]`);
  if (!element) {
    element = document.createElement('script');
    element.type = 'application/ld+json';
    element.setAttribute('data-seo-id', id);
    document.head.appendChild(element);
  }
  element.text = JSON.stringify(payload);
};

export function Seo({
  title,
  description,
  keywords,
  pathname,
  noIndex = false,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
  ogImage,
  twitterCard,
  canonicalOverride,
  noArchive = false
}: SeoProps) {
  useEffect(() => {
    const pageTitle = title ?? defaultSeo.title;
    const pageDescription = description ?? defaultSeo.description;
    const pageKeywords = (keywords ?? defaultSeo.keywords).join(', ');
    const canonical = buildCanonicalUrl(canonicalOverride ?? pathname);
    const robotsIndexing = noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
    const robots = noArchive ? `${robotsIndexing}, noarchive` : robotsIndexing;
    const pageTwitterCard = twitterCard ?? (noIndex ? 'summary' : defaultSeo.twitterCard);
    const pageImage = ogImage ?? defaultSeo.image;

    document.documentElement.lang = 'en';
    document.title = pageTitle;

    upsertMeta('meta[name="description"]', { name: 'description', content: pageDescription });
    upsertMeta('meta[name="keywords"]', { name: 'keywords', content: pageKeywords });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    upsertMeta('meta[name="googlebot"]', { name: 'googlebot', content: robots });

    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonical });

    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: defaultSeo.siteName });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: pageDescription });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: pageImage });

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: pageTwitterCard });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: pageDescription });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: pageImage });

    if (type === 'article') {
      if (publishedTime) upsertMeta('meta[property="article:published_time"]', { property: 'article:published_time', content: publishedTime });
      if (modifiedTime) upsertMeta('meta[property="article:modified_time"]', { property: 'article:modified_time', content: modifiedTime });
      if (author) upsertMeta('meta[property="article:author"]', { property: 'article:author', content: author });
      if (section) upsertMeta('meta[property="article:section"]', { property: 'article:section', content: section });
      (tags ?? []).forEach((tag, index) => {
        upsertMeta(`meta[property="article:tag"][data-seo-tag="${index}"]`, {
          property: 'article:tag',
          content: tag,
          'data-seo-tag': String(index)
        });
      });

      const extraTagNodes = document.head.querySelectorAll('meta[property="article:tag"][data-seo-tag]');
      extraTagNodes.forEach((node) => {
        const currentIndex = Number(node.getAttribute('data-seo-tag'));
        if (Number.isNaN(currentIndex) || currentIndex >= (tags?.length ?? 0)) {
          node.remove();
        }
      });

      upsertJsonLd('article', {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: pageTitle,
        description: pageDescription,
        author: {
          '@type': 'Person',
          name: author ?? defaultSeo.siteName
        },
        image: pageImage,
        datePublished: publishedTime,
        dateModified: modifiedTime ?? publishedTime,
        mainEntityOfPage: canonical,
        articleSection: section,
        keywords: tags?.join(', ')
      });

      upsertJsonLd('breadcrumbs', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Blog',
            item: `${siteUrl}/blog`
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: pageTitle,
            item: canonical
          }
        ]
      });
    } else {
      removeNode('meta[property="article:published_time"]');
      removeNode('meta[property="article:modified_time"]');
      removeNode('meta[property="article:author"]');
      removeNode('meta[property="article:section"]');
      document.head.querySelectorAll('meta[property="article:tag"]').forEach((node) => node.remove());
      removeNode('script[data-seo-id="article"]');
      removeNode('script[data-seo-id="breadcrumbs"]');
    }

    upsertJsonLd('website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: defaultSeo.siteName,
      url: siteUrl
    });
  }, [author, canonicalOverride, description, keywords, modifiedTime, noArchive, noIndex, ogImage, pathname, publishedTime, section, tags, title, twitterCard, type]);

  return null;
}
