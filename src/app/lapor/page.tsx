import FormLaporan from "@/components/FormLaporan";

export default function LaporPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Formulir Laporan Warga</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5 font-medium leading-relaxed">
          Silakan isi detail laporan di bawah ini secara lengkap. Laporan bersifat anonim dan otomatis diteruskan ke pengurus RT/RW.
        </p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 sm:p-8 transition-colors">
        <FormLaporan />
      </div>
    </div>
  );
}
