# Dashboard keyboard-only navigation acceptance checklist

Use this checklist during QA for each dashboard module. Validation must be completed **without a mouse**.

## Shared checks (all modules)

- [ ] Initial focus lands on a meaningful control when the module route loads.
- [ ] All interactive controls are reachable with `Tab`/`Shift+Tab` in a logical order.
- [ ] Visible focus ring is shown for each focused control.
- [ ] All action buttons can be activated with `Enter` or `Space`.
- [ ] Selects, checkboxes, and text fields are operable from keyboard only.
- [ ] No keyboard trap exists outside expected modal/drawer focus trap behavior.

## Applications module

- [ ] Filter form can be fully completed and reset with keyboard only.
- [ ] Table row selection and bulk actions are operable with keyboard only.
- [ ] Application details drawer opens, traps focus, and closes with `Escape` and close button.
- [ ] Application editor modal announces title/description and returns focus to trigger on close.

## Users module

- [ ] Search + segment/status filters are keyboard operable.
- [ ] User row action menu is reachable and actions can be triggered by keyboard.
- [ ] Timeline drawer traps focus and supports close with `Escape`.
- [ ] User editor modal supports full keyboard completion and close semantics.

## Chats module

- [ ] Chat filters and assignee/status controls are fully keyboard operable.
- [ ] Thread drawer traps focus, includes accessible title/description, and closes via keyboard.
- [ ] Export, assign owner, and soft-delete actions are accessible via keyboard.

## Pages CMS module

- [ ] Table filters, pagination, and column preferences are keyboard operable.
- [ ] Page editor sidepanel modal traps focus and supports `Escape`/close button/backdrop close.
- [ ] Version history modal traps focus, exposes title/description, and closes correctly.
- [ ] Destructive confirmation modal keeps focus trap while pending.

## Blogs module

- [ ] Editor form controls, SEO sidebar fields, and publishing controls are keyboard operable.
- [ ] Preview drawer has labeled dialog semantics, focus trap, and close semantics.
- [ ] Checklist and workflow actions are executable by keyboard only.

## Settings module

- [ ] Macro tablist is keyboard reachable and each tab updates `aria-selected` state correctly.
- [ ] Section navigation and accordion triggers are keyboard operable.
- [ ] Branding contrast warnings are readable and actionable without mouse interaction.
- [ ] Save/reset actions are reachable and produce status feedback by keyboard-only flow.

## Payments module

- [ ] Transaction category tabs are keyboard reachable and linked to the active tabpanel.
- [ ] Transaction table actions (refund/cancel/export/reconcile) are keyboard operable.
- [ ] Refund workflow form is keyboard complete, including partial refund branch.
- [ ] Audit filter controls are keyboard accessible and list updates are perceivable.
