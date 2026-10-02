import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

const KATEGORI_LIST = [
  {
    key: "JALAN_RUSAK",
    title: "Jalan Rusak & Berlubang",
    icon: "🛣️",
    desc: "Aspal rusak, paving ambles, trotoar hancur",
    color: "from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400",
  },
  {
    key: "SAMPAH",
    title: "Tumpukan Sampah Liar",
    icon: "🗑️",
    desc: "TPS overload, sampah menumpuk, limbah warga",
    color: "from-emerald-500/10 to-green-500/10 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "PENERANGAN",
    title: "Lampu Penerangan Mati",
    icon: "💡",
    desc: "PJU padam, tiang lampu rusak, kabel putus",
    color: "from-yellow-500/10 to-amber-500/10 border-yellow-200 dark:border-yellow-900/50 text-yellow-600 dark:text-yellow-400",
  },
  {
    key: "SALURAN_AIR",
    title: "Saluran Air & Drainase",
    icon: "🌊",
    desc: "Got mampet, selokan meluap, genangan banjir",
    color: "from-cyan-500/10 to-blue-500/10 border-cyan-200 dark:border-cyan-900/50 text-cyan-600 dark:text-cyan-400",
  },
  {
    key: "FASILITAS_UMUM",
    title: "Fasilitas Umum & Balai",
    icon: "🏗️",
    desc: "Pos ronda rusak, taman bermain, balai warga",
    color: "from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400",
  },
  {
    key: "KEAMANAN",
    title: "Keamanan Lingkungan",
    icon: "🔒",
    desc: "Portal rusak, CCTV mati, kerawanan wilayah",
    color: "from-rose-500/10 to-red-500/10 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400",
  },
];

export default async function Home() {
  const [totalLaporan, selesaiLaporan, diprosesLaporan, laporanTerbaru] = await Promise.all([
    prisma.laporan.count(),
    prisma.laporan.count({ where: { status: "SELESAI" } }),
    prisma.laporan.count({ where: { status: "DIPROSES" } }),
    prisma.laporan.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const persentaseTuntas =
    totalLaporan > 0 ? Math.round((selesaiLaporan / totalLaporan) * 100) : 100;

  return (
    <div className="relative overflow-hidden">
      {/* Background Glow Dekoratif */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold shadow-xs mb-8">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sistem Pelaporan dan Penanganan Fasilitas Sipil Warga</span>
        </div>

        {/* Heading Hero */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.15] max-w-4xl mx-auto mb-6">
          Suarakan Kerusakan Fasilitas,{" "}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
            100% Anonim & Tuntas
          </span>
        </h1>

        {/* Subheading Hero */}
        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          <strong className="font-semibold text-slate-900 dark:text-slate-100">SIPENA CIVIL</strong> memudahkan warga melaporkan jalan berlubang, lampu mati, hingga saluran mampet tanpa login dan tanpa perlu takut identitas terekspos.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/lapor"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 hover:-translate-y-0.5 transition-all"
          >
            <span>📝</span>
            <span>Buat Laporan Sekarang</span>
            <span className="text-emerald-200">→</span>
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-base px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 transition-all"
          >
            <span>📊</span>
            <span>Pantau Progres Warga</span>
          </Link>
          <Link
            href="/kas"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-base px-6 py-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 shadow-xs hover:-translate-y-0.5 transition-all"
          >
            <span>💰</span>
            <span>Transparansi Kas</span>
          </Link>
        </div>

        {/* LIVE METRICS / STATS BAR */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="p-3 text-center">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-0.5">
              {totalLaporan}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Laporan
            </div>
          </div>
          <div className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-0.5">
              {selesaiLaporan}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Selesai Ditangani
            </div>
          </div>
          <div className="p-3 text-center border-l-0 md:border-l border-slate-200/60 dark:border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mb-0.5">
              {diprosesLaporan}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sedang Dikerjakan
            </div>
          </div>
          <div className="p-3 text-center border-l border-slate-200/60 dark:border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 mb-0.5">
              {persentaseTuntas}%
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tingkat Ketuntasan
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITIONS / CARA KERJA SISTEM */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
            Alur Integrasi Cerdas
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Bagaimana SIPENA CIVIL Bekerja?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
            Menghubungkan warga dan pengurus RT/RW tanpa sekat birokrasi yang berbelit.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Lapor Anonim & Presisi",
              desc: "Unggah foto masalah dan tentukan titik di peta Leaflet. Tanpa perlu input nama atau nomor HP sedikitpun.",
              icon: "🛡️",
              badge: "Privacy First",
            },
            {
              step: "02",
              title: "WhatsApp Bot Mengabari",
              desc: "Bot mengirimkan notifikasi foto, titik koordinat, dan detail kerusakan secara instan ke grup koordinasi pengurus RT/RW.",
              icon: "💬",
              badge: "Real-time Bot",
            },
            {
              step: "03",
              title: "Perbaikan Terpantau Publik",
              desc: "Pengurus mengupdate progres via WhatsApp (!update Selesai), warga dapat memantau foto bukti pengerjaan di dashboard.",
              icon: "✅",
              badge: "Transparansi Penuh",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative rounded-3xl p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
                    {item.icon}
                  </span>
                  <span className="text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">
                    Langkah {item.step}
                  </span>
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>{item.badge}</span>
                <span>✓</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KATEGORI FASILITAS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-2">
            Cakupan Penanganan
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Kategori Fasilitas Publik
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
            Pilih kategori kerusakan yang Anda temukan di sekitar lingkungan permukiman.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {KATEGORI_LIST.map((k) => (
            <Link
              key={k.key}
              href={`/lapor`}
              className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-md transition-all flex items-start gap-4"
            >
              <div className="text-3xl p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                {k.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {k.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  {k.desc}
                </p>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Laporkan Kategori Ini →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* LAPORAN TERBARU PREVIEW */}
      {laporanTerbaru.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-1">
                Aktivitas Warga Terkini
              </h2>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Laporan Masuk Terakhir
              </h3>
            </div>
            <Link
              href="/dashboard"
              className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Lihat Seluruh Laporan</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {laporanTerbaru.map((l) => (
              <Link
                key={l.id}
                href={`/laporan/${l.kode}`}
                className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={l.fotoUrl}
                    alt={l.judul}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={l.status} />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mb-1 block">
                      {l.kode}
                    </span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-1.5 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {l.judul}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {l.deskripsi}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>{new Date(l.createdAt).toLocaleDateString("id-ID")}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Detail ↗</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* BANNER AJAKAN KAWAL LINGKUNGAN */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white shadow-xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-white/20 text-emerald-100 mb-4 inline-block">
              Gotong Royong Modern
            </span>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              Ada Fasilitas Rusak di Sekitar Anda Hari Ini?
            </h3>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed font-normal">
              Jangan dibiarkan membahayakan orang lain. Cukup 1 menit untuk mengambil foto dan menandai lokasi di peta. Laporan Anda langsung masuk ke WhatsApp pengurus.
            </p>
          </div>
          <Link
            href="/lapor"
            className="shrink-0 bg-white hover:bg-slate-100 text-emerald-900 font-black text-base px-8 py-4 rounded-2xl shadow-lg hover:scale-105 transition-transform"
          >
            Lapor Sekarang 🚀
          </Link>
        </div>
      </section>
    </div>
  );
}
