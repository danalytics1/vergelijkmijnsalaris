import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "VergelijkMijnSalaris – Verdien jij wat je waard bent?",
  description: "Upload je salarisstrook en vergelijk je salaris anoniem met duizenden vergelijkbare banen. Gratis en AVG-proof.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-extrabold text-brand-600">
              VergelijkMijn<span className="text-accent-500">Salaris</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/hoe-werkt-het" className="hidden sm:inline hover:text-brand-600">Hoe werkt het</Link>
              <Link href="/privacy" className="hidden sm:inline hover:text-brand-600">Privacy</Link>
              <Link href="/vergelijk" className="btn-primary !py-2 !px-4 text-sm">Vergelijk nu</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-900 text-slate-400 text-sm">
          <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-3">
            <div>
              <div className="font-bold text-white mb-2">VergelijkMijnSalaris</div>
              <p>Onafhankelijk en anoniem je salaris vergelijken.</p>
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/hoe-werkt-het" className="hover:text-white">Hoe werkt het</Link>
              <Link href="/faq" className="hover:text-white">Veelgestelde vragen</Link>
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/privacy" className="hover:text-white">Privacyverklaring</Link>
              <Link href="/cookies" className="hover:text-white">Cookies</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
