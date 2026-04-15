import type { ImgHTMLAttributes } from 'react';
import modelPassport from '../../model-passport.png';

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

const DEFAULT_WEBP_SOURCES: ResponsiveSource[] = [];

const DEFAULT_FALLBACK_SOURCES: ResponsiveSource[] = [
  {
    src: modelPassport,
    width: 400
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
  fallbackMimeType = 'image/png',
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
        {safeWebpSources.length > 0 ? <source type="image/webp" srcSet={buildSrcSet(safeWebpSources)} sizes={sizes} /> : null}
        <source type={fallbackMimeType} srcSet={buildSrcSet(safeFallbackSources)} sizes={sizes} />
        <img className="hero-illustration hero-illustration--photo" src={fallbackSrc} srcSet={buildSrcSet(safeFallbackSources)} sizes={sizes} alt={altText} loading={loading} />
      </picture>
    </div>
  );
}
