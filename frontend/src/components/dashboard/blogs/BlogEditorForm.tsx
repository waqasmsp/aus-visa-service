import { ChangeEvent } from 'react';

type BlogEditorData = {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  imageAlt: string;
  content: string;
  categoryIds: string[];
  tagIds: string[];
};

type BlogEditorErrors = Partial<Record<'title' | 'slug' | 'excerpt' | 'content', string>>;

type BlogEditorFormProps = {
  value: BlogEditorData;
  errors: BlogEditorErrors;
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
  slugManuallyEdited: boolean;
  onFieldChange: (field: keyof BlogEditorData, value: string | string[]) => void;
  onSlugManualToggle: (enabled: boolean) => void;
};

export function BlogEditorForm({
  value,
  errors,
  categories,
  tags,
  slugManuallyEdited,
  onFieldChange,
  onSlugManualToggle
}: BlogEditorFormProps) {
  const handleMultiSelect = (event: ChangeEvent<HTMLSelectElement>, field: 'categoryIds' | 'tagIds') => {
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    onFieldChange(field, selected);
  };

  return (
    <section className="dashboard-panel dashboard-blog-editor__main">
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <h2>Post Content</h2>
        <small>Use markdown or block notes</small>
      </div>

      <div className="dashboard-blog-form-grid">
        <label className="dashboard-settings-grid-label">
          <span>Title</span>
          <input
            value={value.title}
            onChange={(event) => onFieldChange('title', event.target.value)}
            placeholder="How to apply for an Australian tourist visa"
            maxLength={110}
          />
          <small className="dashboard-blog-form-hint">60-90 characters recommended.</small>
          {errors.title ? <small className="dashboard-blog-form-error">{errors.title}</small> : null}
        </label>

        <label className="dashboard-settings-grid-label">
          <span>Slug</span>
          <input
            value={value.slug}
            onChange={(event) => {
              onSlugManualToggle(true);
              onFieldChange('slug', event.target.value);
            }}
            placeholder="/blog/australia-tourist-visa-guide"
          />
          <small className="dashboard-blog-form-hint">{slugManuallyEdited ? 'Manual override enabled.' : 'Auto-generated from title.'}</small>
          {errors.slug ? <small className="dashboard-blog-form-error">{errors.slug}</small> : null}
        </label>

        <label className="dashboard-settings-grid-label dashboard-settings-grid-label--full">
          <span>Excerpt</span>
          <textarea
            value={value.excerpt}
            onChange={(event) => onFieldChange('excerpt', event.target.value)}
            placeholder="Summarize this post in 1-2 lines for listing pages and metadata previews."
            rows={3}
          />
          {errors.excerpt ? <small className="dashboard-blog-form-error">{errors.excerpt}</small> : null}
        </label>

        <label className="dashboard-settings-grid-label">
          <span>Featured image URL</span>
          <input
            value={value.featuredImage}
            onChange={(event) => onFieldChange('featuredImage', event.target.value)}
            placeholder="https://cdn.example.com/blog/hero.jpg"
          />
        </label>

        <label className="dashboard-settings-grid-label">
          <span>Image alt text</span>
          <input
            value={value.imageAlt}
            onChange={(event) => onFieldChange('imageAlt', event.target.value)}
            placeholder="Sydney Opera House at sunset"
          />
        </label>

        <label className="dashboard-settings-grid-label">
          <span>Category</span>
          <select multiple value={value.categoryIds} onChange={(event) => handleMultiSelect(event, 'categoryIds')}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="dashboard-settings-grid-label">
          <span>Tags</span>
          <select multiple value={value.tagIds} onChange={(event) => handleMultiSelect(event, 'tagIds')}>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>

        <label className="dashboard-settings-grid-label dashboard-settings-grid-label--full">
          <span>Rich content (Markdown / block notes)</span>
          <textarea
            value={value.content}
            onChange={(event) => onFieldChange('content', event.target.value)}
            placeholder={'## Introduction\n\nExplain eligibility, required documents, and timelines.'}
            rows={12}
          />
          {errors.content ? <small className="dashboard-blog-form-error">{errors.content}</small> : null}
        </label>
      </div>
    </section>
  );
}
