type NewsletterSignupProps = {
  title: string;
  description: string;
  emailPlaceholder: string;
  ctaLabel: string;
};

export function NewsletterSignup({
  title,
  description,
  emailPlaceholder,
  ctaLabel
}: NewsletterSignupProps) {
  return (
    <section className="newsletter-signup" aria-label="Newsletter signup">
      <div className="newsletter-signup__copy">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <form className="newsletter-signup__form" onSubmit={(event) => event.preventDefault()}>
        <input type="email" placeholder={emailPlaceholder} aria-label="Email address" />
        <button type="submit">{ctaLabel} -&gt;</button>
      </form>
    </section>
  );
}
