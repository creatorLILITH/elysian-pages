"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/library", label: "Discover", icon: "book" },
  { href: "/mylibrary", label: "My Library", icon: "bookmark" },
  { href: "/profile", label: "Profile", icon: "settings" },
];

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    home: "M3 10 12 3l9 7v11h-6v-7H9v7H3V10Z",
    book: "M12 5v16M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3V3Z",
    bookmark: "M6 3h12v19l-6-4-6 4V3Z",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3l-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3H9Z",
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function AppNav({ actions }: { actions?: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <nav className="workspace-nav" aria-label="Primary">
        <Link href="/dashboard" className="workspace-mark" aria-label="Elysian Pages home">
          <svg width="34" height="34" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M10 30C3 21 14 5 20 7c4 2-12 19-7 21S31 4 33 10 18 32 22 31s11-10 13-5-13 13-21 7M8 34l23-5" /></svg>
        </Link>
        <div className="workspace-nav__links">
          {LINKS.map(link => <Link key={link.href} href={link.href} className="workspace-nav__link" aria-current={pathname === link.href ? "page" : undefined} title={link.label}><NavIcon name={link.icon} /><span>{link.label}</span></Link>)}
        </div>
        <div className="workspace-nav__bottom"><ThemeToggle /></div>
      </nav>
      <header className="workspace-topbar">
        <Link href="/dashboard" className="workspace-wordmark">elysian<span>pages</span><span className="workspace-wordmark__dot">.</span></Link>
        <span className="workspace-topbar__caption">Your space between the pages</span>
        <div className="row">{actions}<span className="workspace-mobile-theme"><ThemeToggle /></span><Link href="/profile" className="workspace-account"><span aria-hidden="true">◎</span> Your account <span aria-hidden="true">↗</span></Link></div>
      </header>
    </>
  );
}
