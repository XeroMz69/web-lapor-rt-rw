"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme") as "light" | "dark" | null;
      if (saved) {
        setTheme(saved);
        if (saved === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      } else {
        setTheme("light");
      }
    } catch (e) {
      // Fallback untuk environment tanpa localStorage
      setTheme("light");
    } finally {
      setMounted(true);
    }
  }, []);

  function toggle() {
    if (!theme) return;
    
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      // Silently fail jika localStorage tidak tersedia
    }
    
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // Render neutral button on server (no dark: classes) untuk avoid hydration mismatch
  if (!mounted) {
    return (
      <div 
        suppressHydrationWarning
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white shadow-2xs" 
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
      aria-label="Toggle Dark Mode"
      className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer"
    >
      {theme === "dark" ? (
        <span className="text-base">☀️</span>
      ) : (
        <span className="text-base">🌙</span>
      )}
    </button>
  );
}
