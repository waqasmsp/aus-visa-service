# UI Foundation Migration Plan

## Stack decision
- **Styling engine:** Tailwind CSS.
- **Accessible primitives:** Radix UI.
- **Variants and API consistency:** class-variance-authority (CVA).

This keeps component APIs small, composable, and themeable while allowing gradual migration from legacy CSS selectors.

## Foundation-first scope (phase 1)
Implement only shared primitives before touching page layouts:
1. `Button`
2. `Input`
3. `Select`
4. `Modal`
5. `Tabs`
6. `Table`

All new primitives live under `src/components/ui/` and are token-driven through Tailwind theme extension.

## Legacy bridge strategy
To avoid full rewrites, keep existing markup stable and map legacy selectors to utility-backed styles in `src/styles/legacy-bridge.css`:
- `.dashboard-primary-button`, `.dashboard-button` -> Tailwind button utilities
- `.dashboard-ghost-button` -> Tailwind outline button utilities
- `.dashboard-auth__input` and dashboard form controls -> Tailwind input utilities
- `.dashboard-table-wrap`, `.dashboard-table`, `.dashboard-panel` -> utility-backed container and surface styles

This lets old modules visually align with the new design system while migration proceeds module-by-module.

## Design token strategy
- Define tokens once in CSS custom properties (`tokens.css`).
- Map semantic tokens into Tailwind theme (`tailwind.config.ts`) for:
  - colors
  - radius
  - spacing
  - typography
- Use semantic class names (`bg-primary`, `text-foreground`, `border-border`) in primitives so future theme changes happen centrally.

## Migration rollout order
Migrate feature areas in this sequence:
1. **Pages**
2. **Users**
3. **Settings**
4. **Applications**
5. **Blogs**
6. **Chats**

For each module:
1. Replace core controls with primitives.
2. Keep legacy class names temporarily where needed for compatibility.
3. Remove legacy selectors once all consumers are migrated.
