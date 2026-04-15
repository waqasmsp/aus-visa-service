const DISALLOWED_TOKENS_REGEX = /[;{}<>"'`\\]/;
const ALLOWED_CHARS_REGEX = /^[a-z0-9#(),.%/\-\s_]+$/i;
const HEX_COLOR_REGEX = /^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;
const RGB_COLOR_REGEX = /^rgba?\(/i;
const HSL_COLOR_REGEX = /^hsla?\(/i;
const CSS_VAR_REGEX = /^var\(/i;
const GRADIENT_REGEX = /^(linear-gradient|radial-gradient|conic-gradient)\(/i;
const CSS_COLOR_FN_REGEX = /^color\(/i;

const NAMED_COLOR_KEYWORDS: Record<string, [number, number, number]> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  navy: [0, 0, 128],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  transparent: [255, 255, 255]
};

export type SanitizedColorResult = {
  sanitized: string;
  isValid: boolean;
  usedFallback: boolean;
  reason?: string;
};

export type ContrastWarning = {
  id: 'button' | 'header' | 'footer';
  label: string;
  message: string;
  ratio: number | null;
  severity: 'warning' | 'error';
};

const hasBalancedParentheses = (value: string) => {
  let count = 0;
  for (const char of value) {
    if (char === '(') {
      count += 1;
    } else if (char === ')') {
      count -= 1;
      if (count < 0) {
        return false;
      }
    }
  }
  return count === 0;
};

const normalizeValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const isLikelySafeCssColorValue = (value: string) => {
  if (!value || value.length > 260) {
    return false;
  }

  if (DISALLOWED_TOKENS_REGEX.test(value) || !ALLOWED_CHARS_REGEX.test(value)) {
    return false;
  }

  if (!hasBalancedParentheses(value)) {
    return false;
  }

  return (
    HEX_COLOR_REGEX.test(value) ||
    RGB_COLOR_REGEX.test(value) ||
    HSL_COLOR_REGEX.test(value) ||
    CSS_VAR_REGEX.test(value) ||
    GRADIENT_REGEX.test(value) ||
    CSS_COLOR_FN_REGEX.test(value) ||
    /^[a-z]+$/i.test(value)
  );
};

export const sanitizeThemeColorValue = (value: unknown, fallback: string): SanitizedColorResult => {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return {
      sanitized: fallback,
      isValid: false,
      usedFallback: true,
      reason: 'Empty value replaced with default.'
    };
  }

  if (!isLikelySafeCssColorValue(normalized)) {
    return {
      sanitized: fallback,
      isValid: false,
      usedFallback: true,
      reason: 'Invalid CSS color token replaced with default.'
    };
  }

  return {
    sanitized: normalized,
    isValid: true,
    usedFallback: false
  };
};

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const parseHexColor = (value: string): [number, number, number] | null => {
  const hex = value.replace('#', '').trim();

  if (hex.length === 3 || hex.length === 4) {
    const expanded = hex
      .slice(0, 3)
      .split('')
      .map((chunk) => chunk + chunk)
      .join('');
    const asInt = Number.parseInt(expanded, 16);
    if (Number.isNaN(asInt)) {
      return null;
    }

    return [(asInt >> 16) & 255, (asInt >> 8) & 255, asInt & 255];
  }

  if (hex.length === 6 || hex.length === 8) {
    const asInt = Number.parseInt(hex.slice(0, 6), 16);
    if (Number.isNaN(asInt)) {
      return null;
    }

    return [(asInt >> 16) & 255, (asInt >> 8) & 255, asInt & 255];
  }

  return null;
};

const parseRgbColor = (value: string): [number, number, number] | null => {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }

  const [r, g, b] = match[1].split(/[,/\s]+/).filter(Boolean).slice(0, 3).map((part) => Number.parseFloat(part));

  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return [clampChannel(r), clampChannel(g), clampChannel(b)];
};

const hueToRgb = (p: number, q: number, t: number) => {
  let hue = t;
  if (hue < 0) {
    hue += 1;
  }
  if (hue > 1) {
    hue -= 1;
  }
  if (hue < 1 / 6) {
    return p + (q - p) * 6 * hue;
  }
  if (hue < 1 / 2) {
    return q;
  }
  if (hue < 2 / 3) {
    return p + (q - p) * (2 / 3 - hue) * 6;
  }
  return p;
};

const parseHslColor = (value: string): [number, number, number] | null => {
  const match = value.match(/hsla?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }

  const [hRaw, sRaw, lRaw] = match[1].split(/[,/\s]+/).filter(Boolean).slice(0, 3);
  const h = Number.parseFloat(hRaw);
  const s = Number.parseFloat(sRaw.replace('%', '')) / 100;
  const l = Number.parseFloat(lRaw.replace('%', '')) / 100;

  if ([h, s, l].some((part) => Number.isNaN(part))) {
    return null;
  }

  if (s === 0) {
    const gray = clampChannel(l * 255);
    return [gray, gray, gray];
  }

  const hue = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    clampChannel(hueToRgb(p, q, hue + 1 / 3) * 255),
    clampChannel(hueToRgb(p, q, hue) * 255),
    clampChannel(hueToRgb(p, q, hue - 1 / 3) * 255)
  ];
};

const extractFirstConcreteColor = (value: string): string | null => {
  const match = value.match(/#[\da-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b[a-z]+\b/i);
  return match ? match[0] : null;
};

const parseColorToRgb = (value: string): [number, number, number] | null => {
  const normalized = value.trim().toLowerCase();

  if (HEX_COLOR_REGEX.test(normalized)) {
    return parseHexColor(normalized);
  }

  if (RGB_COLOR_REGEX.test(normalized)) {
    return parseRgbColor(normalized);
  }

  if (HSL_COLOR_REGEX.test(normalized)) {
    return parseHslColor(normalized);
  }

  if (normalized in NAMED_COLOR_KEYWORDS) {
    return NAMED_COLOR_KEYWORDS[normalized];
  }

  return null;
};

const relativeLuminance = ([r, g, b]: [number, number, number]): number => {
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (a: [number, number, number], b: [number, number, number]): number => {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number.parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
};

const assessContrastPair = ({
  id,
  label,
  background,
  foreground,
  minRatio
}: {
  id: ContrastWarning['id'];
  label: string;
  background: string;
  foreground: string;
  minRatio: number;
}): ContrastWarning | null => {
  const bgSample = extractFirstConcreteColor(background);
  const fgSample = extractFirstConcreteColor(foreground);

  if (!bgSample || !fgSample) {
    return {
      id,
      label,
      ratio: null,
      severity: 'warning',
      message: `${label} contrast could not be auto-verified. Use a concrete color to validate.`
    };
  }

  const bgRgb = parseColorToRgb(bgSample);
  const fgRgb = parseColorToRgb(fgSample);
  if (!bgRgb || !fgRgb) {
    return {
      id,
      label,
      ratio: null,
      severity: 'warning',
      message: `${label} contrast could not be auto-verified. Supported inputs: hex, rgb(), hsl(), named colors.`
    };
  }

  const ratio = contrastRatio(bgRgb, fgRgb);
  if (ratio < minRatio) {
    return {
      id,
      label,
      ratio,
      severity: 'error',
      message: `${label} contrast is ${ratio}:1 (minimum ${minRatio}:1).`
    };
  }

  return null;
};

export const getThemeContrastWarnings = ({
  buttonBackground,
  buttonText,
  headerBackground,
  headerText,
  footerBackground,
  footerText,
  minRatio = 4.5
}: {
  buttonBackground: string;
  buttonText: string;
  headerBackground: string;
  headerText: string;
  footerBackground: string;
  footerText: string;
  minRatio?: number;
}): ContrastWarning[] => {
  return [
    assessContrastPair({
      id: 'button',
      label: 'Button text vs background',
      background: buttonBackground,
      foreground: buttonText,
      minRatio
    }),
    assessContrastPair({
      id: 'header',
      label: 'Header text vs background',
      background: headerBackground,
      foreground: headerText,
      minRatio
    }),
    assessContrastPair({
      id: 'footer',
      label: 'Footer text vs background',
      background: footerBackground,
      foreground: footerText,
      minRatio
    })
  ].filter((warning): warning is ContrastWarning => Boolean(warning));
};
