import { useId, useRef } from 'react';
import { useFocusTrap } from '../common/useFocusTrap';

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
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  useFocusTrap({ active: isOpen, containerRef: drawerRef, initialFocusRef: closeRef, onClose });

  return (
    <aside
      ref={drawerRef}
      className={`dashboard-blog-preview-drawer ${isOpen ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="dashboard-panel__header dashboard-panel__header--spread">
        <h2 id={titleId}>Preview</h2>
        <button ref={closeRef} type="button" className="dashboard-ghost-button" onClick={onClose}>
          Close
        </button>
      </div>
      <p id={descriptionId} className="sr-only">Preview the current blog content in editor and public shell mode.</p>

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
