import {
  BatchTransitionRequestDto,
  BatchTransitionResponse,
  CmsPage,
  CompareSnapshotResponse,
  CreatePageRequestDto,
  ListPagesRequestDto,
  ListPagesResponseDto,
  PageDto,
  PageValidationErrors,
  PageVersionSnapshot,
  PublishGuardrailsResult,
  UpdatePageRequestDto
} from '../../types/dashboard/pages';
import { DashboardListResponse } from '../../types/dashboard/query';
import { delay } from './async';
import { assertPermission, DestructiveApprovalContext, enforceDestructiveApproval } from './authPolicy';
import { writeAuditEvent } from './audit.service';
import { mapPageDtoToUi, mapPageUiToDto } from './mappers/pages.mapper';
import { DashboardUserRole } from '../../types/dashboard/applications';

const TODAY = '2026-04-15';
const FALLBACK_EDITOR = 'Admin Team';

const toSlug = (value: string): string => {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return normalized ? `/${normalized}` : '/';
};

const dateOnly = (value: string): string => (value || '').slice(0, 10);

const validatePageSchema = (payload: Partial<CreatePageRequestDto>): PageValidationErrors => {
  const errors: PageValidationErrors = {};
  if (!payload.title?.trim()) errors.title = 'Title is required.';
  if (!payload.slug?.trim()) errors.slug = 'Slug is required.';
  if (!payload.locale) errors.locale = 'Locale is required.';
  if (!payload.status) errors.status = 'Status is required.';
  if (!payload.template) errors.template = 'Template is required.';
  if (!payload.seo?.metaTitle?.trim()) errors['seo.metaTitle'] = 'SEO title is required.';
  if (!payload.seo?.metaDescription?.trim()) errors['seo.metaDescription'] = 'SEO description is required.';
  if (!payload.seo?.canonicalUrl?.trim()) errors['seo.canonicalUrl'] = 'Canonical URL is required.';
  return errors;
};

const requireValidSchema = (payload: Partial<CreatePageRequestDto>): void => {
  const errors = validatePageSchema(payload);
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors).join(' '));
  }
};

let pageStore: PageDto[] = [
  {
    id: 'page-1',
    title: 'Home Landing',
    slug: '/home',
    status: 'published',
    template: 'landing',
    seo: {
      meta_title: 'Australian Visa Service | Home',
      meta_description: 'Start your visa process with dedicated assistance.',
      canonical_url: 'https://ausvisaservice.com/home',
      noindex: false
    },
    schedule: {
      publish_at: '2026-04-10T09:00:00Z',
      unpublish_at: ''
    },
    redirects: [],
    updated_by: 'Sarah Weston',
    updated_at: '2026-04-10',
    locale: 'EN',
    views: 58214
  },
  {
    id: 'page-2',
    title: 'Visa Pricing',
    slug: '/visa-pricing',
    status: 'published',
    template: 'content',
    seo: {
      meta_title: 'Visa Pricing Plans',
      meta_description: 'Compare plans and service tiers.',
      canonical_url: 'https://ausvisaservice.com/visa-pricing',
      noindex: false
    },
    schedule: {
      publish_at: '2026-04-11T12:00:00Z',
      unpublish_at: ''
    },
    redirects: [],
    updated_by: 'Mike T.',
    updated_at: '2026-04-11',
    locale: 'EN',
    views: 22120
  },
  {
    id: 'page-3',
    title: 'Corporate Intake Form',
    slug: '/corporate-intake',
    status: 'draft',
    template: 'campaign',
    seo: {
      meta_title: 'Corporate Intake',
      meta_description: 'Enterprise onboarding workflow.',
      canonical_url: 'https://ausvisaservice.com/corporate-intake',
      noindex: true
    },
    schedule: {
      publish_at: '',
      unpublish_at: ''
    },
    redirects: [],
    updated_by: 'Admin Team',
    updated_at: '2026-04-07',
    locale: 'EN',
    views: 294
  },
  {
    id: 'page-4',
    title: 'Refund Policy Legacy',
    slug: '/refund-policy-legacy',
    status: 'archived',
    template: 'policy',
    seo: {
      meta_title: 'Refund Policy (Legacy)',
      meta_description: 'Legacy refund policy details.',
      canonical_url: 'https://ausvisaservice.com/refund-policy-legacy',
      noindex: true
    },
    schedule: {
      publish_at: '',
      unpublish_at: ''
    },
    redirects: [],
    updated_by: 'Nina K.',
    updated_at: '2026-03-28',
    locale: 'EN',
    views: 780
  }
];

