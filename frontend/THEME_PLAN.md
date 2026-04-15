# Theme Engineering Note (Milestone)

## Default Palette (Current Baseline)

These defaults are the rollback-safe palette and map to `defaultThemeSettings`:

- **App background**: `var(--theme-hero-family-muted, var(--color-bg, #f8fafc))`
- **Header background**: soft blue layered linear gradients
- **Button background**: `var(--gradient-accent, linear-gradient(135deg, var(--color-brand-cyan-500, #0ea5e9), var(--color-primary, #1d4ed8)))`
- **Button text**: `var(--color-neutral-0, #ffffff)`
- **Footer background**: dark navy gradient with cyan/blue radial accents
- **Header text check target**: `#1e3a5f`
- **Footer text check target**: `#334155`

Reference implementation lives in `frontend/src/utils/themeSettings.ts` and `frontend/src/styles/tokens.css`.

## Validation + Rollback Behavior

1. Theme input values are sanitized before persistence/application.
2. Invalid or unsafe color strings are replaced with the corresponding default token.
3. If contrast checks fail for required pairs (minimum **4.5:1**), settings cannot be saved until fixed.
4. If parsing/contrast cannot be auto-verified (e.g. complex `var()` or gradient-only values), inline warnings are shown and manual QA is required.
5. **Reset Theme Defaults** and **Reset to Default** both provide deterministic rollback to `defaultThemeSettings`.

## QA Checklist

### 1) Public pages

- [ ] Landing page: hero, feature bands, CTA readability.
- [ ] Visa details page: body copy contrast and CTA/button text readability.
- [ ] Pricing page: card surfaces, featured plan emphasis, button labels.
- [ ] Contact page: form labels/placeholders, submit/error/success states.
- [ ] Blog listing/detail pages: headings, metadata, links, and code/content blocks.

### 2) Header / nav / button / footer states

- [ ] Header default state (desktop + mobile) has legible nav links.
- [ ] Header hover/active states remain distinguishable.
- [ ] Primary buttons: default, hover, focus-visible, disabled (where present).
- [ ] Secondary/ghost buttons: default + hover contrast.
- [ ] Footer text, link, and hover states are readable against footer background.

### 3) Dashboard unaffected areas

- [ ] Blog editor/review workflows unaffected by theme save/reset.
- [ ] User/admin tables and status badges keep existing readability.
- [ ] Dashboard auth/messages panels render as before.
- [ ] No regressions in non-theme settings save/reset behavior.
- [ ] Manager/user roles still cannot access admin theme controls.

