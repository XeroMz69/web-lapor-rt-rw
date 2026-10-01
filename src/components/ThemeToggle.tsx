"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800" />
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