let versionStore: PageVersionSnapshot[] = pageStore.map((page, index) => ({
  id: `snap-${index + 1}`,
  pageId: page.id,
  version: 1,
  capturedAt: `${page.updated_at}T09:00:00Z`,
  actor: page.updated_by,
  reason: 'Initial import',
  snapshot: mapPageDtoToUi(page)
}));

const createVersionSnapshot = (page: PageDto, actor: string, reason: string): void => {
  const existing = versionStore.filter((item) => item.pageId === page.id);
  versionStore = [
    {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      pageId: page.id,
      version: existing.length + 1,
      capturedAt: `${TODAY}T10:00:00Z`,
      actor,
      reason,
      snapshot: mapPageDtoToUi(page)
    },
    ...versionStore
  ];
};

const linkCheckApiAvailable = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const response = await fetch('/api/internal/link-check/health', { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
};

const checkInternalLinks = async (page: CmsPage): Promise<string[]> => {
  const issues: string[] = [];
  const apiReady = await linkCheckApiAvailable();
  if (!apiReady) {
    return issues;
  }

  try {
    const response = await fetch('/api/internal/link-check', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pageId: page.id, slug: page.slug })
    });
    if (!response.ok) {
      issues.push('Internal-link checker returned a non-success response.');
      return issues;
    }
    const data = (await response.json()) as { brokenLinks?: string[] };
    (data.brokenLinks ?? []).forEach((link) => issues.push(`Broken internal link: ${link}`));
  } catch {
    issues.push('Internal-link checker failed during publish validation.');
  }

  return issues;
};

const getPageById = (id: string): PageDto => {
  const page = pageStore.find((entry) => entry.id === id);
  if (!page) {
    throw new Error('Page not found');
  }
  return page;
};

const ensureSlugUnique = (slug: string, pageId?: string): void => {
  const alreadyUsed = pageStore.some((page) => page.slug.toLowerCase() === slug.toLowerCase() && page.id !== pageId);
  if (alreadyUsed) {
    throw new Error('Slug must be unique.');
  }
};

const buildCompare = (from: CmsPage, to: CmsPage): string[] => {
  const changes: string[] = [];
  if (from.title !== to.title) changes.push(`Title: "${from.title}" → "${to.title}"`);
  if (from.slug !== to.slug) changes.push(`Slug: "${from.slug}" → "${to.slug}"`);
  if (from.status !== to.status) changes.push(`Status: ${from.status} → ${to.status}`);
  if (from.template !== to.template) changes.push(`Template: ${from.template} → ${to.template}`);
  if (from.locale !== to.locale) changes.push(`Locale: ${from.locale} → ${to.locale}`);
  if (from.seo.metaTitle !== to.seo.metaTitle) changes.push('SEO title changed');
  if (from.seo.metaDescription !== to.seo.metaDescription) changes.push('SEO description changed');
  if (from.seo.canonicalUrl !== to.seo.canonicalUrl) changes.push('Canonical URL changed');
  if (changes.length === 0) changes.push('No differences between these snapshots.');
  return changes;
};

const toResponse = (items: PageDto[], page: number, pageSize: number): ListPagesResponseDto => ({
  items,
  meta: { total: items.length, page, pageSize }
});

