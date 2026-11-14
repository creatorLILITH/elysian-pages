"use client";

import "./LandingPage.css";
import Link from "next/link";

import ThemeToggle from "@/components/ui/ThemeToggle";
import { useReveal, useScrollReveal } from "@/lib/motion";

import readingShadow from "@/assets/reading-shadow.png";

const FEATURES = [
  {
    icon: "📖",
    title: "Immersive Reading",
    text: "Enjoy distraction-free reading with elegant typography and themes.",
  },
  {
    icon: "✨",
    title: "Smart Notes",
    text: "Save your thoughts, reflections, and favorite moments while reading.",
  },
  {
    icon: "🔖",
    title: "Bookmarks",
    text: "Mark meaningful pages and continue exactly where you left off.",
  },
];

function LandingPage() {
  const heroRef = useReveal<HTMLDivElement>([]);
  const editorialRef = useScrollReveal<HTMLDivElement>([]);

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="nav landing__nav" aria-label="Primary">
        <div className="nav__brand">
          <svg className="landing__mark" width="34" height="34" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M10 30C3 21 14 5 20 7c4 2-12 19-7 21S31 4 33 10 18 32 22 31s11-10 13-5-13 13-21 7M8 34l23-5" /></svg>
          <span className="nav__name">Elysian Pages</span>
        </div>

        <div className="nav__links">
          <Link href="/login" className="nav__link">
            Login
          </Link>
          <Link href="/signup" className="btn btn--primary btn--sm">
            Sign Up
          </Link>
        </div>

        <div className="nav__actions">
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero */}
      <header className="hero landing__hero">
        <div className="landing__art" aria-hidden="true">
          <img src={readingShadow.src} alt="" />
          <span className="landing__art-caption">Lose yourself. Find a story.</span>
        </div>
        <div className="hero__scrim" />

        <div className="container">
          <div className="hero__inner" ref={heroRef}>
            <p className="eyebrow" data-reveal>
              A private digital library
            </p>

            <h1 className="display t-hero landing__headline" data-reveal>
              A quiet place<br />for <em>readers.</em>
            </h1>

            <p className="lede landing__lede" data-reveal>
              Immerse yourself in stories, organize your library, and create a
              calm digital reading experience.
            </p>

            <div className="hero__actions" data-reveal>
              <Link href="/login" className="btn btn--primary landing__cta">
                Enter Library
                <span aria-hidden="true" className="landing__cta-arrow">
                  →
                </span>
              </Link>
              <Link href="/signup" className="btn btn--ghost">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div ref={editorialRef}>
        {/* Features */}
        <section className="section container landing__features">
          {FEATURES.map((feature, index) => (
            <article className="card landing__feature" key={feature.title} data-reveal>
              <span className="landing__feature-icon" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="t-h">{feature.title}</h3>
              <p className="muted">{feature.text}</p>
            </article>
          ))}
        </section>

        {/* Editorial band */}
        <section className="landing__band">
          <img
            src={readingShadow.src}
            alt="An open book resting in warm, dim light"
            className="landing__band-image"
            data-reveal
          />
          <div className="landing__band-scrim" aria-hidden="true" />
        </section>

        {/* Quote */}
        <section className="section container landing__quote-wrap">
          <blockquote className="landing__quote" data-reveal>
            “A reader lives a thousand lives before he dies.”
          </blockquote>
        </section>

        {/* Final CTA */}
        <section className="section container landing__cta-section">
          <div className="surface surface--glass landing__cta-panel" data-reveal>
            <h2 className="display t-title">Begin Your Reading Journey</h2>

            <div className="landing__cta-buttons">
              <Link href="/signup" className="btn btn--primary">
                Create Account
              </Link>
              <Link href="/login" className="btn btn--secondary">
                Login
              </Link>
            </div>
          </div>
        </section>
      </div>
      <footer className="landing__footer container"><span className="nav__name">Elysian Pages</span><span className="small muted">A quiet place for readers.</span></footer>
    </div>
  );
}

export default LandingPage;
