import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BatchTransitionRequestDto,
  CmsPage,
  CompareSnapshotResponse,
  CreatePageRequestDto,
  LocaleCode,
  PageStatus,
  PageTemplateType,
  PageValidationErrors,
  PageVersionSnapshot
} from '../../../types/dashboard/pages';
import { DashboardQueryState } from '../../../types/dashboard/query';
import { pagesService } from '../../../services/dashboard/pages.service';
import { extractApiErrorMessage, runOptimisticMutation } from '../../../services/dashboard/async';
import { canPerform, collectDestructiveApproval } from '../../../services/dashboard/authPolicy';
import { DashboardUserRole } from '../../../types/dashboard/applications';
import { useDashboardTableState } from '../common/useDashboardTableState';
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingSkeleton,
  MutationToastRegion,
  useMutationToasts
} from '../common/asyncUi';

const defaultForm = (): CreatePageRequestDto => ({
  title: '',
  slug: '',
  locale: 'EN',
  status: 'Draft',
  template: 'Content',
  seo: {
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    noindex: false
  },
  schedule: {
    publishAt: '',
    unpublishAt: ''
  }
});

type TableFilters = {
  status: 'All' | PageStatus;
  locale: 'All' | LocaleCode;
  template: 'All' | PageTemplateType;
  updatedBy: string;
  updatedAtFrom: string;
  updatedAtTo: string;
};

const toClassToken = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function PageEditorModal({
  mode,
  initial,
  open,
  submitting,
  errors,
  onClose,
  onSubmit
}: {
  mode: 'create' | 'edit';
  initial: CreatePageRequestDto;
  open: boolean;
  submitting: boolean;
  errors: PageValidationErrors;
  onClose: () => void;
  onSubmit: (payload: CreatePageRequestDto) => Promise<void>;
}) {
  const [form, setForm] = useState<CreatePageRequestDto>(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  if (!open) return null;

  return (
    <div className="dashboard-modal-backdrop" role="dialog" aria-modal="true">
      <div className="dashboard-sidepanel">
        <div className="dashboard-panel__header dashboard-panel__header--spread">
          <h3>{mode === 'create' ? 'Create page' : 'Edit page'}</h3>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="dashboard-stack">
          <label>
            Title *
            <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            {errors.title ? <small className="dashboard-field-error">{errors.title}</small> : null}
          </label>
          <label>
            Slug *
            <input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="/page-slug" />
            {errors.slug ? <small className="dashboard-field-error">{errors.slug}</small> : null}
          </label>
          <label>
            Locale *
            <select value={form.locale} onChange={(event) => setForm((prev) => ({ ...prev, locale: event.target.value as LocaleCode }))}>
              <option value="EN">EN</option>
              <option value="AR">AR</option>
              <option value="UR">UR</option>
            </select>
          </label>
          <label>
            Status *
            <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as PageStatus }))}>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Archived">Archived</option>
            </select>
          </label>
          <label>
            Template *
            <select value={form.template} onChange={(event) => setForm((prev) => ({ ...prev, template: event.target.value as PageTemplateType }))}>
              <option value="Content">Content</option>
              <option value="Landing">Landing</option>
              <option value="Policy">Policy</option>
              <option value="Campaign">Campaign</option>
            </select>
          </label>
          <label>
            SEO Title *
            <input
              value={form.seo.metaTitle}
              onChange={(event) => setForm((prev) => ({ ...prev, seo: { ...prev.seo, metaTitle: event.target.value } }))}
            />
            {errors['seo.metaTitle'] ? <small className="dashboard-field-error">{errors['seo.metaTitle']}</small> : null}
          </label>
          <label>
            SEO Description *
            <textarea
              value={form.seo.metaDescription}
              onChange={(event) => setForm((prev) => ({ ...prev, seo: { ...prev.seo, metaDescription: event.target.value } }))}
            />
            {errors['seo.metaDescription'] ? <small className="dashboard-field-error">{errors['seo.metaDescription']}</small> : null}
          </label>
          <label>
            Canonical URL *
            <input
              value={form.seo.canonicalUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, seo: { ...prev.seo, canonicalUrl: event.target.value } }))}
              placeholder="https://example.com/page"
            />
            {errors['seo.canonicalUrl'] ? <small className="dashboard-field-error">{errors['seo.canonicalUrl']}</small> : null}
          </label>
          <label>
            Publish At
            <input
              type="datetime-local"
              value={form.schedule.publishAt}
              onChange={(event) => setForm((prev) => ({ ...prev, schedule: { ...prev.schedule, publishAt: event.target.value } }))}
            />
          </label>
          <label>
            Unpublish At
            <input
              type="datetime-local"
              value={form.schedule.unpublishAt}
              onChange={(event) => setForm((prev) => ({ ...prev, schedule: { ...prev.schedule, unpublishAt: event.target.value } }))}
            />
          </label>
          <label className="dashboard-checkbox-row">
            <input
              type="checkbox"
              checked={form.seo.noindex}
              onChange={(event) => setForm((prev) => ({ ...prev, seo: { ...prev.seo, noindex: event.target.checked } }))}
            />
            Noindex
          </label>

          <div className="dashboard-actions-inline">
            <button type="button" className="dashboard-primary-button" disabled={submitting} onClick={() => void onSubmit(form)}>
              {submitting ? 'Saving…' : 'Save page'}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  if (!open) return null;
  return (
    <div className="dashboard-modal-backdrop" role="dialog" aria-modal="true">
      <article className="dashboard-modal-card">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="dashboard-actions-inline">
          <button type="button" className="dashboard-primary-button" onClick={() => void onConfirm()}>
            {confirmLabel}
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </article>
    </div>
  );
}

