import { prisma } from "./prisma";

const sampleKas = [
  {
    tipe: "PEMASUKAN" as const,
    nominal: 3500000,
    kategori: "Iuran Bulanan Warga",
    keterangan: "Penerimaan iuran kebersihan & keamanan warga RT 01 (70 KK x Rp 50.000)",
    tanggal: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
  },
  {
    tipe: "PEMASUKAN" as const,
    nominal: 1200000,
    kategori: "Sumbangan & Donatur",
    keterangan: "Donasi warga untuk kas perbaikan fasilitas umum & sosial",
    tanggal: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
  {
    tipe: "PENGELUARAN" as const,
    nominal: 850000,
    kategori: "Operasional Sampah",
    keterangan: "Biaya angkut sampah warga ke TPA minggu ke-1 & ke-2",
    tanggal: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
  },
  {
    tipe: "PENGELUARAN" as const,
    nominal: 450000,
    kategori: "Perbaikan Penerangan",
    keterangan: "Pembelian 3 bohlam LED 50W PJU gang utama + ongkos pasang",
    tanggal: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
  },
  {
    tipe: "PENGELUARAN" as const,
    nominal: 350000,
    kategori: "Perbaikan Jalan",
    keterangan: "Pembelian semen & pasir untuk penambalan darurat jalan berlubang",
    tanggal: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
];

async function seedKas() {
  const admin = await prisma.pengurus.findFirst();
  const laporan = await prisma.laporan.findFirst();

  const count = await prisma.kasTransaksi.count();
  if (count === 0) {
    for (let i = 0; i < sampleKas.length; i++) {
      const item = sampleKas[i];
      await prisma.kasTransaksi.create({
        data: {
          ...item,
          pengurusId: admin?.id || null,
          laporanId: i === 4 ? (laporan?.id || null) : null,
        },
      });
    }
    console.log(`✅ Seed ${sampleKas.length} data kas awal berhasil.`);
  } else {
    console.log(`ℹ️ Data kas sudah tersedia (${count} transaksi).`);
  }
}

seedKas()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
