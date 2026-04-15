# Dashboard Delivery Plan (Phased Rollout)

This plan sequences dashboard work into four release-controlled modules and adds hardening criteria before full availability.

## Release controls

- Each module is guarded by `featureFlags.service` toggles for progressive rollout and safe rollback.
- Rollout policy: 10% internal canary → 50% staff pilot → 100% production when acceptance checks pass.
- Rollback policy: disable module flag and route users to dashboard overview while preserving read-only access where possible.

## Phase 1 — Data layer + table framework + top nav

### Scope
- Shared data services, async/loading/error framework, table primitives, and dashboard top navigation.
- Baseline telemetry plumbed for high-value admin actions.

### Acceptance criteria
- **Happy path CRUD (framework readiness)**
  - [ ] Shared list/create/update/delete abstractions are reusable by applications/users/pages/blogs modules.
  - [ ] Table framework supports sorting, search, pagination, bulk selection, and empty states.
- **Validation + error paths**
  - [ ] API/service failures surface actionable inline errors and non-blocking retry actions.
  - [ ] Form-level validation messages are announced and associated to inputs.
- **Permission enforcement**
  - [ ] Role guard checks prevent hidden or disabled actions from executing.
  - [ ] Unauthorized navigation resolves to safe fallback (overview + role-appropriate notice).
- **Accessibility (keyboard + screen reader)**
  - [ ] Top nav, sidebar, table row actions, and dialogs are fully keyboard reachable.
  - [ ] Focus order remains logical on open/close transitions for drawers and modals.
  - [ ] ARIA labels/roles are present for table actions, toasts, and profile controls.

## Phase 2 — Applications + Users CRUD

### Scope
- Full create/read/update/delete flows for visa applications and user records.
- Bulk operations, import/export, and audit trails.

### Acceptance criteria
- **Happy path CRUD**
  - [ ] Applications: create, edit, soft delete, restore, bulk assign/status update, export selected.
  - [ ] Users: create, edit, activate/deactivate, soft delete, CSV import/export.
- **Validation + error paths**
  - [ ] Duplicate detection for users (email/phone) blocks save with clear remediation text.
  - [ ] Applications not found, expired restore window, and destructive approval requirements return explicit errors.
- **Permission enforcement**
  - [ ] Admin/manager/user permissions are enforced for each mutation and destructive action.
  - [ ] Disallowed controls are disabled and accompanied by role-specific helper text.
- **Accessibility (keyboard + screen reader)**
  - [ ] Create/edit dialogs trap focus and restore focus to trigger after close.
  - [ ] Status updates and mutation feedback are screen-reader announced via live region.

## Phase 3 — Pages + Blogs parity

### Scope
- Bring CMS pages/blog workflows to parity for editor/manager/admin lifecycle states.
- Publish guardrails, versioning, review loop, and performance widgets.

### Acceptance criteria
- **Happy path CRUD**
  - [ ] Pages: create, edit, archive/remove, rollback versions, batch publish/archive.
  - [ ] Blogs: draft, edit, submit review, approve, publish/schedule, archive.
- **Validation + error paths**
  - [ ] Slug uniqueness, required SEO fields, and publish guardrails block invalid publishes.
  - [ ] Revision conflicts and missing snapshots return recoverable error states.
- **Permission enforcement**
  - [ ] Editor/manager/admin capability matrix is respected on status transitions.
  - [ ] Admin-only actions (override/publish delete) are explicitly gated.
- **Accessibility (keyboard + screen reader)**
  - [ ] Rich editor sidebars and publishing controls are keyboard operable.
  - [ ] Preview drawers and review queues expose semantic headings and labels.

## Phase 4 — Settings + Webhooks + RBAC + Audit

### Scope
- Settings modules, webhook management/health, RBAC controls, and audit log workflows.

### Acceptance criteria
- **Happy path CRUD**
  - [ ] Settings save/reset works by tab and only persists changed fields.
  - [ ] Webhooks: endpoint create/edit/delete, status toggles, secret rotate, subscriptions, delivery policy updates, replay flow.
  - [ ] Audit log filters/export are fully functional.
- **Validation + error paths**
  - [ ] Webhook URL validation enforces HTTPS and blocks invalid endpoints.
  - [ ] Save failures do not lose draft state and surface actionable errors.
- **Permission enforcement**
  - [ ] RBAC restrictions apply to integrations, destructive webhook actions, and audit exports.
  - [ ] Sensitive security toggles require admin role + explicit confirmation path.
- **Accessibility (keyboard + screen reader)**
  - [ ] Settings tab switches announce active panel context and preserve focus.
  - [ ] Webhook matrix checkboxes include accessible names and state announcements.

## Regression checklist (admin / manager / user journeys)

### Admin journey
- [ ] Can access all enabled modules from sidebar and top nav profile controls.
- [ ] Can perform full CRUD in applications/users/pages/blogs/settings/webhooks.
- [ ] Sees audit entries + analytics events emitted for high-value actions.

### Manager journey
- [ ] Restricted from admin-only destructive/settings controls.
- [ ] Can complete approved workflows (applications triage, blogs review, operational settings).
- [ ] Unauthorized attempts show non-breaking denial messaging.

### User journey
- [ ] Can access personal applications/documents/payments/profile paths.
- [ ] Cannot access admin CRM/CMS/settings mutation routes.
- [ ] Feature-flag-paused modules gracefully route to overview with clear notice.

### Cross-module regression matrix
- [ ] Empty, loading, and error states render in every dashboard panel.
- [ ] Keyboard traversal works for all module primary actions.
- [ ] Screen-reader labels are present for icon-only/menu actions.
- [ ] Mobile breakpoints maintain readability, tap-target size, and overflow containment.

## Analytics instrumentation requirements

Track high-value events by module with actor role and entity ID when available:
- applications_created / updated / deleted / restored
- users_created / updated / deleted / imported
- pages_created / updated / deleted / published
- webhooks_endpoint_created / updated / deleted
- webhooks_test_sent / webhooks_delivery_replayed

Webhook health metrics must include:
- delivery volume
- success rate (2xx/3xx)
- average + p95 latency
- failing endpoints list

## Final hardening pass (release gate)

Before enabling all module flags to 100%:
- [ ] UX consistency audit: spacing, typography, CTA priority, feedback semantics.
- [ ] Edge-case coverage: duplicates, stale restores, invalid URLs, guardrail denials, destructive confirmations.
- [ ] Completeness audit: every page has explicit empty/loading/error states.
- [ ] Mobile responsiveness: no clipped tables, inaccessible controls, or horizontal overflow blockers at common breakpoints.
- [ ] Role-based smoke test: admin, manager, and user journeys pass end-to-end.
