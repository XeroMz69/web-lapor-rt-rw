import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kode: string }> }
) {
  const { kode } = await params;

  const laporan = await prisma.laporan.findUnique({
    where: { kode },
    include: {
      updates: {
        include: { pengurus: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!laporan) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ data: laporan });
}
