import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const iconSize = size === "sm" ? "w-8 h-8 text-base" : size === "lg" ? "w-12 h-12 text-2xl" : "w-10 h-10 text-xl";
  const titleSize = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";
  const subSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-xs" : "text-[11px]";

  return (
    <Link href="/" className={`group flex items-center gap-3 transition-transform hover:scale-[1.02] ${className}`}>
      {/* Icon Emblem dengan Gradient & Shadow */}
      <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/30 ${iconSize}`}>
        <span className="drop-shadow-sm select-none">🏛️</span>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
        </span>
      </div>

      {/* Teks Logo */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent ${titleSize}`}>
            SIPENA
          </span>
          <span className={`font-extrabold tracking-wider text-slate-800 dark:text-slate-100 ${titleSize}`}>
            CIVIL
          </span>
        </div>
        <span className={`font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400 ${subSize}`}>
          Smart Civic RT/RW
        </span>
      </div>
    </Link>
  );
}
