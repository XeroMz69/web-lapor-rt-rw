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
      <Link href="/dashboard" className="text-sm text-emerald-600 hover:underline mb-4 inline-block">
        ← Kembali ke Dashboard
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Foto */}
        <img src={laporan.fotoUrl} alt={laporan.judul} className="w-full h-64 object-cover" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400 font-mono">{laporan.kode}</span>
            <StatusBadge status={laporan.status} />
          </div>

          <h1 className="text-xl font-bold mb-2">{laporan.judul}</h1>
          <p className="text-gray-600 text-sm mb-4">{laporan.deskripsi}</p>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm mb-6">
            <div>
              <span className="text-gray-400">Pelapor</span>
              <p className="font-medium">{laporan.nama}</p>
            </div>
            <div>
              <span className="text-gray-400">No. HP</span>
              <p className="font-medium">{laporan.noHp}</p>
            </div>
            <div>
              <span className="text-gray-400">Alamat</span>
              <p className="font-medium">{laporan.alamat || "-"}</p>
            </div>
            <div>
              <span className="text-gray-400">Lokasi</span>
              <a href={mapsUrl} target="_blank" className="text-emerald-600 hover:underline font-medium">
                Buka di Maps ↗
              </a>
            </div>
            <div>
              <span className="text-gray-400">Tanggal</span>
              <p className="font-medium">
                {new Date(laporan.createdAt).toLocaleDateString("id-ID", {
                  dateStyle: "long",
                })}
              </p>
            </div>
          </div>

          {/* Timeline Update */}
          {laporan.updates.length > 0 && (
            <div>
              <h2 className="font-bold text-sm mb-3 text-gray-700">Riwayat Update</h2>
              <div className="space-y-4">
                {laporan.updates.map((u) => (
                  <div key={u.id} className="border-l-2 border-emerald-300 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={u.status} />
                      <span className="text-xs text-gray-400">
                        {new Date(u.createdAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{u.keterangan}</p>
                    <p className="text-xs text-gray-400 mt-1">oleh {u.pengurus.nama} ({u.pengurus.jabatan})</p>
                    {u.fotoUrl && (
                      <img
                        src={u.fotoUrl}
                        alt="Bukti perbaikan"
                        className="mt-2 rounded-lg max-h-48 object-cover"
                      />
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
