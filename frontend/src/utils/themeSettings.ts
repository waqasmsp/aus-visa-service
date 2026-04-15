export const THEME_SETTINGS_STORAGE_KEY = 'aus-visa-theme-settings';

export type ThemeSettings = {
  global: {
    appBackground: string;
    headerBackground: string;
    buttonBackground: string;
    buttonText: string;
    footerBackground: string;
  };
  sections: {
    enableHeroBackground: boolean;
    pageHeroBackground: string;
    enableApplicationSectionBackground: boolean;
    applicationSectionBackground: string;
  };
};

export const defaultThemeSettings: ThemeSettings = {
  global: {
    appBackground: 'var(--theme-hero-family-muted, var(--color-bg, #f8fafc))',
    headerBackground:
      'linear-gradient(110deg, var(--color-primary-tint-10, rgb(37 99 235 / 0.1)) 0 58%, rgb(15 23 42 / 0.03) 58% 100%), linear-gradient(180deg, var(--color-primary-tint-20, rgb(37 99 235 / 0.2)) 0%, var(--color-primary-tint-5, rgb(37 99 235 / 0.05)) 70%, transparent 100%)',
    buttonBackground: 'var(--gradient-accent, linear-gradient(135deg, var(--color-brand-cyan-500, #0ea5e9), var(--color-primary, #1d4ed8)))',
    buttonText: 'var(--color-neutral-0, #ffffff)',
    footerBackground:
      'radial-gradient(circle at 12% 10%, rgb(37 99 235 / 0.16), transparent 38%), radial-gradient(circle at 88% 90%, var(--color-cyan-tint-10, rgb(14 165 233 / 0.1)), transparent 35%), linear-gradient(180deg, #071326 0%, #04101f 100%)'
  },
  sections: {
    enableHeroBackground: false,
    pageHeroBackground:
      'linear-gradient(110deg, rgb(15 23 42 / 0.03) 0 42%, var(--color-primary-tint-10, rgb(37 99 235 / 0.1)) 42% 100%), linear-gradient(180deg, var(--color-primary-tint-20, rgb(37 99 235 / 0.2)) 0%, var(--color-primary-tint-5, rgb(37 99 235 / 0.05)) 70%, transparent 100%)',
    enableApplicationSectionBackground: false,
    applicationSectionBackground: 'var(--theme-hero-family-muted, var(--theme-section-bg-alt))'
  }
};

const sanitizeTextInput = (value: unknown, fallback: string) => (typeof value === 'string' && value.trim().length ? value.trim() : fallback);

const parseThemeSettings = (input: unknown): ThemeSettings => {
  const source = (typeof input === 'object' && input ? input : {}) as Partial<ThemeSettings>;
  const global = (source.global ?? {}) as Partial<ThemeSettings['global']>;
  const sections = (source.sections ?? {}) as Partial<ThemeSettings['sections']>;

  return {
    global: {
      appBackground: sanitizeTextInput(global.appBackground, defaultThemeSettings.global.appBackground),
      headerBackground: sanitizeTextInput(global.headerBackground, defaultThemeSettings.global.headerBackground),
      buttonBackground: sanitizeTextInput(global.buttonBackground, defaultThemeSettings.global.buttonBackground),
      buttonText: sanitizeTextInput(global.buttonText, defaultThemeSettings.global.buttonText),
      footerBackground: sanitizeTextInput(global.footerBackground, defaultThemeSettings.global.footerBackground)
    },
    sections: {
      enableHeroBackground: false,
      pageHeroBackground: sanitizeTextInput(sections.pageHeroBackground, defaultThemeSettings.sections.pageHeroBackground),
      enableApplicationSectionBackground: Boolean(sections.enableApplicationSectionBackground),
      applicationSectionBackground: sanitizeTextInput(
        sections.applicationSectionBackground,
        defaultThemeSettings.sections.applicationSectionBackground
      )
    }
  };
};

export const loadThemeSettings = (): ThemeSettings => {
  if (typeof window === 'undefined') {
    return defaultThemeSettings;
  }

  try {
    const raw = window.localStorage.getItem(THEME_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return defaultThemeSettings;
    }
    return parseThemeSettings(JSON.parse(raw));
  } catch {
    return defaultThemeSettings;
  }
};

export const saveThemeSettings = (settings: ThemeSettings) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(THEME_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

export const applyThemeSettings = (settings: ThemeSettings) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty('--theme-app-bg', settings.global.appBackground);
  root.style.setProperty('--theme-header-bg', settings.global.headerBackground);
  root.style.setProperty('--theme-button-bg', settings.global.buttonBackground);
  root.style.setProperty('--theme-button-text', settings.global.buttonText);
  root.style.setProperty('--theme-footer-bg', settings.global.footerBackground);

  if (settings.sections.enableApplicationSectionBackground) {
    root.style.setProperty('--theme-application-surface', settings.sections.applicationSectionBackground);
  } else {
    root.style.removeProperty('--theme-application-surface');
  }

  if (settings.sections.enableHeroBackground) {
    root.style.setProperty('--theme-page-hero-bg', settings.sections.pageHeroBackground);
  } else {
    root.style.removeProperty('--theme-page-hero-bg');
  }
};
