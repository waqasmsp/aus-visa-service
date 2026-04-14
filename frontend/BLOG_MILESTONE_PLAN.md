# Blog System Milestone Plan

This rollout plan breaks delivery into controlled phases with explicit acceptance gates.
Each phase can only be promoted when all checklist items pass.

## Global release guardrails (apply to all phases)

- Keep dashboard/blog-management surfaces internal-only until their designated public phase.
- Maintain strict role checks (`admin`, `editor`, `author`, `viewer`) at route and action levels.
- Verify robots/canonical/JSON-LD output in staging before production promotion.
- Keep blog UI components aligned with landing style primitives (spacing scale, typography, cards, buttons, color tokens).

---

## Phase 1 — Domain types + dashboard blog list (internal only)

### Scope

- Introduce/normalize blog domain types (post status, author, category, tag, SEO metadata, workflow metadata).
- Deliver dashboard blog list for authenticated internal roles only.
- Provide filtering/sorting/status chips and basic post summary data.

### Acceptance checklist

- [ ] Blog domain models compile and are used consistently across dashboard services, mappers, and hooks.
- [ ] Dashboard list renders post title, status, author, updated date, and SEO readiness indicators.
- [ ] Dashboard list supports search + status/category filters.
- [ ] Non-authenticated users cannot access `/dashboard` blog list.
- [ ] Internal route returns `noindex,nofollow` metadata.

### Security / permission leakage checks

- [ ] Confirm unauthenticated access to dashboard blog endpoints/routes is blocked (UI + API).
- [ ] Confirm `viewer` role cannot access write actions.
- [ ] Confirm blog draft content is never available in public data payloads.

### noindex/index behavior checks

- [ ] `/dashboard/*` => `noindex`.
- [ ] `/blog` route not enabled publicly in this phase; if route exists for dev, enforce `noindex`.
- [ ] `/blog/:slug` inaccessible or `noindex` placeholder only.

### Canonical + JSON-LD validation (sample posts)

- [ ] Draft sample post canonical resolves to internal canonical or is omitted.
- [ ] No public `BlogPosting` JSON-LD emitted for draft/internal-only posts.

### Theme consistency checks (landing style system)

- [ ] Dashboard blog list reuses existing primitives (cards, badges, table spacing rhythm).
- [ ] Typography sizes/weights map to established landing scale.
- [ ] Color usage conforms to existing semantic tokens.

---

## Phase 2 — Editor + workflow + role enforcement

### Scope

- Ship editor experience (body, excerpt, tags, slug, featured image, SEO fields).
- Implement workflow states and transitions (`draft` → `in_review` → `approved` → `published` / `archived`).
- Enforce role-based permissions for transitions and publishing.

### Acceptance checklist

- [ ] Editor supports save draft, autosave (or explicit save), preview, and validation errors.
- [ ] Workflow transition rules are enforced both server-side and in UI.
- [ ] Audit trail captures author, reviewer, timestamps, and transition notes.
- [ ] Publish action restricted to allowed roles.

### Security / permission leakage checks

- [ ] `author` cannot approve/publish unless explicitly granted.
- [ ] `editor` can review but cannot bypass required approval rules.
- [ ] Permission checks are mirrored in API and UI controls (no hidden endpoint bypass).

### noindex/index behavior checks

- [ ] Draft/review preview URLs => `noindex`.
- [ ] Dashboard/editor routes => `noindex`.
- [ ] Only explicitly published posts become index-eligible.

### Canonical + JSON-LD validation (sample posts)

- [ ] Preview mode canonical points to non-public preview canonical (or omitted).
- [ ] Published candidate preview does not emit public `BlogPosting` schema until publish.
- [ ] Validate schema fields for title, description, author, datePublished, dateModified, image.

### Theme consistency checks (landing style system)

- [ ] Editor fields, buttons, and panels use shared input/button/card primitives.
- [ ] Validation and status UI use existing alert/tag treatment.
- [ ] Spacing and responsive behavior align with landing breakpoints.

---

## Phase 3 — Public `/blog` and `/blog/:slug` pages

### Scope

- Launch public blog listing page and detail page.
- Expose only published posts.
- Implement category/tag browsing and related post suggestions.

### Acceptance checklist

- [ ] `/blog` lists only published posts with pagination/infinite scroll behavior defined.
- [ ] `/blog/:slug` resolves published posts and 404s unpublished/missing posts.
- [ ] Category/tag navigation works for public-visible content only.
- [ ] SSR/prerender output is stable for listing and detail pages.

### Security / permission leakage checks

