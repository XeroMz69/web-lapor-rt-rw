import { prisma } from "./prisma";

async function main() {
  const args = process.argv.slice(2);
  // Penggunaan: npx tsx src/lib/add-kas.ts <PEMASUKAN|PENGELUARAN> <nominal> <kategori> <keterangan> [kodeLaporan]
  if (args.length < 4) {
    console.log("Penggunaan: npx tsx src/lib/add-kas.ts <PEMASUKAN|PENGELUARAN> <nominal> <kategori> <keterangan> [kodeLaporan]");
    console.log("Contoh 1: npx tsx src/lib/add-kas.ts PEMASUKAN 500000 'Iuran Warga' 'Iuran blok A bulan ini'");
    console.log("Contoh 2: npx tsx src/lib/add-kas.ts PENGELUARAN 250000 'Perbaikan Jalan' 'Beli semen tambal jalan' LP-0001");
    process.exit(1);
  }

  const [rawTipe, rawNominal, kategori, keterangan, kodeLaporan] = args;
  const tipe = rawTipe.toUpperCase();
  if (tipe !== "PEMASUKAN" && tipe !== "PENGELUARAN") {
    console.error("❌ Tipe transaksi wajib: PEMASUKAN atau PENGELUARAN");
    process.exit(1);
  }

  const nominal = parseFloat(rawNominal.replace(/[^0-9.]/g, ""));
  if (isNaN(nominal) || nominal <= 0) {
    console.error("❌ Nominal harus berupa angka valid lebih dari 0");
    process.exit(1);
  }

  let laporanId: string | null = null;
  if (kodeLaporan) {
    const lap = await prisma.laporan.findUnique({
      where: { kode: kodeLaporan.toUpperCase().trim() },
    });
    if (lap) {
      laporanId = lap.id;
    } else {
      console.warn(`⚠️ Laporan ${kodeLaporan} tidak ditemukan, transaksi tetap dicatat tanpa relasi laporan.`);
    }
  }

  const admin = await prisma.pengurus.findFirst();

  const trx = await prisma.kasTransaksi.create({
    data: {
      tipe: tipe as any,
      nominal,
      kategori,
      keterangan,
      laporanId,
      pengurusId: admin?.id || null,
    },
  });

  const formattedNominal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nominal);

  console.log(`✅ Berhasil mencatat ${tipe}:`);
  console.log(`   Nominal   : ${formattedNominal}`);
  console.log(`   Kategori  : ${trx.kategori}`);
  console.log(`   Keterangan: ${trx.keterangan}`);
  if (kodeLaporan) console.log(`   Terkait   : ${kodeLaporan.toUpperCase()}`);
}

main()
  .catch((e) => {
    console.error("Gagal mencatat transaksi kas:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
