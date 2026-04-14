const ALLOWED_UTM_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid'
] as const;

const toAbsolute = (value: string): URL => {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://ausvisaservice.com';
  return new URL(value, base);
};

export const sanitizeTrackingParams = (search: string): URLSearchParams => {
  const source = new URLSearchParams(search);
  const safe = new URLSearchParams();

  for (const param of ALLOWED_UTM_PARAMS) {
    const value = source.get(param);
    if (value) {
      safe.set(param, value);
    }
  }

  return safe;
};

export const buildUtmSafeHref = (targetHref: string, sourceSearch?: string): string => {
  const url = toAbsolute(targetHref);
  const incoming = sanitizeTrackingParams(sourceSearch ?? (typeof window !== 'undefined' ? window.location.search : ''));

  incoming.forEach((value, key) => {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  });

  return `${url.pathname}${url.search}${url.hash}`;
};
