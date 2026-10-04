"use client";

import { useState, useEffect, useCallback } from "react";

interface VotingCardProps {
  laporanId: string;
  laporanKode: string;
  status: string;
  initialVotes: {
    rendah: number;
    sedang: number;
    tinggi: number;
    critical: number;
  };
}

const TIER_CONFIG = {
  RENDAH: {
    label: "Rendah",
    emoji: "👎",
    color: "text-slate-600 dark:text-slate-400",
    bgHover: "hover:bg-slate-100 dark:hover:bg-slate-800",
    bgActive: "bg-slate-200 dark:bg-slate-700",
  },
  SEDANG: {
    label: "Sedang",
    emoji: "👍",
    color: "text-amber-600 dark:text-amber-400",
    bgHover: "hover:bg-amber-100 dark:hover:bg-amber-900/30",
    bgActive: "bg-amber-200 dark:bg-amber-900/50",
  },
  TINGGI: {
    label: "Tinggi",
    emoji: "🔥",
    color: "text-orange-600 dark:text-orange-400",
    bgHover: "hover:bg-orange-100 dark:hover:bg-orange-900/30",
    bgActive: "bg-orange-200 dark:bg-orange-900/50",
  },
  CRITICAL: {
    label: "Critical",
    emoji: "⚠️",
    color: "text-red-600 dark:text-red-400",
    bgHover: "hover:bg-red-100 dark:hover:bg-red-900/30",
    bgActive: "bg-red-200 dark:bg-red-900/50",
  },
};

// Safe localStorage access
const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      window.localStorage.setItem(key, value);
    } catch (e) {
      // Silently fail
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      window.localStorage.removeItem(key);
    } catch (e) {
      // Silently fail
    }
  },
};

export default function VotingCard({
  laporanId,
  laporanKode,
  status,
  initialVotes,
}: VotingCardProps) {
  const [currentVote, setCurrentVote] = useState<string | null>(null);
  const [votes, setVotes] = useState(initialVotes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Initialize from storage on client-side only
  useEffect(() => {
    const key = `vote_${laporanId}`;
    const savedVote = safeStorage.getItem(key);
    setCurrentVote(savedVote);
    setMounted(true);
  }, [laporanId]);

  const isActive = status === "PENDING" || status === "DIPROSES";
  const totalVotes = votes.rendah + votes.sedang + votes.tinggi + votes.critical;
  const maxVotes = Math.max(...Object.values(votes));

  const handleVote = useCallback(
    async (tierBaru: string) => {
      if (!isActive || loading) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/laporan/${laporanKode}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tierBaru,
            tierLama: currentVote || undefined,
          }),
        });

        if (!response.ok) {
          let errorMsg = "Gagal memproses vote";
          try {
            const data = await response.json();
            errorMsg = data.error || errorMsg;
          } catch {
            // Keep default error message
          }
          throw new Error(errorMsg);
        }

        const data = await response.json();

        // Update votes dari response
        setVotes({
          rendah: data.data.voteRendah ?? 0,
          sedang: data.data.voteSedang ?? 0,
          tinggi: data.data.voteTinggi ?? 0,
          critical: data.data.voteCritical ?? 0,
        });

        // Update currentVote & storage
        setCurrentVote(tierBaru);
        const key = `vote_${laporanId}`;
        safeStorage.setItem(key, tierBaru);
      } catch (err: any) {
        console.error("Vote error:", err);
        setError(err.message || "Gagal vote. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    },
    [isActive, loading, laporanKode, currentVote, laporanId]
  );

  // Render placeholder during hydration
  if (!mounted) {
    return (
      <div className="w-full" suppressHydrationWarning>
        <div className="mb-3 space-y-2">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
        </div>
        <div className="grid grid-cols-4 gap-2 animate-pulse mb-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Title */}
      <div className="mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span>🗳️</span>
          <span>Berapa Urgensi Masalah Ini?</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Vote pilihan Anda untuk membantu pengurus prioritaskan penanganan
        </p>
      </div>

      {/* Vote Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {Object.entries(TIER_CONFIG).map(([tier, config]) => {
          const tierVoteCount = votes[tier.toLowerCase() as keyof typeof votes] || 0;
          const isCurrentVote = currentVote === tier;

          return (
            <button
              key={tier}
              onClick={() => handleVote(tier)}
              disabled={!isActive || loading}
              className={`
                relative p-2 rounded-lg border-2 transition-all duration-200
                ${isCurrentVote ? config.bgActive : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700"}
                ${!isCurrentVote && isActive ? config.bgHover : ""}
                ${!isActive ? "opacity-50 cursor-not-allowed" : ""}
                ${isCurrentVote ? "border-current" : "border-slate-200 dark:border-slate-700"}
              `}
              title={!isActive ? `Laporan sudah ${status.toLowerCase()}, tidak bisa di-vote` : ""}
            >
              <div className="text-center">
                <div className={`text-xl mb-1 ${config.color}`}>
                  {config.emoji}
                </div>
                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  {config.label}
                </div>
                <div className={`text-xs font-black mt-0.5 ${config.color}`}>
                  {tierVoteCount}
                </div>
              </div>

              {/* Checkmark indicator */}
              {isCurrentVote && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-emerald-500 rounded-full border border-emerald-600 flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress Bar Breakdown */}
      <div className="mb-3 space-y-1.5">
        {Object.entries(TIER_CONFIG).map(([tier, config]) => {
          const tierVoteCount = votes[tier.toLowerCase() as keyof typeof votes] || 0;
          const percentage = maxVotes > 0 ? (tierVoteCount / maxVotes) * 100 : 0;

          return (
            <div key={tier} className="flex items-center gap-2">
              <div className="w-12 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {config.emoji} {config.label}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 ease-out"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor:
                        tier === "RENDAH"
                          ? "#94a3b8"
                          : tier === "SEDANG"
                            ? "#f59e0b"
                            : tier === "TINGGI"
                              ? "#f97316"
                              : "#dc2626",
                    }}
                  />
                </div>
              </div>
              <div className="w-10 text-right text-xs font-bold text-slate-700 dark:text-slate-300">
                {tierVoteCount}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total & Status */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <span>
          Total{" "}
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {totalVotes}
          </span>{" "}
          orang memilih urgensi
        </span>
        {!isActive && (
          <span className="text-slate-500 dark:text-slate-500 italic">
            {status === "SELESAI" ? "✅ Sudah selesai" : "❌ Laporan ditolak"}
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
