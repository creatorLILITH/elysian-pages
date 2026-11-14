import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Literata } from "next/font/google";
import "./globals.css";
import "./workspace.css";

/* Display / editorial serif — headlines, book titles, literary statements. */
const displaySerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

/* Interface sans — navigation, buttons, forms, metadata, all functional UI. */
const interfaceSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/* Reading serif — long-form book text only. */
const readingSerif = Literata({
  subsets: ["latin"],
  variable: "--font-read",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elysian Pages — A quiet place for readers",
  description:
    "A calm, elegant digital library: read distraction-free, keep notes, bookmarks and highlights, and curate your own shelf.",
  manifest: "/manifest.json",
  icons: {
    icon: "/elysian-pages_logo.png",
    apple: "/logo192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#efeee3",
  colorScheme: "dark light",
};

/**
 * Applies the stored colour theme before first paint so there is no flash of
 * the wrong theme. Purely presentational: it only sets `data-theme` on <html>.
 */
const THEME_INIT = `(function(){try{var t=localStorage.getItem("elysian-theme");if(t!=="parchment"&&t!=="midnight"){t="parchment";}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="parchment"
      className={`${displaySerif.variable} ${interfaceSans.variable} ${readingSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="app-shell">{children}</body>
    </html>
  );
}
