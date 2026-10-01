import { prisma } from "./prisma";

/**
 * Generate kode laporan auto-increment: LP-0001, LP-0002, dst.
 */
export async function generateKodeLaporan(): Promise<string> {
  const last = await prisma.laporan.findFirst({
    orderBy: { createdAt: "desc" },
    select: { kode: true },
  });

  const nextNum = last ? parseInt(last.kode.replace("LP-", ""), 10) + 1 : 1;
  return `LP-${String(nextNum).padStart(4, "0")}`;
}
