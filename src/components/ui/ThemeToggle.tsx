"use client";

/**
 * Colour-theme switch for the app shell.
 *
 * The theme is a presentational attribute on <html> (`data-theme`), applied
 * pre-paint by the inline script in the root layout. Rendering both icons and
 * letting CSS pick one keeps the markup identical on the server and the client,
 * so there is no hydration mismatch and no icon flash.
 */

const STORAGE_KEY = "elysian-theme";

function currentTheme(): "midnight" | "parchment" {
  if (typeof document === "undefined") return "midnight";
  return document.documentElement.dataset.theme === "parchment"
    ? "parchment"
    : "midnight";
}

export default function ThemeToggle() {
  const toggleTheme = () => {
    const next = currentTheme() === "midnight" ? "parchment" : "midnight";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Private-mode storage failures must not break the toggle. */
    }
  };

  return (
    <button
      type="button"
      className="btn btn--icon theme-toggle"
      onClick={toggleTheme}
      aria-label="Switch between the midnight and parchment themes"
      title="Switch colour theme"
    >
      <span className="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">
        ☀
      </span>
      <span className="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">
        ☾
      </span>
    </button>
  );
}
