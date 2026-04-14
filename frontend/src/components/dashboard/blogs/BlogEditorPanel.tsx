import { useEffect, useMemo, useState } from 'react';
import { BlogEditorForm } from './BlogEditorForm';
import { PostPreviewDrawer } from './PostPreviewDrawer';
import { PublishingControls } from './PublishingControls';
import { SeoSidebar } from './SeoSidebar';

type DashboardRole = 'admin' | 'manager' | 'user';

type BlogEditorState = {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  imageAlt: string;
  categoryIds: string[];
  tagIds: string[];
  content: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogImage: string;
};

const existingPosts = [
  { title: 'Australia Tourist Visa Guide 2026', slug: 'australia-tourist-visa-guide-2026' },
  { title: 'Student Visa Checklist', slug: 'student-visa-checklist' }
];

const categories = [
  { id: 'guides', name: 'Guides' },
  { id: 'policy', name: 'Policy Updates' },
  { id: 'success', name: 'Success Stories' }
];

const tags = [
  { id: 'tourist-visa', name: 'Tourist Visa' },
  { id: 'student-visa', name: 'Student Visa' },
  { id: 'australia', name: 'Australia' },
  { id: 'checklist', name: 'Checklist' }
];

const initialState: BlogEditorState = {
  title: '',
  slug: '',
  excerpt: '',
  featuredImage: '',
  imageAlt: '',
  categoryIds: [],
  tagIds: [],
  content: '',
  seoTitle: '',
  metaDescription: '',
  focusKeyword: '',
  canonicalUrl: '',
  ogImage: ''
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const looksLikeImage = (value: string): boolean => /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value);

