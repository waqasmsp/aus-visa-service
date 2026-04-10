import { Seo } from './components/seo/Seo';
import { isPrivateRoute } from './config/seo';
import { AboutPage } from './containers/AboutPage';
import { LandingPage } from './containers/LandingPage';

type AppProps = {
  pathname: string;
};

export default function App({ pathname }: AppProps) {
  const noIndex = isPrivateRoute(pathname);
  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const isAboutPage = normalizedPath === '/about-us';
  const seoTitle = isAboutPage ? 'About Us | Global Visas' : undefined;
  const seoDescription = isAboutPage
    ? 'Learn about Global Visas and how we make visa applications simple, accurate, and stress-free for travelers worldwide.'
    : undefined;
  const seoKeywords = isAboutPage
    ? ['about global visas', 'visa support', 'visa application guidance', 'travel visa help', 'global visas']
    : undefined;

  return (
    <>
      <Seo pathname={pathname} noIndex={noIndex} title={seoTitle} description={seoDescription} keywords={seoKeywords} />
      {isAboutPage ? <AboutPage pathname={pathname} /> : <LandingPage pathname={pathname} />}
    </>
  );
}
