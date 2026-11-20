import { Link } from 'react-router-dom';

/*
  Landing page — the public home page of CareBridge.
  It has three main parts:
    1. Hero: badge + heading + intro text, and three large action cards
    2. "How it works": three numbered steps
    3. Footer: a partnership link for municipalities
*/

// ===== Inline SVG icons (no emoji, for accessibility and crispness) =====

// Single-person icon used on the "I need help" card
function PersonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

// Two-people icon used on the "I help a family member" card
function PeopleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-5 6.5-5s6.5 1.5 6.5 5" />
      <circle cx="17" cy="9" r="3" />
      <path d="M15.5 14.5c2.8 0 5 1.3 5 4" />
    </svg>
  );
}

// Heart icon used on the "I want to volunteer" card
function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20s-7-4.5-9.5-9C1 8 3 4.5 6.5 4.5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 4.5 23 8 21.5 11 19 15.5 12 20 12 20z" />
    </svg>
  );
}

// ===== The three hero action cards =====
// Each card is a big link that takes the user to the register page.
const heroCards = [
  {
    to: '/register',
    icon: <PersonIcon />,
    title: 'I need help',
    desc: 'Post a request for yourself',
  },
  {
    to: '/register',
    icon: <PeopleIcon />,
    title: 'I help a family member',
    desc: 'Ask for help for a parent or relative, and follow every step',
  },
  {
    to: '/register',
    icon: <HeartIcon />,
    title: 'I want to volunteer',
    desc: 'Help seniors in your area after a one-time identity check',
  },
];

// ===== The three "How it works" steps =====
const steps = [
  {
    number: 1,
    title: 'Ask for help',
    desc: 'A senior or a family member posts what is needed and when.',
  },
  {
    number: 2,
    title: 'A volunteer accepts',
    desc: 'Verified volunteers nearby who speak the language get a notification.',
  },
  {
    number: 3,
    title: 'Call and meet',
    desc: 'Contact details appear for both sides, so you agree on the details by phone.',
  },
];

function Landing() {
  return (
    <>
      {/* ===== Hero section ===== */}
      <section className="page hero">
        {/* Left column: badge, heading, intro text */}
        <div className="hero__text">
          <span className="badge">Community support in Finland</span>
          <h1 className="hero__heading">Everyday help from people nearby</h1>
          <p className="hero__intro">
            Seniors and their families ask for help with shopping, getting around
            or simply some company. Verified local volunteers answer.
          </p>
        </div>

        {/* Right column: three large clickable cards */}
        <div className="hero__cards">
          {heroCards.map((card) => (
            <Link key={card.title} to={card.to} className="card-link">
              <span className="card-link__icon">{card.icon}</span>
              <span className="card-link__body">
                <span className="card-link__title">{card.title}</span>
                <span className="card-link__desc">{card.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how-it-works" className="page how-it-works">
        <h2 className="how-it-works__heading">How it works</h2>
        <div className="steps">
          {steps.map((step) => (
            <article key={step.number} className="step">
              <span className="step__number">{step.number}</span>
              <h3 className="step__title">{step.title}</h3>
              <p className="step__desc">{step.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="site-footer">
        <div className="page" style={{ padding: '0' }}>
          Municipality?{' '}
          <a href="#partnerships">Learn about partnerships</a>
        </div>
      </footer>
    </>
  );
}

export default Landing;