const isValidUrl = (value: string): boolean => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export function BlogEditorPanel({
  role,
  canCreate,
  canEdit,
  canManageSettings,
  canSubmitReview,
  canPublish,
  canArchive
}: {
  role: DashboardRole;
  canCreate: boolean;
  canEdit: boolean;
  canManageSettings: boolean;
  canSubmitReview: boolean;
  canPublish: boolean;
  canArchive: boolean;
}) {
  const [formState, setFormState] = useState<BlogEditorState>(initialState);
  const [savedState, setSavedState] = useState<BlogEditorState>(initialState);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [status, setStatus] = useState('Draft');
  const [scheduleAt, setScheduleAt] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'editor' | 'public-shell'>('editor');

  const dirty = useMemo(() => JSON.stringify(formState) !== JSON.stringify(savedState), [formState, savedState]);

  useEffect(() => {
    if (!slugManuallyEdited) {
      setFormState((current) => ({ ...current, slug: slugify(current.title) }));
    }
  }, [formState.title, slugManuallyEdited]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  const titleTaken = existingPosts.some((post) => post.title.toLowerCase() === formState.title.trim().toLowerCase());
  const slugTaken = existingPosts.some((post) => post.slug.toLowerCase() === formState.slug.trim().toLowerCase());

  const editorErrors = {
    title:
      formState.title.length < 15
        ? 'Title must be at least 15 characters.'
        : formState.title.length > 100
          ? 'Title must be at most 100 characters.'
          : titleTaken
            ? 'Another post already uses this title.'
            : '',
    slug:
      formState.slug.length < 8
        ? 'Slug must be at least 8 characters.'
        : slugTaken
          ? 'Slug already exists. Please choose a unique URL path.'
          : '',
    excerpt: formState.excerpt.length > 220 ? 'Excerpt should be 220 characters or fewer.' : '',
    content: formState.content.length < 40 ? 'Add richer body content before publishing.' : ''
  };

  const seoValidation = {
    seoTitle:
      formState.seoTitle.length < 30
        ? 'SEO title is short; target 30-60 characters.'
        : formState.seoTitle.length > 60
          ? 'SEO title is long; keep it under 60 characters.'
          : 'SEO title length looks good.',
    metaDescription:
      formState.metaDescription.length < 70
        ? 'Meta description is short; target 70-160 characters.'
        : formState.metaDescription.length > 160
          ? 'Meta description is too long; keep it under 160 characters.'
          : 'Meta description length looks good.',
    canonicalUrl: formState.canonicalUrl && !isValidUrl(formState.canonicalUrl) ? 'Canonical URL must start with http:// or https://.' : '',
    ogImageWarning: formState.ogImage && (!isValidUrl(formState.ogImage) || !looksLikeImage(formState.ogImage)) ? 'OG image may be broken (invalid URL or non-image path).' : ''
  };

  const imageWarnings = [
    formState.featuredImage && (!isValidUrl(formState.featuredImage) || !looksLikeImage(formState.featuredImage))
      ? 'Featured image URL appears broken or unsupported.'
      : '',
    formState.imageAlt.trim().length < 5 && formState.featuredImage ? 'Add descriptive alt text for the featured image.' : ''
  ].filter(Boolean);

  const setField = (field: keyof BlogEditorState, value: string | string[]) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const hasBlockingError = Boolean(editorErrors.title || editorErrors.slug || editorErrors.content || seoValidation.canonicalUrl);

  const handleWorkflowAction = (action: 'save-draft' | 'submit-review' | 'schedule' | 'publish-now' | 'archive' | 'reset') => {
    if (action === 'reset') {
      if (!dirty || window.confirm('Discard unsaved changes and revert to last saved state?')) {
        setFormState(savedState);
      }
      return;
    }

    if ((action === 'submit-review' || action === 'schedule' || action === 'publish-now') && hasBlockingError) {
      window.alert('Please resolve title, slug, content, and canonical URL validation before continuing.');
      return;
    }

    if (action === 'schedule' && !scheduleAt) {
      window.alert('Please choose a date/time for scheduling.');
      return;
    }

    setSavedState(formState);

    if (action === 'save-draft') setStatus('Draft saved');
    if (action === 'submit-review') setStatus('In review');
    if (action === 'schedule') setStatus(`Scheduled • ${scheduleAt} (${timezone})`);
    if (action === 'publish-now') setStatus('Published');
    if (action === 'archive') setStatus('Archived');
  };

  return (
    <article className="dashboard-blog-editor">
      <section className="dashboard-panel dashboard-panel--accent">
        <div className="dashboard-panel__header dashboard-panel__header--spread">
          <h2>Blog Editor</h2>
          <small>{role === 'admin' ? 'Blog Management' : 'Blog Editorial'}</small>
        </div>

        <ul className="dashboard-simple-list">
          <li>Create drafts: {canCreate ? 'Allowed' : 'Restricted'}</li>
          <li>Edit content: {canEdit ? 'Allowed' : 'Restricted'}</li>
          <li>SEO/settings controls: {canManageSettings ? 'Allowed' : 'Restricted'}</li>
        </ul>

        {imageWarnings.length > 0 ? (
          <div className="dashboard-blog-warnings">
            {imageWarnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}

        <div className="dashboard-actions-inline dashboard-blog-preview-toggles">
          <button type="button" onClick={() => { setPreviewMode('editor'); setPreviewOpen(true); }}>
            In-editor preview
          </button>
          <button type="button" onClick={() => { setPreviewMode('public-shell'); setPreviewOpen(true); }}>
            Public page shell
          </button>
        </div>
      </section>

      <div className="dashboard-blog-editor-layout">
        <BlogEditorForm
          value={formState}
          errors={editorErrors}
          categories={categories}
          tags={tags}
          slugManuallyEdited={slugManuallyEdited}
          onSlugManualToggle={setSlugManuallyEdited}
          onFieldChange={setField}
        />

        <SeoSidebar
          value={{
            seoTitle: formState.seoTitle,
            metaDescription: formState.metaDescription,
            focusKeyword: formState.focusKeyword,
            canonicalUrl: formState.canonicalUrl,
            ogImage: formState.ogImage
          }}
          validation={seoValidation}
          onFieldChange={setField}
        />
      </div>

      <PublishingControls
        canSubmitReview={canSubmitReview}
        canPublish={canPublish}
        canArchive={canArchive}
        scheduleAt={scheduleAt}
        timezone={timezone}
        dirty={dirty}
        status={status}
        onScheduleChange={setScheduleAt}
        onTimezoneChange={setTimezone}
        onAction={handleWorkflowAction}
      />

      <PostPreviewDrawer
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={formState.title}
        excerpt={formState.excerpt}
        slug={formState.slug}
        featuredImage={formState.featuredImage}
        content={formState.content}
        mode={previewMode}
      />
    </article>
  );
}
