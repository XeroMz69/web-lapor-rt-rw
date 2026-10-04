/**
 * Client-side utility functions untuk manage voting data di localStorage
 * Session-based deduplication: 1 vote per session per laporan
 *
 * Key format: vote_<laporanId>
 * Value format: "RENDAH" | "SEDANG" | "TINGGI" | "CRITICAL" | null
 */

const VOTE_KEY_PREFIX = "vote_";
const VALID_TIERS = ["RENDAH", "SEDANG", "TINGGI", "CRITICAL"];

/**
 * Get current vote tier untuk laporan dari localStorage
 * @param laporanId - ID laporan (CUID)
 * @returns Vote tier ("RENDAH" | "SEDANG" | "TINGGI" | "CRITICAL") atau null jika belum vote
 * 
 * @example
 * const currentVote = getVoteForReport("cm123abc");
 * // Returns "TINGGI" atau null
 */
export function getVoteForReport(laporanId: string): string | null {
  if (typeof window === "undefined") return null;

  const key = `${VOTE_KEY_PREFIX}${laporanId}`;
  const vote = localStorage.getItem(key);

  // Validasi vote value
  if (vote && VALID_TIERS.includes(vote)) {
    return vote;
  }

  return null;
}

/**
 * Set/update vote untuk laporan di localStorage
 * @param laporanId - ID laporan (CUID)
 * @param tier - Vote tier ("RENDAH" | "SEDANG" | "TINGGI" | "CRITICAL")
 * 
 * @example
 * setVoteForReport("cm123abc", "TINGGI");
 */
export function setVoteForReport(laporanId: string, tier: string): void {
  if (typeof window === "undefined") return;

  if (!VALID_TIERS.includes(tier)) {
    console.warn(`Invalid tier: ${tier}. Expected one of: ${VALID_TIERS.join(", ")}`);
    return;
  }

  const key = `${VOTE_KEY_PREFIX}${laporanId}`;
  localStorage.setItem(key, tier);
}

/**
 * Clear vote untuk laporan dari localStorage
 * @param laporanId - ID laporan (CUID)
 * 
 * @example
 * clearVoteForReport("cm123abc");
 */
export function clearVoteForReport(laporanId: string): void {
  if (typeof window === "undefined") return;

  const key = `${VOTE_KEY_PREFIX}${laporanId}`;
  localStorage.removeItem(key);
}

/**
 * Get all votes dari localStorage (untuk debugging)
 * @returns Object dengan mapping laporanId => tier
 * 
 * @example
 * const allVotes = getAllVotes();
 * // { "cm123abc": "TINGGI", "cm456def": "RENDAH" }
 */
export function getAllVotes(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const allVotes: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(VOTE_KEY_PREFIX)) {
      const laporanId = key.slice(VOTE_KEY_PREFIX.length);
      const vote = localStorage.getItem(key);
      if (vote) allVotes[laporanId] = vote;
    }
  }

  return allVotes;
}

/**
 * Clear all votes dari localStorage (untuk testing/cleanup)
 * 
 * @example
 * clearAllVotes(); // Hapus semua voting data
 */
export function clearAllVotes(): void {
  if (typeof window === "undefined") return;

  const keysToDelete: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(VOTE_KEY_PREFIX)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => localStorage.removeItem(key));
}
