# Frontend Asset Sources & Licenses

This project now serves all landing-page imagery/icons from local files in `frontend/src/assets/`.

## Custom Brand + Illustration Assets

The following assets were created specifically for this repository by the development team and are **not** copies of any trademarked logo.

| Asset file | Type | Source | License |
|---|---|---|---|
| `src/assets/logo-custom-variant.svg` | Brand mark | Original in-repo artwork | CC BY 4.0 |
| `src/assets/hero-travel-illustration.svg` | Travel-themed illustration | Original in-repo artwork | CC BY 4.0 |

## Neutral Icon Set

These neutral icons are original in-repo vector assets used for checkmarks, ratings, and social-link actions.

| Asset file | Purpose | Source | License |
|---|---|---|---|
| `src/assets/icon-check-neutral.svg` | Comparison checklist bullets | Original in-repo artwork | CC BY 4.0 |
| `src/assets/icon-star-neutral.svg` | Testimonial rating stars | Original in-repo artwork | CC BY 4.0 |
| `src/assets/icon-social-link.svg` | Generic website/social link | Original in-repo artwork | CC BY 4.0 |
| `src/assets/icon-social-mail.svg` | Generic email/social link | Original in-repo artwork | CC BY 4.0 |
| `src/assets/icon-social-chat.svg` | Generic community/social link | Original in-repo artwork | CC BY 4.0 |

## Notes

- All referenced assets are stored locally and imported via component code; no external image hotlinks are used for these UI elements.
- Attribution requirement for CC BY 4.0 is satisfied by retaining this file in the repository.

## Brand Color Usage Rules

Use semantic tokens from `src/styles/tokens.css` as the single source of truth for all product UI colors.

### Required semantic tokens

- `--color-primary`, `--color-primary-hover`
- `--color-accent`
- `--color-bg`, `--color-surface`, `--color-text`
- `--color-success`, `--color-warning`, `--color-border`

### Do ✅

- Use semantic tokens in component and page styles, e.g. `color: var(--color-text)` and `background: var(--color-surface)`.
- Use tint tokens (`*-tint-*`) for subtle backgrounds, overlays, and gradient starts.
- Use shade tokens (`*-shade-*`) for pressed states, focus rings, and high-contrast gradient ends.
- Prefer `--gradient-primary` / `--gradient-primary-soft` for branded visual treatments.

### Don’t ❌

- Don’t hard-code brand hex values directly in component styles (for example `#1d4ed8`, `#0ea5e9`, `#ef4444`).
- Don’t create one-off custom color variables inside feature components when a semantic token exists.
- Don’t mix unrelated hue families in the same component state model (e.g., warning UI using primary blue).

### Example

```css
/* ✅ Do */
.button-primary {
  background: var(--color-primary);
  color: var(--color-surface);
  border: 1px solid var(--color-primary-shade-20);
}
.button-primary:hover {
  background: var(--color-primary-hover);
}

/* ❌ Don't */
.button-primary {
  background: #1d4ed8;
  color: #fff;
  border: 1px solid #1e40af;
}
```
