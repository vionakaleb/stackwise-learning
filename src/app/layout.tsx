import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Public_Sans } from "next/font/google";
import { Analytics } from "@/components/analytics/Analytics";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-display-loaded",
});

const bodyFont = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-body-loaded",
});

const dataFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-data-loaded",
});

export const metadata: Metadata = {
  title: "StackWise - Learn computer science by doing",
  description:
    "Puzzle-first lessons in algorithms, object design, distributed systems, and machine learning. Guess first, play the mechanic, then read the explanation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${dataFont.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-panel focus:bg-cream focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
