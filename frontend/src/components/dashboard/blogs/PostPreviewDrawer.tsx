type PostPreviewDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  excerpt: string;
  slug: string;
  featuredImage: string;
  content: string;
  mode: 'editor' | 'public-shell';
};

export function PostPreviewDrawer({
  isOpen,
  onClose,
  title,
  excerpt,
  slug,
  featuredImage,
  content,
  mode
}: PostPreviewDrawerProps) {
  return (
    <aside className={`dashboard-blog-preview-drawer ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <h2>Preview</h2>
        <button type="button" className="dashboard-ghost-button" onClick={onClose}>
          Close
        </button>
      </div>

      {mode === 'editor' ? (
        <article className="dashboard-blog-preview-body">
          <small className="dashboard-chip dashboard-chip--draft">In-editor preview</small>
          <h3>{title || 'Untitled draft'}</h3>
          <p>{excerpt || 'Add an excerpt to see your listing preview.'}</p>
          {featuredImage ? <img src={featuredImage} alt={title || 'Post preview'} /> : null}
          <pre>{content || 'No content added yet.'}</pre>
        </article>
      ) : (
        <div className="landing-page dashboard-blog-public-shell">
          <section className="landing-section landing-section--hero dashboard-blog-public-shell__hero">
            <div className="section-container">
              <small className="dashboard-chip dashboard-chip--published">Public page shell</small>
              <h3>{title || 'Untitled draft'}</h3>
              <p>{excerpt || 'Add an excerpt to shape your public hero copy.'}</p>
              <p className="dashboard-blog-public-shell__slug">/{slug || 'draft-slug'}</p>
            </div>
          </section>
          <section className="landing-section">
            <div className="section-container">
              <pre>{content || 'Add content to see the public layout flow.'}</pre>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
