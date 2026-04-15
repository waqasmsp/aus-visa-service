import type { ImgHTMLAttributes } from 'react';

type ResponsiveSource = {
  src: string;
  width: number;
};

type HeroVisualProps = {
  alt?: string;
  className?: string;
  webpSources?: ResponsiveSource[];
  fallbackSources?: ResponsiveSource[];
  fallbackMimeType?: 'image/jpeg' | 'image/png';
  sizes?: string;
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading'];
  cutout?: boolean;
};

const DEFAULT_ALT_TEXT =
  'Smiling U.S. traveler holding passport and visa paperwork while preparing an Australian visa application.';

const DEFAULT_WEBP_SOURCES: ResponsiveSource[] = [
  {
    src: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&crop=faces&w=640&h=780&q=80&fm=webp',
    width: 640
  },
  {
    src: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&crop=faces&w=960&h=1170&q=80&fm=webp',
    width: 960
  }
];

const DEFAULT_FALLBACK_SOURCES: ResponsiveSource[] = [
  {
    src: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&crop=faces&w=640&h=780&q=80&fm=jpg',
    width: 640
  },
  {
    src: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&crop=faces&w=960&h=1170&q=80&fm=jpg',
    width: 960
  }
];

function buildSrcSet(sources: ResponsiveSource[]) {
  return sources
    .slice()
    .sort((a, b) => a.width - b.width)
    .map(({ src, width }) => `${src} ${width}w`)
    .join(', ');
}

function ensureDescriptiveAlt(altText: string) {
  const normalized = altText.trim();

  if (normalized.length < 30 || !normalized.includes(' ')) {
    throw new Error(
      'HeroVisual alt text must be descriptive (at least 30 characters and include clear subject context).'
    );
  }

  return normalized;
}

export function HeroVisual({
  alt,
  className,
  webpSources = DEFAULT_WEBP_SOURCES,
  fallbackSources = DEFAULT_FALLBACK_SOURCES,
  fallbackMimeType = 'image/jpeg',
  sizes = '(min-width: 1200px) 520px, (min-width: 768px) 42vw, 90vw',
  loading = 'lazy',
  cutout = true
}: HeroVisualProps) {
  const altText = ensureDescriptiveAlt((alt ?? DEFAULT_ALT_TEXT).trim());
  const safeWebpSources = webpSources.length > 0 ? webpSources : DEFAULT_WEBP_SOURCES;
  const safeFallbackSources = fallbackSources.length > 0 ? fallbackSources : DEFAULT_FALLBACK_SOURCES;
  const fallbackSrc = safeFallbackSources[safeFallbackSources.length - 1]?.src ?? safeFallbackSources[0]?.src;

  return (
    <div className={`hero-visual-slot${cutout ? ' hero-visual-slot--cutout' : ''}${className ? ` ${className}` : ''}`}>
      <picture>
        <source type="image/webp" srcSet={buildSrcSet(safeWebpSources)} sizes={sizes} />
        <source type={fallbackMimeType} srcSet={buildSrcSet(safeFallbackSources)} sizes={sizes} />
        <img className="hero-illustration hero-illustration--photo" src={fallbackSrc} srcSet={buildSrcSet(safeFallbackSources)} sizes={sizes} alt={altText} loading={loading} />
      </picture>
    </div>
  );
}
