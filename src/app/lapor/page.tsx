import FormLaporan from "@/components/FormLaporan";

export default function LaporPage() {
  return (
    <div className="relative overflow-hidden py-10 sm:py-14">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <span>🛡️</span>
            <span>Kanal Aspirasi Sipil Terpercaya</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            Formulir Laporan Fasilitas
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2 font-normal leading-relaxed">
            Data pelapor tidak dicatat di sistem kami. Laporkan apa adanya demi kenyamanan dan keselamatan seluruh warga lingkungan.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 transition-colors">
          <FormLaporan />
        </div>
      </div>
    </div>
  );
}
