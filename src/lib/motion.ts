"use client";

/**
 * Centralised motion system.
 *
 * GSAP is the single animation engine for anything beyond a simple state
 * change (those stay as CSS transitions). Everything here is:
 *   - reduced-motion aware (no motion at all when the user asks for none),
 *   - cleaned up on unmount through `gsap.context()` reverts,
 *   - transform/opacity only, so it never triggers layout.
 */

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Motion timing tokens, shared by JS and CSS. */
export const MOTION = {
  ease: "power3.out",
  enterDuration: 0.62,
  enterStagger: 0.055,
  scrollDuration: 0.7,
  scrollY: 22,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let pluginsRegistered = false;

function ensurePlugins() {
  if (pluginsRegistered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  pluginsRegistered = true;
}

/**
 * Staggered entrance for every `[data-reveal]` descendant of the returned ref.
 *
 * Runs in `useLayoutEffect`, so GSAP sets the "from" values before the browser
 * paints the committed DOM — no flash of the final state.
 *
 * @param deps re-run when these change (e.g. after async data arrives).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  deps: readonly unknown[] = []
) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    ensurePlugins();

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", root);
      if (items.length === 0) return;

      gsap.from(items, {
        autoAlpha: 0,
        y: 18,
        duration: MOTION.enterDuration,
        ease: MOTION.ease,
        stagger: MOTION.enterStagger,
        clearProps: "transform,opacity,visibility",
      });
    }, root);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/**
 * Scroll-triggered entrance for `[data-reveal]` descendants, for editorial
 * sections that sit below the fold. Each element fires once.
 *
 * Should not be used inside the reading surface: scroll effects must never
 * compete with the native reading scroll.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  deps: readonly unknown[] = []
) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    ensurePlugins();

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", root);
      if (items.length === 0) return;

      items.forEach((item) => {
        gsap.from(item, {
          autoAlpha: 0,
          y: MOTION.scrollY,
          duration: MOTION.scrollDuration,
          ease: MOTION.ease,
          clearProps: "transform,opacity,visibility",
          scrollTrigger: {
            trigger: item,
            start: "top 88%",
            once: true,
          },
        });
      });
    }, root);

    return () => {
      ctx.revert();
      ctx.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
