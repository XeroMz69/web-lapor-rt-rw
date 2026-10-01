import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

export default async function LaporanDetailPage({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
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

  if (!laporan) notFound();

  const mapsUrl = `https://www.google.com/maps?q=${laporan.latitude},${laporan.longitude}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:underline mb-5 inline-flex items-center gap-1.5 transition-colors">
        <span>←</span>
        <span>Kembali ke Dashboard</span>
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Foto */}
        <div className="relative bg-slate-900">
          <img src={laporan.fotoUrl} alt={laporan.judul} className="w-full h-72 sm:h-80 object-cover" />
        </div>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              {laporan.kode}
            </span>
            <StatusBadge status={laporan.status} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white mb-3 tracking-tight leading-snug">
            {laporan.judul}
          </h1>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 mb-6">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Deskripsi Laporan
            </h3>
            <p className="text-slate-800 dark:text-slate-200 text-base leading-relaxed whitespace-pre-line font-normal">
              {laporan.deskripsi}
            </p>
          </div>

          {/* Info Grid (Anonim: tanpa nama & nomor HP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Sifat Pelapor
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-1.5">
                <span>🔒</span>
                <span>Warga (Anonim)</span>
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Tanggal Laporan
              </span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                {new Date(laporan.createdAt).toLocaleDateString("id-ID", {
                  dateStyle: "medium",
                })}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Alamat / Patokan
              </span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-base">{laporan.alamat || "-"}</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Titik Lokasi
              </span>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold hover:underline inline-flex items-center gap-1 text-base">
                Buka di Google Maps ↗
              </a>
            </div>
          </div>

          {/* Timeline Update */}
          {laporan.updates.length > 0 && (
            <div>
              <h2 className="font-extrabold text-xl mb-4 text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>🔄</span>
                <span>Riwayat Tindak Lanjut Pengurus</span>
              </h2>
              <div className="space-y-4">
                {laporan.updates.map((u) => (
                  <div key={u.id} className="border-l-3 border-emerald-500 pl-4 py-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusBadge status={u.status} />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {new Date(u.createdAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-base text-slate-900 dark:text-slate-100 leading-relaxed font-medium mb-1">
                      {u.keterangan}
                    </p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Oleh: <span className="text-slate-800 dark:text-slate-200 font-semibold">{u.pengurus.nama} ({u.pengurus.jabatan})</span>
                    </p>
                    {u.fotoUrl && (
                      <div className="mt-3">
                        <span className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Foto Bukti Perbaikan:</span>
                        <img
                          src={u.fotoUrl}
                          alt="Bukti perbaikan"
                          className="rounded-xl border border-slate-200 dark:border-slate-700 max-h-56 object-cover shadow-xs"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
