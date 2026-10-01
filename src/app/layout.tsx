import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

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
  description: "Laporkan kerusakan fasilitas publik di lingkungan RT/RW Anda secara anonim dan transparan",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-xs transition-colors duration-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-extrabold text-xl text-emerald-700 dark:text-emerald-400 tracking-tight">
              <span className="text-2xl">📢</span>
              <span>Lapor RT/RW</span>
            </a>
            <div className="flex items-center gap-4 sm:gap-6">
              <nav className="flex gap-4 sm:gap-5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <a href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Beranda</a>
                <a href="/lapor" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Buat Laporan</a>
                <a href="/dashboard" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Dashboard</a>
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-5 text-center text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors duration-200">
          © 2026 Platform Lapor RT/RW Digital • Anonim & Transparan
        </footer>
      </body>
    </html>
  );
}
