import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// next/font host de fonts zelf (geen verzoek naar Google vanuit de browser), dus de CSP blijft 'self'.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "VergelijkMijnSalaris – Weet precies waar je salaris staat",
  description: "Upload je salarisstrook en vergelijk je salaris anoniem met echte salarissen in jouw functie, sector en regio. Gratis, en we slaan geen persoonsgegevens op.",
};

function Logo() {
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden className="shrink-0">
      <rect x="0" y="9" width="3" height="7" rx="1" fill="#7b8494" />
      <rect x="5" y="5" width="3" height="11" rx="1" fill="#7b8494" />
      <rect x="10" y="1" width="3" height="15" rx="1" fill="#c8f031" />
      <rect x="15" y="7" width="3" height="9" rx="1" fill="#7b8494" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-line">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <Logo /> vergelijkmijnsalaris
            </Link>
            <nav className="flex items-center gap-6 text-sm text-fg-muted">
              <Link href="/hoe-werkt-het" className="hidden sm:inline hover:text-fg">Methode</Link>
              <Link href="/privacy" className="hidden sm:inline hover:text-fg">Privacy</Link>
              <Link href="/faq" className="hidden sm:inline hover:text-fg">FAQ</Link>
              <Link href="/vergelijk" className="btn-primary !py-2 !px-4 text-sm">Vergelijk nu</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line text-sm text-fg-subtle">
          <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>vergelijkmijnsalaris — onafhankelijk, anoniem, geen persoonsgegevens opgeslagen</p>
            <nav className="flex flex-wrap gap-6">
              <Link href="/hoe-werkt-het" className="underline underline-offset-4 hover:text-fg">Methode</Link>
              <Link href="/faq" className="underline underline-offset-4 hover:text-fg">FAQ</Link>
              <Link href="/privacy" className="underline underline-offset-4 hover:text-fg">Privacy</Link>
              <Link href="/cookies" className="underline underline-offset-4 hover:text-fg">Cookies</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
