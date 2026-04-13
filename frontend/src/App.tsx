import { Seo } from './components/seo/Seo';
import { isPrivateRoute } from './config/seo';
import { AboutPage } from './containers/AboutPage';
import { ApplicationPage } from './containers/ApplicationPage';
import { ContactPage } from './containers/ContactPage';
import { DashboardExperience } from './containers/dashboard/DashboardExperience';
import { LandingPage } from './containers/LandingPage';
import { PricingPage } from './containers/PricingPage';
import { VisaDetailsPage } from './containers/VisaDetailsPage';
import { VisaServicesPage } from './containers/VisaServicesPage';

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
  const isContactPage = normalizedPath === '/contact-us';
  const isPricingPage = normalizedPath === '/pricing';
  const isVisaDetailsPage = normalizedPath.startsWith('/visa/');
  const isVisaServicesPage = normalizedPath === '/visa-services';
  const seoTitle = isDashboardRoute
    ? 'Dashboard | AUS Visa Service'
    : isAboutPage
      ? 'About Us | Global Visas'
      : isPricingPage
        ? 'Pricing | Global Visas'
      : isContactPage
        ? 'Contact Us | Global Visas'
        : isVisaServicesPage
          ? 'Visa Services | Global Visas'
          : isVisaDetailsPage
            ? 'Visa Details | Global Visas'
      : undefined;
  const seoDescription = isDashboardRoute
    ? 'AUS Visa Service dashboards for admins, managers, and users to manage applications, profiles, pages, and settings.'
    : isAboutPage
      ? 'Learn about Global Visas and how we make visa applications simple, accurate, and stress-free for travelers worldwide.'
      : isPricingPage
        ? 'Explore Global Visas pricing packages for ETA and Visitor Visa services with transparent per-attempt costs.'
      : isContactPage
        ? 'Get in touch with Global Visas for consultation, visa support, and application guidance from our specialist team.'
        : isVisaServicesPage
          ? 'Browse all Australian visa services with structured guidance, service comparisons, and direct links to detailed pages.'
          : isVisaDetailsPage
            ? 'Explore Australian visitor visa options, compare subclass pathways, and apply online with guided support.'
      : undefined;
  const seoKeywords = isDashboardRoute
    ? ['dashboard', 'visa applications', 'admin panel', 'users management', 'visa workflow']
    : isAboutPage
      ? ['about global visas', 'visa support', 'visa application guidance', 'travel visa help', 'global visas']
      : isPricingPage
        ? ['visa pricing', 'eta 601 price', 'visitor visa 600 fee', 'australia visa packages', 'global visas pricing']
      : isContactPage
        ? ['contact global visas', 'visa support contact', 'visa consultation', 'help center', 'contact us']
        : isVisaServicesPage
          ? ['visa services australia', 'australian visa types', 'visitor visa options', 'visa comparison', 'global visas']
          : isVisaDetailsPage
            ? ['visitor visa 600', 'eta 601', 'evisitor 651', 'australia visa options', 'apply australia visa']
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
      ) : isContactPage ? (
        <ContactPage pathname={pathname} />
      ) : isPricingPage ? (
        <PricingPage pathname={pathname} />
      ) : isVisaServicesPage ? (
        <VisaServicesPage pathname={pathname} />
      ) : isVisaDetailsPage ? (
        <VisaDetailsPage pathname={pathname} />
      ) : (
        <LandingPage pathname={pathname} />
      )}
    </>
  );
}
