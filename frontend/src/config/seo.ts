const FALLBACK_SITE_URL = 'https://ausvisaservice.com';

export const siteUrl = (import.meta.env.VITE_SITE_URL ?? FALLBACK_SITE_URL).replace(/\/+$/, '');

export const privateRoutePrefixes = ['/admin', '/dashboard', '/user-dashboard', '/user', '/account', '/auth'];

export const isPrivateRoute = (pathname: string): boolean => {
  const normalized = pathname.toLowerCase();
  return privateRoutePrefixes.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
};

export const buildCanonicalUrl = (pathname: string): string => {
  const normalizedPath = pathname === '/' ? '' : pathname.replace(/\/+$/, '');
  return `${siteUrl}${normalizedPath}`;
};

export const defaultSeo = {
  siteName: 'AUS Visa Service',
  title: 'AUS Visa Service | Fast Australian Travel Visa Guidance',
  description:
    'Get guided support for Australian travel visa pathways with clear steps, fast processing help, and 24/7 assistance.',
  keywords: ['Australia visa', 'travel visa', 'visa application', 'AUS Visa Service', 'immigration support'],
  image: `${siteUrl}/og-image.svg`
};
