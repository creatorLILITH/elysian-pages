import "./LandingPage.css";
import { Link } from "react-router-dom";

function LandingPage() {

  return (

    <div className="landing-page">

      {/* Navbar */}
      <nav className="navbar">

        <div className="logo">
        Elysian Pages
        </div>

        <div className="nav-links">

          <Link
            to="/login"
            className="nav-button"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="nav-button signup"
          >
            Sign Up
          </Link>

        </div>

      </nav>

      {/* Intro Section */}
      <section className="intro-section">

        <h1>
          A quiet place for readers.
        </h1>

        <p>
          Immerse yourself in stories,
          organize your library,
          and create a calm digital
          reading experience.
        </p>

        <Link
          to="/login"
          className="enter-button"
        >
          Enter Library
        </Link>

      </section>

      {/* Features */}
      <section className="features-section">

        <div className="feature-card">

          <h2>
            📖 Immersive Reading
          </h2>

          <p>
            Enjoy distraction-free
            reading with elegant
            typography and themes.
          </p>

        </div>

        <div className="feature-card">

          <h2>
            ✨ Smart Notes
          </h2>

          <p>
            Save your thoughts,
            reflections, and favorite
            moments while reading.
          </p>

        </div>

        <div className="feature-card">

          <h2>
            🔖 Bookmarks
          </h2>

          <p>
            Mark meaningful pages and
            continue exactly where
            you left off.
          </p>

        </div>

      </section>

      {/* Quote Section */}
      <section className="quote-section">

        <p>
          “A reader lives a thousand
          lives before he dies.”
        </p>

      </section>

      {/* Final CTA */}
      <section className="cta-section">

        <h2>
          Begin Your Reading Journey
        </h2>

        <div className="cta-buttons">

          <Link
            to="/signup"
            className="nav-button signup"
          >
            Create Account
          </Link>

          <Link
            to="/login"
            className="nav-button"
          >
            Login
          </Link>

        </div>

      </section>

    </div>
  );
}

export default LandingPage;