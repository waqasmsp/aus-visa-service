import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        foreground: 'var(--color-text)',
        border: 'var(--color-border)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)'
        },
        accent: {
          DEFAULT: 'var(--color-accent)'
        },
        muted: {
          DEFAULT: 'var(--color-neutral-100)',
          foreground: 'var(--color-neutral-600)'
        },
        surface: 'var(--color-surface)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--dashboard-semantic-danger-fg)'
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)'
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)'
      },
      fontFamily: {
        sans: ['var(--font-family-base)', 'Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)'
      },
      boxShadow: {
        focus: 'var(--dashboard-control-focus-ring)'
      }
    }
  },
  plugins: []
} satisfies Config;
