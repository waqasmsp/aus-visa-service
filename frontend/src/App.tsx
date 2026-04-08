import logo from './assets/logo.svg';
import heroIllustration from './assets/hero-illustration.svg';
import iconCheck from './assets/icon-check.svg';

const highlights = [
  'Fast visa eligibility checks',
  'Step-by-step application guidance',
  'Clear document checklist and progress tracking'
];

export default function App() {
  return (
    <div className="page-shell">
      <header className="site-header">
        <a href="#" className="brand">
          <img src={logo} alt="AUS Visa Service logo" />
          <span>AUS Visa Service</span>
        </a>
        <nav className="site-nav">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#contact">Contact</a>
          <button type="button" className="btn btn-outline">Sign in</button>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <p className="eyebrow">Visa support for Australia</p>
            <h1>Start your Australian visa journey with confidence.</h1>
            <p className="hero-copy">
              A clean, guided experience for discovering visa options, preparing documentation,
              and submitting your next application.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary">Check eligibility</button>
              <button type="button" className="btn btn-secondary">View visa types</button>
            </div>
          </div>
          <div className="hero-visual">
            <img src={heroIllustration} alt="Illustration of travel documents and plane" />
          </div>
        </section>

        <section className="feature-strip" id="features">
          {highlights.map((item) => (
            <article key={item} className="feature-item">
              <img src={iconCheck} alt="check icon" />
              <p>{item}</p>
            </article>
          ))}
        </section>

        <section className="info" id="how-it-works">
          <h2>Landing page shell</h2>
          <p>
            This static base route is ready for future API integrations and additional routes,
            while matching a modern marketing page structure.
          </p>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <p>© {new Date().getFullYear()} AUS Visa Service. All rights reserved.</p>
      </footer>
    </div>
  );
}
