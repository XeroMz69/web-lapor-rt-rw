import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIGAP — Platform Pelaporan & Monitoring Fasilitas Publik RT/RW",
  description: "Sistem Pelaporan dan Penanganan Fasilitas Lingkungan Warga RT/RW secara 100% anonim, transparan, dan terintegrasi bot WhatsApp.",
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
      <body className="min-h-full flex flex-col bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-50 shadow-xs transition-colors duration-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-3 sm:gap-6">
              <nav className="flex items-center gap-2 sm:gap-3 text-sm font-semibold">
                <a
                  href="/"
                  className="px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"
                >
                  Beranda
                </a>
                <a
                  href="/lapor"
                  className="px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"
                >
                  Buat Laporan
                </a>
                <a
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"
                >
                  Dashboard
                </a>
                <a
                  href="/kas"
                  className="px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all flex items-center gap-1.5"
                >
                  <span>💰</span>
                  <span>Kas Warga</span>
                </a>
              </nav>
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors duration-200">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">SIGAP</span>
              <span>— Sistem Pelaporan & Monitoring Fasilitas Publik RT/RW</span>
            </div>
            <span>© 2026 SIGAP • 100% Anonim, Aman & Transparan</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