export function PagesPanel({ role }: { role: DashboardUserRole }) {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editorInitial, setEditorInitial] = useState<CreatePageRequestDto>(defaultForm());
  const [editorPageId, setEditorPageId] = useState<string | null>(null);
  const [editorSubmitting, setEditorSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<PageValidationErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<CmsPage | null>(null);

  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [batchAction, setBatchAction] = useState<BatchTransitionRequestDto['action'] | null>(null);

  const [versionPage, setVersionPage] = useState<CmsPage | null>(null);
  const [versions, setVersions] = useState<PageVersionSnapshot[]>([]);
  const [compareResult, setCompareResult] = useState<CompareSnapshotResponse | null>(null);
  const [compareFrom, setCompareFrom] = useState<number | null>(null);
  const [compareTo, setCompareTo] = useState<number | null>(null);

  const { toasts, dismissToast, notifyError, notifySuccess } = useMutationToasts();
  const table = useDashboardTableState<TableFilters>({
    basePath: '/dashboard/pages',
    defaultState: {
      search: '',
      pagination: { page: 1, pageSize: 20 },
      filters: {
        status: 'All',
        locale: 'All',
        template: 'All',
        updatedBy: '',
        updatedAtFrom: '',
        updatedAtTo: ''
      }
    } as DashboardQueryState<TableFilters>
  });

  const loadPages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await pagesService.list({
        page: table.state.pagination.page,
        page_size: table.state.pagination.pageSize,
        search: table.state.search,
        status: table.state.filters.status,
        locale: table.state.filters.locale,
        template: table.state.filters.template,
        updated_by: table.state.filters.updatedBy,
        updated_at_from: table.state.filters.updatedAtFrom,
        updated_at_to: table.state.filters.updatedAtTo
      });
      setPages(response.items);
      setSelectedPageIds((prev) => prev.filter((id) => response.items.some((item) => item.id === id)));
    } catch (loadError) {
      setError(extractApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [table.state]);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const openCreate = () => {
    setEditorMode('create');
    setEditorPageId(null);
    setEditorInitial(defaultForm());
    setFormErrors({});
    setEditorOpen(true);
  };

  const openEdit = (page: CmsPage) => {
    setEditorMode('edit');
    setEditorPageId(page.id);
    setEditorInitial({
      title: page.title,
      slug: page.slug,
      locale: page.locale,
      status: page.status,
      template: page.template,
      seo: page.seo,
      schedule: page.schedule
    });
    setFormErrors({});
    setEditorOpen(true);
  };

  const savePage = async (payload: CreatePageRequestDto) => {
    const validation = pagesService.validateSchema(payload);
    setFormErrors(validation);
    if (Object.keys(validation).length > 0) {
      notifyError('Required fields are missing.');
      return;
    }

    setEditorSubmitting(true);
    try {
      if (editorMode === 'create') {
        await pagesService.create(payload, role);
        notifySuccess('Page created successfully.');
      } else if (editorPageId) {
        const previous = pages;
        const optimistic = pages.map((page) =>
          page.id === editorPageId
            ? {
                ...page,
                title: payload.title,
                slug: payload.slug,
                locale: payload.locale,
                status: payload.status,
                template: payload.template,
                seo: payload.seo,
                schedule: payload.schedule,
                updatedAt: 'Saving…'
              }
            : page
        );

        await runOptimisticMutation(
          () => setPages(optimistic),
          () => setPages(previous),
          async () => {
            const updated = await pagesService.update(editorPageId, payload, role);
            setPages((prev) => prev.map((page) => (page.id === editorPageId ? updated : page)));
            notifySuccess('Page updated successfully.');
          }
        );
      }
      setEditorOpen(false);
      await loadPages();
    } catch (mutationError) {
      notifyError(extractApiErrorMessage(mutationError));
    } finally {
      setEditorSubmitting(false);
    }
  };

  const deletePage = async () => {
    if (!deleteTarget) return;
    const previous = pages;
    try {
      await runOptimisticMutation(
        () => setPages((prev) => prev.filter((page) => page.id !== deleteTarget.id)),
        () => setPages(previous),
        async () => {
          const approval = collectDestructiveApproval('pages', 'delete', deleteTarget.title);
          if (!approval) {
            throw new Error('Delete canceled.');
          }
          await pagesService.remove(deleteTarget.id, role, approval);
          notifySuccess('Page removed.');
        }
      );
      setDeleteTarget(null);
    } catch (mutationError) {
      notifyError(extractApiErrorMessage(mutationError));
    }
  };

  const allSelected = useMemo(() => pages.length > 0 && selectedPageIds.length === pages.length, [pages, selectedPageIds]);

  const toggleSelectAll = () => {
    setSelectedPageIds(allSelected ? [] : pages.map((page) => page.id));
  };

  const runBatch = async () => {
    if (!batchAction) return;
    try {
      const destructiveApproval = batchAction === 'publish' ? collectDestructiveApproval('pages', 'publish', `${selectedPageIds.length} pages`) : null;
      if (batchAction === 'publish' && !destructiveApproval) {
        return;
      }
      const response = await pagesService.batchTransition({ ids: selectedPageIds, action: batchAction }, role, destructiveApproval ?? undefined);
      response.warnings.forEach((warning) => notifyError(warning));
      if (response.updated.length > 0) {
        notifySuccess(`Updated ${response.updated.length} page(s).`);
      }
      setBatchAction(null);
      setSelectedPageIds([]);
      await loadPages();
    } catch (batchError) {
      notifyError(extractApiErrorMessage(batchError));
    }
  };

  const openVersions = async (page: CmsPage) => {
    setVersionPage(page);
    setCompareResult(null);
    setCompareFrom(null);
    setCompareTo(null);
    try {
      setVersions(await pagesService.getVersionHistory(page.id));
    } catch (historyError) {
      notifyError(extractApiErrorMessage(historyError));
    }
  };

  const runCompare = async () => {
    if (!versionPage || !compareFrom || !compareTo) return;
    try {
      setCompareResult(await pagesService.compareSnapshots(versionPage.id, compareFrom, compareTo));
    } catch (compareError) {
      notifyError(extractApiErrorMessage(compareError));
    }
  };

  const rollback = async (version: number) => {
    if (!versionPage) return;
    try {
      await pagesService.rollbackToVersion(versionPage.id, version, role);
      notifySuccess(`Rolled back to version ${version}.`);
      setVersions(await pagesService.getVersionHistory(versionPage.id));
      await loadPages();
    } catch (rollbackError) {
      notifyError(extractApiErrorMessage(rollbackError));
    }
  };

  const checkPublishGuardrails = async (page: CmsPage) => {
    try {
      const guardrails = await pagesService.checkPublishGuardrails(page.id);
      if (guardrails.canPublish) {
        notifySuccess('Publish checks passed.');
      } else {
        guardrails.warnings.forEach((warning) => notifyError(warning));
      }
    } catch (guardrailsError) {
      notifyError(extractApiErrorMessage(guardrailsError));
    }
  };

  return (
    <section className="dashboard-stack">
      <MutationToastRegion toasts={toasts} onDismiss={dismissToast} />
      {loading ? <DashboardLoadingSkeleton rows={5} /> : null}
      {!loading && error ? <DashboardErrorState message={error} onRetry={() => void loadPages()} /> : null}
      {!loading && !error ? (
        <article className="dashboard-panel">
          <div className="dashboard-panel__header dashboard-panel__header--spread">
            <h2>CMS Pages</h2>
            <button type="button" className="dashboard-primary-button" onClick={openCreate} disabled={!canPerform(role, 'pages', 'create')}>
              Add New Page
            </button>
          </div>

          <div className="dashboard-filter-grid dashboard-filter-grid--dense">
            <label>
              Search
              <input value={table.state.search} onChange={(event) => table.setSearch(event.target.value)} placeholder="title, slug, editor" />
            </label>
            <label>
              Status
              <select value={table.state.filters.status} onChange={(event) => table.setFilter('status', event.target.value as TableFilters['status'])}>
                <option value="All">All</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </label>
            <label>
              Locale
              <select value={table.state.filters.locale} onChange={(event) => table.setFilter('locale', event.target.value as TableFilters['locale'])}>
                <option value="All">All</option>
                <option value="EN">EN</option>
                <option value="AR">AR</option>
                <option value="UR">UR</option>
              </select>
            </label>
            <label>
              Template
              <select value={table.state.filters.template} onChange={(event) => table.setFilter('template', event.target.value as TableFilters['template'])}>
                <option value="All">All</option>
                <option value="Content">Content</option>
                <option value="Landing">Landing</option>
                <option value="Policy">Policy</option>
                <option value="Campaign">Campaign</option>
              </select>
            </label>
            <label>
              Updated By
              <input value={table.state.filters.updatedBy} onChange={(event) => table.setFilter('updatedBy', event.target.value)} placeholder="editor" />
            </label>
            <label>
              Updated From
              <input type="date" value={table.state.filters.updatedAtFrom} onChange={(event) => table.setFilter('updatedAtFrom', event.target.value)} />
            </label>
            <label>
              Updated To
              <input type="date" value={table.state.filters.updatedAtTo} onChange={(event) => table.setFilter('updatedAtTo', event.target.value)} />
            </label>
          </div>

          {selectedPageIds.length > 0 ? (
            <div className="dashboard-batch-bar">
              <strong>{selectedPageIds.length}</strong> selected
              <button type="button" onClick={() => setBatchAction('publish')}>
                Batch publish
              </button>
              <button type="button" onClick={() => setBatchAction('archive')}>
                Batch archive
              </button>
            </div>
          ) : null}

          {pages.length === 0 ? (
            <DashboardEmptyState title="No pages found" description="Try changing filters or add a new page." />
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                    </th>
                    <th>Title</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th>Template</th>
                    <th>Locale</th>
                    <th>Updated By</th>
                    <th>Updated At</th>
                    <th>Views</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => {
                    const selected = selectedPageIds.includes(page.id);
                    return (
                      <tr key={page.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setSelectedPageIds((prev) => (selected ? prev.filter((id) => id !== page.id) : [...prev, page.id]))
                            }
                          />
                        </td>
                        <td>{page.title}</td>
                        <td>
                          <div>{page.slug}</div>
                          {page.redirects.length > 0 ? <small>{page.redirects.length} redirect rule(s)</small> : null}
                        </td>
                        <td>
                          <span className={`dashboard-chip dashboard-chip--${toClassToken(page.status)}`}>{page.status}</span>
                        </td>
                        <td>{page.template}</td>
                        <td>{page.locale}</td>
                        <td>{page.updatedBy}</td>
                        <td>{page.updatedAt}</td>
                        <td>{page.views.toLocaleString()}</td>
                        <td>
                          <div className="dashboard-actions-inline">
                            <button type="button" onClick={() => openEdit(page)} disabled={!canPerform(role, 'pages', 'edit')}>
                              Edit
                            </button>
                            <button type="button" onClick={() => void checkPublishGuardrails(page)}>
                              Guardrails
                            </button>
                            <button type="button" onClick={() => void openVersions(page)}>
                              Versions
                            </button>
                            <button type="button" className="danger" onClick={() => setDeleteTarget(page)} disabled={!canPerform(role, 'pages', 'delete')}>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      ) : null}

      <PageEditorModal
        mode={editorMode}
        initial={editorInitial}
        open={editorOpen}
        submitting={editorSubmitting}
        errors={formErrors}
        onClose={() => setEditorOpen(false)}
        onSubmit={savePage}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete page"
        message="This action removes the page and cannot be undone from this table view."
        confirmLabel="Delete page"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deletePage}
      />

      <ConfirmModal
        open={Boolean(batchAction)}
        title={`Batch ${batchAction ?? ''}`}
        message={`Preflight checks will run before ${batchAction ?? ''}. Pages failing guardrails are skipped with warnings.`}
        confirmLabel={`Continue ${batchAction ?? ''}`}
        onCancel={() => setBatchAction(null)}
        onConfirm={runBatch}
      />

      {versionPage ? (
        <div className="dashboard-modal-backdrop" role="dialog" aria-modal="true">
          <article className="dashboard-modal-card dashboard-modal-card--wide">
            <div className="dashboard-panel__header dashboard-panel__header--spread">
              <h3>Version history — {versionPage.title}</h3>
              <button type="button" onClick={() => setVersionPage(null)}>
                Close
              </button>
            </div>
            <div className="dashboard-version-grid">
              <div>
                <h4>Snapshots</h4>
                <ul className="dashboard-simple-list">
                  {versions.map((version) => (
                    <li key={version.id}>
                      <strong>v{version.version}</strong> · {version.capturedAt.slice(0, 10)} · {version.reason}
                      <div className="dashboard-actions-inline">
                        <button type="button" onClick={() => setCompareFrom(version.version)}>
                          Compare from
                        </button>
                        <button type="button" onClick={() => setCompareTo(version.version)}>
                          Compare to
                        </button>
                        <button type="button" onClick={() => void rollback(version.version)}>
                          Rollback
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Snapshot compare</h4>
                <p>
                  From <strong>{compareFrom ?? '-'}</strong> to <strong>{compareTo ?? '-'}</strong>
                </p>
                <button type="button" onClick={() => void runCompare()} disabled={!compareFrom || !compareTo}>
                  Compare snapshots
                </button>
                {compareResult ? (
                  <ul className="dashboard-simple-list">
                    {compareResult.changes.map((change) => (
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
