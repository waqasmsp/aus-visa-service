import { useLocation } from 'react-router-dom';
import { Seo } from './components/seo/Seo';
import { isPrivateRoute } from './config/seo';
import { LandingPage } from './containers/LandingPage';

export default function App() {
  const location = useLocation();
  const noIndex = isPrivateRoute(location.pathname);

  return (
    <>
      <Seo pathname={location.pathname} noIndex={noIndex} />
      <LandingPage />
    </>
  );
}
