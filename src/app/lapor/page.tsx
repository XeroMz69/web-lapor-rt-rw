import FormLaporan from "@/components/FormLaporan";

export default function LaporPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Buat Laporan Baru</h1>
      <p className="text-gray-500 text-sm mb-6">
        Isi form di bawah untuk melaporkan kerusakan fasilitas publik di lingkungan Anda.
      </p>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <FormLaporan />
      </div>
    </div>
  );
}
