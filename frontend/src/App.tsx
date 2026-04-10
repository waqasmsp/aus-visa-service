import { Seo } from './components/seo/Seo';
import { isPrivateRoute } from './config/seo';
import { LandingPage } from './containers/LandingPage';

type AppProps = {
  pathname: string;
};

export default function App({ pathname }: AppProps) {
  const noIndex = isPrivateRoute(pathname);

  return (
    <>
      <Seo pathname={pathname} noIndex={noIndex} />
      <LandingPage />
    </>
  );
}
