type SeoData = {
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogImage: string;
};

type SeoSidebarProps = {
  value: SeoData;
  validation: {
    seoTitle: string;
    metaDescription: string;
    canonicalUrl?: string;
    ogImageWarning?: string;
  };
  onFieldChange: (field: keyof SeoData, value: string) => void;
};

export function SeoSidebar({ value, validation, onFieldChange }: SeoSidebarProps) {
  return (
    <aside className="dashboard-panel dashboard-blog-editor__seo">
      <div className="dashboard-panel__header">
        <h2>SEO Sidebar</h2>
        <small>Search + social metadata</small>
      </div>

      <div className="dashboard-blog-form-grid dashboard-blog-form-grid--single">
        <label className="dashboard-settings-grid-label">
          <span>SEO title</span>
          <input value={value.seoTitle} onChange={(event) => onFieldChange('seoTitle', event.target.value)} maxLength={110} />
          <small className="dashboard-blog-form-hint">{validation.seoTitle}</small>
        </label>

        <label className="dashboard-settings-grid-label">
          <span>Meta description</span>
          <textarea
            value={value.metaDescription}
            onChange={(event) => onFieldChange('metaDescription', event.target.value)}
            rows={4}
            maxLength={200}
          />
          <small className="dashboard-blog-form-hint">{validation.metaDescription}</small>
        </label>

        <label className="dashboard-settings-grid-label">
          <span>Focus keyword</span>
          <input value={value.focusKeyword} onChange={(event) => onFieldChange('focusKeyword', event.target.value)} />
        </label>

        <label className="dashboard-settings-grid-label">
          <span>Canonical URL</span>
          <input value={value.canonicalUrl} onChange={(event) => onFieldChange('canonicalUrl', event.target.value)} />
          {validation.canonicalUrl ? <small className="dashboard-blog-form-error">{validation.canonicalUrl}</small> : null}
        </label>

        <label className="dashboard-settings-grid-label">
          <span>OG image override</span>
          <input value={value.ogImage} onChange={(event) => onFieldChange('ogImage', event.target.value)} />
          {validation.ogImageWarning ? <small className="dashboard-blog-form-warning">{validation.ogImageWarning}</small> : null}
        </label>
      </div>
    </aside>
  );
}
