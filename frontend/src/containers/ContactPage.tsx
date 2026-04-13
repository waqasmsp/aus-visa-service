import { FormEvent, useState } from 'react';
import { FooterMega } from '../components/landing/FooterMega';
import { HeaderNav } from '../components/landing/HeaderNav';
import { MobileBottomNav } from '../components/landing/MobileBottomNav';
import { NewsletterSignup } from '../components/landing/NewsletterSignup';
import { VisiaChat } from '../components/landing/VisiaChat';
import { landingContent } from '../constants/landingContent';
import { addContactEntry } from '../utils/contactEntries';

type ContactPageProps = {
  pathname: string;
};

type ContactFormState = {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
};

const initialFormState: ContactFormState = {
  name: '',
  phone: '',
  email: '',
  subject: '',
  message: ''
};

const navigateTo = (path: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.location.assign(path);
};

export function ContactPage({ pathname }: ContactPageProps) {
  const { brandName, navItems, loginCta, newsletter, footer } = landingContent;
  const [formState, setFormState] = useState<ContactFormState>(initialFormState);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const updateField = (field: keyof ContactFormState, value: string): void => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const submitForm = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const payload = {
      name: formState.name.trim(),
      phone: formState.phone.trim(),
      email: formState.email.trim(),
      subject: formState.subject.trim(),
      message: formState.message.trim()
    };

    if (!payload.name || !payload.phone || !payload.email || !payload.subject || !payload.message) {
      setStatus({ type: 'error', message: 'Please fill all required fields before submitting.' });
      return;
    }

    try {
      addContactEntry(payload);
      setFormState(initialFormState);
      setStatus({ type: 'success', message: 'Thanks. Our team has received your message and will contact you shortly.' });
    } catch {
      setStatus({ type: 'error', message: 'Unable to submit right now. Please try again in a moment.' });
    }
  };

  return (
    <div className="landing-page contact-page">
      <section className="landing-section landing-section--header">
        <div className="content-container">
          <HeaderNav brandName={brandName} navItems={navItems} loginCta={loginCta} pathname={pathname} />
        </div>
      </section>

      <main className="landing-main contact-main">
        <section className="landing-section landing-section--contact">
          <div className="content-container">
            <article className="contact-card" aria-labelledby="contact-heading">
              <div className="contact-card__intro">
                <p className="contact-card__eyebrow">Drop Us A Line</p>
                <h1 id="contact-heading">Contact Our Visa Team</h1>
                <p>
                  Global Visas will arrange your first business consultation free of cost. Share your details and we
                  will guide you on the next best step.
                </p>
                <span className="contact-card__divider" aria-hidden="true" />
              </div>

              <form className="contact-form" onSubmit={submitForm}>
                <label>
                  <span className="sr-only">Name</span>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="Name*"
                    required
                  />
                </label>
                <label>
                  <span className="sr-only">Phone number</span>
                  <input
                    type="tel"
                    value={formState.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    placeholder="Phone No*"
                    required
                  />
                </label>
                <label>
                  <span className="sr-only">Email</span>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="E-mail*"
                    required
                  />
                </label>
                <label>
                  <span className="sr-only">Subject</span>
                  <input
                    type="text"
                    value={formState.subject}
                    onChange={(event) => updateField('subject', event.target.value)}
                    placeholder="Subject*"
                    required
                  />
                </label>
                <label className="contact-form__message">
                  <span className="sr-only">Message</span>
                  <textarea
                    value={formState.message}
                    onChange={(event) => updateField('message', event.target.value)}
                    placeholder="Text*"
                    rows={6}
                    required
                  />
                </label>

                <div className="contact-form__actions">
                  <button type="submit">Contact Us</button>
                </div>

                {status ? (
                  <p className={`contact-form__status contact-form__status--${status.type}`} role="status">
                    {status.message}
                  </p>
                ) : null}
              </form>
            </article>
          </div>
        </section>
      </main>

      <section className="landing-section landing-section--newsletter">
        <div className="content-container">
          <NewsletterSignup
            title={newsletter.title}
            description={newsletter.description}
            emailPlaceholder={newsletter.emailPlaceholder}
            ctaLabel={newsletter.ctaLabel}
          />
        </div>
      </section>

      <section className="landing-section landing-section--footer">
        <div className="content-container">
          <FooterMega
            brandName={brandName}
            tagline={footer.tagline}
            visaRoutes={footer.visaRoutes}
            visaNews={footer.visaNews}
            blogs={footer.blogs}
            companyLinks={footer.companyLinks}
            socialLinks={footer.socialLinks}
            copyright={footer.copyright}
          />
        </div>
      </section>

      <MobileBottomNav pathname={pathname} onApplyNow={() => navigateTo('/application')} />
      <VisiaChat />
    </div>
  );
}
