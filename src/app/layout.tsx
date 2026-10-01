import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lapor RT/RW — Platform Pelaporan Fasilitas Publik",
  description: "Laporkan kerusakan fasilitas publik di lingkungan RT/RW Anda",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-lg text-emerald-700">
              <span className="text-2xl">📢</span>
              <span>Lapor RT/RW</span>
            </a>
            <nav className="flex gap-4 text-sm font-medium">
              <a href="/" className="hover:text-emerald-600 transition-colors">Beranda</a>
              <a href="/lapor" className="hover:text-emerald-600 transition-colors">Buat Laporan</a>
              <a href="/dashboard" className="hover:text-emerald-600 transition-colors">Dashboard</a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-400">
          © 2026 Lapor RT/RW Digital
        </footer>
      </body>
    </html>
  );
}
