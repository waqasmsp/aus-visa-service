import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

function AppRouter() {
  const [pathname, setPathname] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) {
        return;
      }

      const nextPath = `${url.pathname}${url.search}${url.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextPath === currentPath) {
        return;
      }

      event.preventDefault();
      window.history.pushState(null, '', nextPath);
      setPathname(window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    window.addEventListener('popstate', onPopState);
    document.addEventListener('click', onDocumentClick);
    return () => {
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('click', onDocumentClick);
    };
  }, []);

  return <App pathname={pathname} />;
}

const app = (
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
