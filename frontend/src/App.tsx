import { Seo } from './components/seo/Seo';
import { isPrivateRoute } from './config/seo';
import { AboutPage } from './containers/AboutPage';
import { ApplicationPage } from './containers/ApplicationPage';
import { DashboardExperience } from './containers/dashboard/DashboardExperience';
import { LandingPage } from './containers/LandingPage';

type AppProps = {
  pathname: string;
};

export default function App({ pathname }: AppProps) {
  const noIndex = isPrivateRoute(pathname);
  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const isDashboardRoute =
    normalizedPath.startsWith('/dashboard') ||
    normalizedPath.startsWith('/manager-dashboard') ||
    normalizedPath.startsWith('/user-dashboard') ||
    normalizedPath === '/login' ||
    normalizedPath === '/signup';
  const isAboutPage = normalizedPath === '/about-us';
  const isApplicationPage = normalizedPath === '/application' || normalizedPath === '/application-form';
  const seoTitle = isDashboardRoute
    ? 'Dashboard | AUS Visa Service'
    : isAboutPage
      ? 'About Us | Global Visas'
      : undefined;
  const seoDescription = isDashboardRoute
    ? 'AUS Visa Service dashboards for admins, managers, and users to manage applications, profiles, pages, and settings.'
    : isAboutPage
      ? 'Learn about Global Visas and how we make visa applications simple, accurate, and stress-free for travelers worldwide.'
      : undefined;
  const seoKeywords = isDashboardRoute
    ? ['dashboard', 'visa applications', 'admin panel', 'users management', 'visa workflow']
    : isAboutPage
      ? ['about global visas', 'visa support', 'visa application guidance', 'travel visa help', 'global visas']
      : undefined;

  return (
    <>
      <Seo pathname={pathname} noIndex={noIndex} title={seoTitle} description={seoDescription} keywords={seoKeywords} />
      {isDashboardRoute ? (
        <DashboardExperience pathname={pathname} />
      ) : isApplicationPage ? (
        <ApplicationPage pathname={pathname} />
      ) : isAboutPage ? (
        <AboutPage pathname={pathname} />
      ) : (
        <LandingPage pathname={pathname} />
      )}
    </>
  );
}
