import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import VotingCard from "@/components/VotingCard";
import Link from "next/link";

const KATEGORI_LABEL: Record<string, string> = {
  JALAN_RUSAK: "🛣️ Jalan Rusak",
  SAMPAH: "🗑️ Sampah",
  PENERANGAN: "💡 Penerangan",
  SALURAN_AIR: "🌊 Saluran Air",
  FASILITAS_UMUM: "🏗️ Fasilitas Umum",
  KEAMANAN: "🔒 Keamanan",
  LAINNYA: "📋 Lainnya",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kategori?: string; page?: string; sortBy?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 9;
  const sortBy = params.sortBy || "newest"; // "newest" atau "urgency"

  const where: Record<string, string> = {};
  if (params.status) where.status = params.status;
  if (params.kategori) where.kategori = params.kategori;

  let orderBy: Record<string, any> = { createdAt: "desc" };
  if (sortBy === "urgency") {
    orderBy = { voteCriticalCount: "desc" }; // Sort by Critical votes first
  }

  const [laporan, total] = await Promise.all([
    prisma.laporan.findMany({
      where,
      include: { updates: { orderBy: { createdAt: "desc" }, take: 1, include: { pengurus: true } } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.laporan.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Stats
  const [totalAll, pending, diproses, selesai] = await Promise.all([
    prisma.laporan.count(),
    prisma.laporan.count({ where: { status: "PENDING" } }),
    prisma.laporan.count({ where: { status: "DIPROSES" } }),
    prisma.laporan.count({ where: { status: "SELESAI" } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>📊</span>
            <span>Transparansi SIPENA CIVIL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            Dashboard Penanganan Fasilitas
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1 font-normal">
            Pantau seluruh laporan dan verifikasi bukti perbaikan oleh pengurus RT/RW secara real-time.
          </p>
        </div>
        <Link
          href="/lapor"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-all self-start sm:self-auto"
        >
          <span>✍️</span>
          <span>Buat Laporan Baru</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Laporan", value: totalAll, color: "text-slate-900 dark:text-white", bg: "from-slate-500/10 to-slate-500/5 border-slate-200 dark:border-slate-800" },
          { label: "Menunggu", value: pending, color: "text-amber-600 dark:text-amber-400", bg: "from-amber-500/10 to-amber-500/5 border-amber-200/80 dark:border-amber-900/40" },
          { label: "Diproses", value: diproses, color: "text-blue-600 dark:text-blue-400", bg: "from-blue-500/10 to-blue-500/5 border-blue-200/80 dark:border-blue-900/40" },
          { label: "Selesai", value: selesai, color: "text-emerald-600 dark:text-emerald-400", bg: "from-emerald-500/10 to-emerald-500/5 border-emerald-200/80 dark:border-emerald-900/40" },
        ].map((s) => (
          <div key={s.label} className={`p-5 rounded-3xl bg-gradient-to-b ${s.bg} bg-white dark:bg-slate-900 border shadow-xs text-center transition-colors`}>
            <div className={`text-3xl sm:text-4xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">Filter:</span>
        <FilterLink href="/dashboard" label="Semua" active={!params.status} />
        <FilterLink href="/dashboard?status=PENDING" label="Menunggu" active={params.status === "PENDING"} />
        <FilterLink href="/dashboard?status=DIPROSES" label="Diproses" active={params.status === "DIPROSES"} />
        <FilterLink href="/dashboard?status=SELESAI" label="Selesai" active={params.status === "SELESAI"} />
        <FilterLink href="/dashboard?status=DITOLAK" label="Ditolak" active={params.status === "DITOLAK"} />
      </div>

      {/* Sort */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">Urutkan:</span>
        <FilterLink
          href={`/dashboard?${new URLSearchParams({ ...params, sortBy: "newest", page: "1" })}`}
          label="Terbaru"
          active={sortBy === "newest"}
        />
        <FilterLink
          href={`/dashboard?${new URLSearchParams({ ...params, sortBy: "urgency", page: "1" })}`}
          label="Paling Urgent"
          active={sortBy === "urgency"}
        />
      </div>

      {/* Cards */}
      {laporan.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center py-20 px-4 transition-colors">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-700 dark:text-slate-300 font-bold text-lg mb-1">Belum ada laporan</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Tidak ada laporan yang sesuai dengan filter yang dipilih.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {laporan.map((l) => (
            <div
              key={l.id}
              className="group bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col"
            >
              <Link href={`/laporan/${l.kode}`} className="block">
                <div className="relative bg-slate-100 dark:bg-slate-800 h-44 overflow-hidden">
                  <img
                    src={l.fotoUrl}
                    alt={l.judul}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                </div>
              </Link>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {l.kode}
                  </span>
                  <StatusBadge status={l.status} />
                </div>
                <Link href={`/laporan/${l.kode}`} className="block">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {l.judul}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4 flex-1">
                    {l.deskripsi}
                  </p>
                </Link>

                {/* Voting Card */}
                <div className="mb-3 pb-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <VotingCard
                    laporanId={l.id}
                    laporanKode={l.kode}
                    status={l.status}
                    initialVotes={{
                      rendah: l.voteRendahCount,
                      sedang: l.voteSedangCount,
                      tinggi: l.voteTinggiCount,
                      critical: l.voteCriticalCount,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {KATEGORI_LABEL[l.kategori] || l.kategori}
                  </span>
                  <span>{new Date(l.createdAt).toLocaleDateString("id-ID")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard?${new URLSearchParams({ ...params, page: String(p) })}`}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                p === page
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
        active
          ? "bg-emerald-800 text-white border-emerald-900 shadow-2xs"
          : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600"
      }`}
    >
      {label}
    </Link>
  );
}
