"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useReveal } from "@/lib/motion";

export default function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <main className="auth-layout">
      <aside className="auth-editorial">
        <Link href="/" className="nav__name">Elysian Pages</Link>
        <div>
          <p className="eyebrow">A private digital library</p>
          <h2 className="display">Between the covers,<br /><em>another world.</em></h2>
          <p className="lede">A little space for stories, thoughts, and the books you return to.</p>
        </div>
        <p className="small">Read slowly. Stay a while.</p>
      </aside>
      <div className="auth-main" ref={ref}>
        <div className="auth-top"><Link href="/">← Back to Elysian Pages</Link><ThemeToggle /></div>
        <section className="auth-card" data-reveal>
          <p className="eyebrow">Your next chapter</p>
          <h1 className="display t-title">{title}</h1>
          {children}
        </section>
      </div>
    </main>
  );
}
