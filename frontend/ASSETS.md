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

## Hero Photo Slot Guidelines (Landing `HeroVisual`)

The landing hero now supports a photo slot intended for a **smiling person holding a passport or visa-related document with a USA-origin context**.

### Approved stock source

- Primary approved stock library: **Unsplash** (editorial + commercial friendly under the Unsplash License).
- Keep direct source attribution (photographer + image URL) in PR notes when replacing hero imagery.

### License checks (required before merge)

1. Verify the image page is on the approved provider (`unsplash.com`).
2. Confirm license terms permit product/commercial web usage.
3. Ensure there are no trademarked marks, government seals, or private personal data visible.
4. Record the license verification date in the PR description.

### Alt text requirements

- Every hero image must include descriptive alt text that identifies:
  - subject (person/traveler),
  - action (holding passport/visa document),
  - context (visa application/travel planning).
- Generic alt text such as `"hero image"`, `"person"`, or `"travel"` is not allowed.
- `HeroVisual` includes a default descriptive alt value and validates that supplied `alt` text is descriptive.

### Replacement procedure

1. Choose a compliant image from the approved source and download/crop for target breakpoints.
2. Export responsive variants in both **WebP** and fallback format (**JPEG/PNG**).
3. Update the `HeroVisual` source arrays (or pass custom `webpSources` / `fallbackSources` props).
4. Provide a descriptive `alt` override if the default alt no longer matches image content.
5. Run frontend build/tests and include visual verification in the PR.