export const pagesService = {
  validateSchema: validatePageSchema,

  async list(request: ListPagesRequestDto): Promise<DashboardListResponse<CmsPage>> {
    await delay();
    const search = request.search?.trim().toLowerCase() ?? '';
    const filtered = pageStore.filter((page) => {
      const matchSearch =
        !search ||
        page.title.toLowerCase().includes(search) ||
        page.slug.toLowerCase().includes(search) ||
        page.updated_by.toLowerCase().includes(search);
      const matchStatus = !request.status || request.status === 'All' || page.status === request.status.toLowerCase();
      const matchLocale = !request.locale || request.locale === 'All' || page.locale === request.locale;
      const matchTemplate = !request.template || request.template === 'All' || page.template === request.template.toLowerCase();
      const matchUpdatedBy = !request.updated_by || page.updated_by.toLowerCase().includes(request.updated_by.toLowerCase());
      const from = request.updated_at_from ? dateOnly(request.updated_at_from) : '';
      const to = request.updated_at_to ? dateOnly(request.updated_at_to) : '';
      const updated = dateOnly(page.updated_at);
      const matchFrom = !from || updated >= from;
      const matchTo = !to || updated <= to;
      return matchSearch && matchStatus && matchLocale && matchTemplate && matchUpdatedBy && matchFrom && matchTo;
    });

    const dto = toResponse(filtered, request.page, request.page_size);
    return { ...dto, items: dto.items.map(mapPageDtoToUi) };
  },

  async create(payload: CreatePageRequestDto, role: DashboardUserRole): Promise<CmsPage> {
    await delay();
    assertPermission(role, 'pages', 'create');
    requireValidSchema(payload);
    const normalizedSlug = toSlug(payload.slug);
    ensureSlugUnique(normalizedSlug);

    const next: PageDto = {
      id: `page-${Date.now()}`,
      title: payload.title.trim(),
      slug: normalizedSlug,
      status: payload.status.toLowerCase() as PageDto['status'],
      template: payload.template.toLowerCase() as PageDto['template'],
      seo: {
        meta_title: payload.seo.metaTitle.trim(),
        meta_description: payload.seo.metaDescription.trim(),
        canonical_url: payload.seo.canonicalUrl.trim(),
        noindex: payload.seo.noindex
      },
      schedule: {
        publish_at: payload.schedule.publishAt,
        unpublish_at: payload.schedule.unpublishAt
      },
      redirects: [],
      updated_by: FALLBACK_EDITOR,
      updated_at: TODAY,
      locale: payload.locale,
      views: 0
    };
    pageStore = [next, ...pageStore];
    createVersionSnapshot(next, FALLBACK_EDITOR, 'Page created');
    writeAuditEvent({ actor: role, action: 'create', entityType: 'pages', entityId: next.id, before: null, after: next });
    return mapPageDtoToUi(next);
  },

  async update(id: string, payload: UpdatePageRequestDto, role: DashboardUserRole): Promise<CmsPage> {
    await delay();
    assertPermission(role, 'pages', 'edit');
    const existing = getPageById(id);
    const before = { ...existing };
    const mergedSchema = {
      title: payload.title ?? existing.title,
      slug: payload.slug ?? existing.slug,
      locale: (payload.locale ?? existing.locale) as CreatePageRequestDto['locale'],
      status: (payload.status ?? (existing.status === 'published' ? 'Published' : existing.status === 'draft' ? 'Draft' : 'Archived')) as CreatePageRequestDto['status'],
      template:
        (payload.template ??
          (existing.template === 'landing' ? 'Landing' : existing.template === 'campaign' ? 'Campaign' : existing.template === 'policy' ? 'Policy' : 'Content')) as CreatePageRequestDto['template'],
      seo: {
        metaTitle: payload.seo?.metaTitle ?? existing.seo.meta_title,
        metaDescription: payload.seo?.metaDescription ?? existing.seo.meta_description,
        canonicalUrl: payload.seo?.canonicalUrl ?? existing.seo.canonical_url,
        noindex: payload.seo?.noindex ?? existing.seo.noindex
      },
      schedule: {
        publishAt: payload.schedule?.publishAt ?? existing.schedule.publish_at,
        unpublishAt: payload.schedule?.unpublishAt ?? existing.schedule.unpublish_at
      }
    };
    requireValidSchema(mergedSchema);

    const nextSlug = toSlug(mergedSchema.slug);
    ensureSlugUnique(nextSlug, id);

    const redirects = [...existing.redirects];
    if (existing.status === 'published' && existing.slug !== nextSlug) {
      redirects.unshift({ from: existing.slug, to: nextSlug, created_at: TODAY });
    }

    const updatedDto: PageDto = {
      ...existing,
      title: mergedSchema.title,
      slug: nextSlug,
      locale: mergedSchema.locale,
      template: mergedSchema.template.toLowerCase() as PageDto['template'],
      status: mergedSchema.status.toLowerCase() as PageDto['status'],
      seo: {
        meta_title: mergedSchema.seo.metaTitle,
        meta_description: mergedSchema.seo.metaDescription,
        canonical_url: mergedSchema.seo.canonicalUrl,
        noindex: mergedSchema.seo.noindex
      },
      schedule: {
        publish_at: mergedSchema.schedule.publishAt,
        unpublish_at: mergedSchema.schedule.unpublishAt
      },
      redirects,
      updated_at: TODAY,
      updated_by: FALLBACK_EDITOR
    };

    pageStore = pageStore.map((page) => (page.id === id ? updatedDto : page));
    createVersionSnapshot(updatedDto, FALLBACK_EDITOR, 'Page updated');
    writeAuditEvent({ actor: role, action: 'edit', entityType: 'pages', entityId: id, before, after: updatedDto });
    return mapPageDtoToUi(updatedDto);
  },

  async remove(id: string, role: DashboardUserRole, approval: DestructiveApprovalContext): Promise<void> {
    await delay();
    assertPermission(role, 'pages', 'delete');
    enforceDestructiveApproval('pages', 'delete', approval);
    const before = pageStore.find((page) => page.id === id);
    if (!pageStore.some((page) => page.id === id)) {
      throw new Error('Page not found');
    }
    pageStore = pageStore.filter((page) => page.id !== id);
    writeAuditEvent({ actor: role, action: 'delete', entityType: 'pages', entityId: id, before, after: { removed: true, ...approval } });
  },

  async getVersionHistory(pageId: string): Promise<PageVersionSnapshot[]> {
    await delay();
    return versionStore.filter((entry) => entry.pageId === pageId).sort((a, b) => b.version - a.version);
  },

  async compareSnapshots(pageId: string, fromVersion: number, toVersion: number): Promise<CompareSnapshotResponse> {
    await delay();
    const snapshots = versionStore.filter((entry) => entry.pageId === pageId);
    const from = snapshots.find((entry) => entry.version === fromVersion);
    const to = snapshots.find((entry) => entry.version === toVersion);
    if (!from || !to) {
      throw new Error('Requested versions were not found.');
    }
    return { fromVersion, toVersion, changes: buildCompare(from.snapshot, to.snapshot) };
  },

  async rollbackToVersion(pageId: string, version: number, role: DashboardUserRole): Promise<CmsPage> {
    await delay();
    assertPermission(role, 'pages', 'edit');
    const page = getPageById(pageId);
    const target = versionStore.find((entry) => entry.pageId === pageId && entry.version === version);
    if (!target) {
      throw new Error('Snapshot not found for rollback.');
    }
    const restored = mapPageUiToDto(target.snapshot);
    ensureSlugUnique(restored.slug, pageId);
    const next: PageDto = {
      ...page,
      ...restored,
      id: pageId,
      updated_at: TODAY,
      updated_by: FALLBACK_EDITOR
    };
    pageStore = pageStore.map((entry) => (entry.id === pageId ? next : entry));
    createVersionSnapshot(next, FALLBACK_EDITOR, `Rollback to version ${version}`);
    writeAuditEvent({ actor: role, action: 'rollback', entityType: 'pages', entityId: pageId, before: page, after: next });
    return mapPageDtoToUi(next);
  },

  async checkPublishGuardrails(id: string): Promise<PublishGuardrailsResult> {
    await delay();
    const page = mapPageDtoToUi(getPageById(id));
    const warnings: string[] = [];

    if (!page.seo.metaTitle || !page.seo.metaDescription || !page.seo.canonicalUrl) {
      warnings.push('Missing SEO metadata fields required for publish.');
    }

    const linkIssues = await checkInternalLinks(page);
    warnings.push(...linkIssues);

    return { canPublish: warnings.length === 0, warnings };
  },

  async batchTransition(payload: BatchTransitionRequestDto, role: DashboardUserRole, approval?: DestructiveApprovalContext): Promise<BatchTransitionResponse> {
    await delay();
    assertPermission(role, 'pages', payload.action === 'publish' ? 'publish' : 'edit');
    if (payload.action === 'publish') {
      enforceDestructiveApproval('pages', 'publish', approval);
    }
    const warnings: string[] = [];
    const updated: CmsPage[] = [];

    for (const id of payload.ids) {
      const current = getPageById(id);
      if (payload.action === 'publish') {
        const guardrails = await this.checkPublishGuardrails(id);
        if (!guardrails.canPublish) {
          warnings.push(`${current.title}: ${guardrails.warnings.join(' ')}`);
          continue;
        }
      }

      const nextStatus: PageDto['status'] = payload.action === 'publish' ? 'published' : 'archived';
      const next: PageDto = { ...current, status: nextStatus, updated_at: TODAY, updated_by: FALLBACK_EDITOR };
      pageStore = pageStore.map((entry) => (entry.id === id ? next : entry));
      createVersionSnapshot(next, FALLBACK_EDITOR, `Batch ${payload.action}`);
      updated.push(mapPageDtoToUi(next));
    }

    if (updated.length > 0) {
      writeAuditEvent({
        actor: role,
        action: `batch_${payload.action}`,
        entityType: 'pages',
        entityId: payload.ids.join(','),
        before: { ids: payload.ids },
        after: { updated: updated.map((entry) => entry.id), approval }
      });
    }

    return { updated, warnings };
  },

  toDto(page: CmsPage): PageDto {
    return mapPageUiToDto(page);
  }
};
