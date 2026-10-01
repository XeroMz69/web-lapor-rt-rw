import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
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
  searchParams: Promise<{ status?: string; kategori?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 9;

  const where: Record<string, string> = {};
  if (params.status) where.status = params.status;
  if (params.kategori) where.kategori = params.kategori;

  const [laporan, total] = await Promise.all([
    prisma.laporan.findMany({
      where,
      include: { updates: { orderBy: { createdAt: "desc" }, take: 1, include: { pengurus: true } } },
      orderBy: { createdAt: "desc" },
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
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Dashboard Laporan</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: totalAll, color: "text-gray-900" },
          { label: "Menunggu", value: pending, color: "text-yellow-600" },
          { label: "Diproses", value: diproses, color: "text-blue-600" },
          { label: "Selesai", value: selesai, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterLink href="/dashboard" label="Semua" active={!params.status} />
        <FilterLink href="/dashboard?status=PENDING" label="Menunggu" active={params.status === "PENDING"} />
        <FilterLink href="/dashboard?status=DIPROSES" label="Diproses" active={params.status === "DIPROSES"} />
        <FilterLink href="/dashboard?status=SELESAI" label="Selesai" active={params.status === "SELESAI"} />
        <FilterLink href="/dashboard?status=DITOLAK" label="Ditolak" active={params.status === "DITOLAK"} />
      </div>

      {/* Cards */}
      {laporan.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Belum ada laporan</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {laporan.map((l) => (
            <Link
              key={l.id}
              href={`/laporan/${l.kode}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <img
                src={l.fotoUrl}
                alt={l.judul}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-mono">{l.kode}</span>
                  <StatusBadge status={l.status} />
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">{l.judul}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{l.deskripsi}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{KATEGORI_LABEL[l.kategori] || l.kategori}</span>
                  <span>{new Date(l.createdAt).toLocaleDateString("id-ID")}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard?${new URLSearchParams({ ...params, page: String(p) })}`}
              className={`px-3 py-1 rounded text-sm ${
                p === page
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-gray-200 hover:bg-gray-50"
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
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? "bg-emerald-600 text-white"
          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}
