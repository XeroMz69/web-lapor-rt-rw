import { prisma } from "@/lib/prisma";
import Link from "next/link";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function KasPage({
  searchParams,
}: {
  searchParams: Promise<{ tipe?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 10;

  const where: Record<string, any> = {};
  if (params.tipe === "PEMASUKAN" || params.tipe === "PENGELUARAN") {
    where.tipe = params.tipe;
  }

  const [transaksiList, totalCount, aggregations] = await Promise.all([
    prisma.kasTransaksi.findMany({
      where,
      include: {
        laporan: {
          select: { kode: true, judul: true },
        },
        pengurus: {
          select: { nama: true, jabatan: true },
        },
      },
      orderBy: { tanggal: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.kasTransaksi.count({ where }),
    prisma.kasTransaksi.groupBy({
      by: ["tipe"],
      _sum: { nominal: true },
    }),
  ]);

  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  for (const agg of aggregations) {
    if (agg.tipe === "PEMASUKAN") totalPemasukan = agg._sum.nominal || 0;
    if (agg.tipe === "PENGELUARAN") totalPengeluaran = agg._sum.nominal || 0;
  }

  const saldoKas = totalPemasukan - totalPengeluaran;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="relative overflow-hidden py-10 sm:py-14">
      {/* Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <span>💰</span>
              <span>Transparansi Anggaran Lingkungan</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
              Buku Kas & Keuangan Warga
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1 font-normal">
              Informasi arus dana iuran, donasi, dan alokasi pembiayaan perbaikan fasilitas secara terbuka.
            </p>
          </div>
          <Link
            href="/lapor"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-all self-start sm:self-auto"
          >
            <span>📝</span>
            <span>Lapor Fasilitas Rusak</span>
          </Link>
        </div>

        {/* 3 SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Saldo Saat Ini */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 text-emerald-100 text-xs font-bold uppercase tracking-wider">
              <span>Saldo Kas Tersedia</span>
              <span className="text-xl">💳</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
              {formatRupiah(saldoKas)}
            </div>
            <p className="text-emerald-100/90 text-xs font-medium">
              Sisa dana siap guna untuk operasional & darurat lingkungan.
            </p>
          </div>

          {/* Total Pemasukan */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs">
            <div className="flex items-center justify-between mb-3 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Pemasukan</span>
              <span className="text-xl">📈</span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {formatRupiah(totalPemasukan)}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Akumulasi iuran bulanan warga, kas sosial, dan donasi.
            </p>
          </div>

          {/* Total Pengeluaran */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 shadow-xs">
            <div className="flex items-center justify-between mb-3 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Pengeluaran</span>
              <span className="text-xl">📉</span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {formatRupiah(totalPengeluaran)}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Alokasi perbaikan sarana, kebersihan sampah, dan keamanan.
            </p>
          </div>
        </div>

        {/* TAB FILTER & TABLE LIST */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Riwayat Transaksi Keuangan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Total {totalCount} transaksi tercatat di pembukuan lingkungan
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Link
                href="/kas"
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !params.tipe
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Semua
              </Link>
              <Link
                href="/kas?tipe=PEMASUKAN"
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  params.tipe === "PEMASUKAN"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                + Pemasukan
              </Link>
              <Link
                href="/kas?tipe=PENGELUARAN"
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  params.tipe === "PENGELUARAN"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                - Pengeluaran
              </Link>
            </div>
          </div>

          {/* LIST TRANSAKSI */}
          {transaksiList.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              <span className="text-4xl block mb-2">🧾</span>
              <p className="font-bold text-base">Belum ada transaksi</p>
              <p className="text-xs">Catatan transaksi pada kategori ini masih kosong.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {transaksiList.map((t) => {
                const isMasuk = t.tipe === "PEMASUKAN";
                return (
                  <div
                    key={t.id}
                    className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 rounded-2xl px-2.5 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold ${
                          isMasuk
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {isMasuk ? "↓" : "↑"}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {t.kategori}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isMasuk
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                                : "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                            }`}
                          >
                            {t.tipe}
                          </span>
                          {t.laporan && (
                            <Link
                              href={`/laporan/${t.laporan.kode}`}
                              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 hover:underline"
                            >
                              Terkait {t.laporan.kode} ↗
                            </Link>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-1">
                          {t.keterangan}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          <span>
                            {new Date(t.tanggal).toLocaleDateString("id-ID", {
                              dateStyle: "medium",
                            })}
                          </span>
                          {t.pengurus && (
                            <span>• Dicatat: {t.pengurus.nama} ({t.pengurus.jabatan})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div
                        className={`text-base sm:text-lg font-black tracking-tight ${
                          isMasuk
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isMasuk ? "+" : "-"} {formatRupiah(t.nominal)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/kas?${new URLSearchParams({ ...params, page: String(p) })}`}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    p === page
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
