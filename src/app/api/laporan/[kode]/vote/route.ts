import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_TIERS = ["RENDAH", "SEDANG", "TINGGI", "CRITICAL"];
const TIER_FIELDS: Record<string, string> = {
  RENDAH: "voteRendahCount",
  SEDANG: "voteSedangCount",
  TINGGI: "voteTinggiCount",
  CRITICAL: "voteCriticalCount",
};

/**
 * POST /api/laporan/[kode]/vote
 * Handle voting untuk urgensi laporan
 *
 * Request Body:
 * {
 *   tierBaru: "TINGGI" | "RENDAH" | "SEDANG" | "CRITICAL",
 *   tierLama?: "TINGGI" | "RENDAH" | "SEDANG" | "CRITICAL"
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     voteRendah: number,
 *     voteSedang: number,
 *     voteTinggi: number,
 *     voteCritical: number
 *   }
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ kode: string }> }
) {
  try {
    const { kode } = await params;
    const body = await req.json();
    const { tierBaru, tierLama } = body;

    // Validasi input
    if (!tierBaru || !VALID_TIERS.includes(tierBaru)) {
      return NextResponse.json(
        { error: "tierBaru harus salah satu dari: RENDAH, SEDANG, TINGGI, CRITICAL" },
        { status: 400 }
      );
    }

    if (tierLama && !VALID_TIERS.includes(tierLama)) {
      return NextResponse.json(
        { error: "tierLama harus salah satu dari: RENDAH, SEDANG, TINGGI, CRITICAL" },
        { status: 400 }
      );
    }

    // Cek laporan ada & status PENDING atau DIPROSES
    const laporan = await prisma.laporan.findUnique({
      where: { kode },
      select: {
        id: true,
        status: true,
        voteRendahCount: true,
        voteSedangCount: true,
        voteTinggiCount: true,
        voteCriticalCount: true,
      },
    });

    if (!laporan) {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (laporan.status !== "PENDING" && laporan.status !== "DIPROSES") {
      return NextResponse.json(
        { error: `Laporan dengan status ${laporan.status} tidak bisa di-vote` },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, number> = {};

    // Decrement old tier (jika ada)
    if (tierLama && tierLama !== tierBaru) {
      const oldField = TIER_FIELDS[tierLama];
      updateData[oldField] = Math.max(0, laporan[oldField as keyof typeof laporan] as number - 1);
    }

    // Increment new tier
    const newField = TIER_FIELDS[tierBaru];
    updateData[newField] = (laporan[newField as keyof typeof laporan] as number || 0) + 1;

    // Update database
    const updated = await prisma.laporan.update({
      where: { kode },
      data: updateData,
      select: {
        voteRendahCount: true,
        voteSedangCount: true,
        voteTinggiCount: true,
        voteCriticalCount: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          voteRendah: updated.voteRendahCount,
          voteSedang: updated.voteSedangCount,
          voteTinggi: updated.voteTinggiCount,
          voteCritical: updated.voteCriticalCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in vote endpoint:", error);
    return NextResponse.json(
      { error: "Gagal memproses vote" },
      { status: 500 }
    );
  }
}
