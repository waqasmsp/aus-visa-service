import { useEffect } from 'react';
import { buildCanonicalUrl, defaultSeo, siteUrl } from '../../config/seo';

type SeoProps = {
  title?: string;
  description?: string;
  keywords?: string[];
  pathname: string;
  noIndex?: boolean;
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

export function Seo({ title, description, keywords, pathname, noIndex = false }: SeoProps) {
  useEffect(() => {
    const pageTitle = title ?? defaultSeo.title;
    const pageDescription = description ?? defaultSeo.description;
    const pageKeywords = (keywords ?? defaultSeo.keywords).join(', ');
    const canonical = buildCanonicalUrl(pathname);
    const robots = noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
    const twitterCard = noIndex ? 'summary' : 'summary_large_image';

    document.documentElement.lang = 'en';
    document.title = pageTitle;

    upsertMeta('meta[name="description"]', { name: 'description', content: pageDescription });
    upsertMeta('meta[name="keywords"]', { name: 'keywords', content: pageKeywords });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    upsertMeta('meta[name="googlebot"]', { name: 'googlebot', content: robots });

    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonical });

    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: defaultSeo.siteName });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: pageDescription });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: defaultSeo.image });

    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: twitterCard });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: pageDescription });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: defaultSeo.image });

    upsertJsonLd('website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: defaultSeo.siteName,
      url: siteUrl
    });
  }, [description, keywords, noIndex, pathname, title]);

  return null;
}