- [ ] Unpublished post slugs return 404 (not “unauthorized”).
- [ ] Public endpoints do not expose internal workflow fields/reviewer notes.
- [ ] Cache keys do not leak private variants.

### noindex/index behavior checks

- [ ] `/blog` => `index,follow`.
- [ ] Published `/blog/:slug` => `index,follow`.
- [ ] Unpublished/nonexistent `/blog/:slug` => `noindex` (or clean 404 with noindex response policy).
- [ ] Dashboard/editor/internal preview routes remain `noindex`.

### Canonical + JSON-LD validation (sample posts)

- [ ] `/blog/:slug` canonical exactly matches public slug URL.
- [ ] Listing canonical points to `/blog` (+ paginated canonical strategy documented).
- [ ] `BlogPosting` JSON-LD validates in Rich Results testing for at least 3 representative posts.
- [ ] Optional `BreadcrumbList` JSON-LD validates for blog detail pages.

### Theme consistency checks (landing style system)

- [ ] Blog listing/detail templates match landing typography, card elevations, and CTA style.
- [ ] Shared header/footer behavior remains consistent across landing + blog routes.
- [ ] Dark/light treatment (if present) matches landing tokens.

---

## Phase 4 — Advanced SEO/schema/sitemap automation

### Scope

- Automate sitemap generation for blog listing + published detail pages.
- Expand schema coverage (Organization, WebSite, Breadcrumb, Article variants).
- Add canonical policies for pagination, tags/categories, and duplicates.

### Acceptance checklist

- [ ] Sitemap includes `/blog` and all published `/blog/:slug` URLs with accurate `lastmod`.
- [ ] No unpublished URLs appear in sitemap.
- [ ] Robots directives align with route intent (indexable public pages only).
- [ ] Structured data coverage expanded and validated across templates.

### Security / permission leakage checks

- [ ] Sitemap and feeds never expose draft/private URLs.
- [ ] SEO endpoints (sitemap/feed/schema) only consume published dataset.
- [ ] Canonical generation cannot be poisoned by user-supplied URL params.

### noindex/index behavior checks

- [ ] Tag/category thin pages strategy enforced (`index` only with sufficient content, else `noindex`).
- [ ] Search/filter parameter pages default to `noindex` unless explicitly whitelisted.
- [ ] Pagination routes apply canonical + robots policy consistently.

### Canonical + JSON-LD validation (sample posts)

- [ ] Canonical deduplication verified across UTM/query variants.
- [ ] JSON-LD includes author, publisher, mainEntityOfPage, image, dates, and headline.
- [ ] Schema output passes validator checks for long-form, short-form, and updated posts.

### Theme consistency checks (landing style system)

- [ ] SEO-related UX elements (breadcrumbs, share cards, rich snippets previews) use shared design tokens.
- [ ] No visual regression in landing components reused by blog pages.

---

## Phase 5 — Analytics + content operations tooling

### Scope

- Add analytics instrumentation for blog discovery, engagement, conversion assists.
- Provide content operations dashboard (performance, decay alerts, refresh queue, internal linking opportunities).
- Establish editorial SLA/reporting workflows.

### Acceptance checklist

- [ ] Event taxonomy implemented for listing impressions, post clicks, read depth, CTA clicks, conversions.
- [ ] Dashboard surfaces post-level performance KPIs and trend windows.
- [ ] Content ops tooling supports stale-content detection and refresh workflows.
- [ ] Weekly/monthly reporting exports available to content team.

### Security / permission leakage checks

- [ ] Analytics pipeline strips PII and respects consent settings.
- [ ] Ops dashboard access restricted to authorized content/marketing roles.
- [ ] No raw user identifiers exposed in dashboard exports.

### noindex/index behavior checks

- [ ] Analytics/debug routes remain `noindex`.
- [ ] Public routes preserve Phase 4 indexing policies after instrumentation changes.
- [ ] Experiment/variant URLs have canonical + robots protections.

### Canonical + JSON-LD validation (sample posts)

- [ ] Tracking params do not alter canonical tags.
- [ ] JSON-LD remains unchanged/valid with analytics scripts enabled.
- [ ] Regression snapshots for canonical and schema are green.

### Theme consistency checks (landing style system)

- [ ] Content ops and analytics dashboard modules reuse existing admin/landing primitives.
- [ ] Performance widgets match established type scale, spacing, and color semantics.

---

## Exit criteria by phase

A phase is complete only when:

1. All acceptance checkboxes are complete.
2. Permission-leakage checks pass in QA and staging.
3. Route indexing behavior is verified with automated + manual checks.
4. Canonical and JSON-LD validations pass for representative samples.
5. Theme consistency review is signed off by design.
