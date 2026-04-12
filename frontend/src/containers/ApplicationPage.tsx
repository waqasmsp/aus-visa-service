import { ApplicationStepOneForm } from '../components/landing/ApplicationStepOneForm';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { landingContent } from '../constants/landingContent';

type ApplicationPageProps = {
  pathname: string;
};

const navigateTo = (path: string) => {
  if (typeof window !== 'undefined') {
    window.location.assign(path);
  }
};

export function ApplicationPage({ pathname }: ApplicationPageProps) {
  const { brandName, navItems, loginCta } = landingContent;

  return (
    <div className="landing-page">
      <section className="landing-section landing-section--header">
        <div className="content-container">
          <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} pathname={pathname} />
        </div>
      </section>

      <main className="landing-main">
        <section className="landing-section landing-section--application">
          <ApplicationStepOneForm onClose={() => navigateTo('/')} />
        </section>
      </main>

      <MobileBottomNav pathname={pathname} onApplyNow={() => navigateTo('/application')} />
    </div>
  );
}
