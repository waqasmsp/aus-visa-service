import { Seo } from './components/seo/Seo';
import { isPrivateRoute } from './config/seo';
import { LandingPage } from './containers/LandingPage';

export default function App() {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname;
  const noIndex = isPrivateRoute(pathname);

  return (
    <>
      <Seo pathname={pathname} noIndex={noIndex} />
      <LandingPage />
    </>
  );
}
