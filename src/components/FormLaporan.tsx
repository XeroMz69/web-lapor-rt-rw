"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

const KATEGORI = [
  { value: "JALAN_RUSAK", label: "🛣️ Jalan Rusak" },
  { value: "SAMPAH", label: "🗑️ Sampah" },
  { value: "PENERANGAN", label: "💡 Penerangan" },
  { value: "SALURAN_AIR", label: "🌊 Saluran Air" },
  { value: "FASILITAS_UMUM", label: "🏗️ Fasilitas Umum" },
  { value: "KEAMANAN", label: "🔒 Keamanan" },
  { value: "LAINNYA", label: "📋 Lainnya" },
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function FormLaporan() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    kode?: string;
    error?: string;
    botSent?: boolean;
    fallbackContact?: { nama: string; noWhatsapp: string } | null;
  } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const form = new FormData(e.currentTarget);

    if (lat === null || lng === null) {
      setResult({ success: false, error: "Pilih lokasi di peta" });
      setLoading(false);
      return;
    }

    const foto = form.get("foto") as File | null;
    if (foto && foto.name) {
      const ext = foto.name.slice(foto.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setResult({
          success: false,
          error: "Format file tidak diizinkan. Hanya file .jpg, .jpeg, .png, dan .heic yang diperbolehkan.",
        });
        setLoading(false);
        return;
      }
      if (foto.size > MAX_FILE_SIZE) {
        setResult({
          success: false,
          error: "Ukuran file terlalu besar. Maksimum 10MB.",
        });
        setLoading(false);
        return;
      }
    }

    form.set("latitude", String(lat));
    form.set("longitude", String(lng));

    try {
      const res = await fetch("/api/laporan", { method: "POST", body: form });
      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          kode: data.data.kode,
          botSent: data.botStatus?.sent ?? true,
          fallbackContact: data.botStatus?.fallbackContact || null,
        });
        formRef.current?.reset();
        setPreview(null);
        setLat(null);
        setLng(null);
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch {
      setResult({ success: false, error: "Gagal mengirim laporan" });
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setResult({
          success: false,
          error: `Format file "${ext || "tanpa ekstensi"}" ditolak! Hanya file .jpg, .jpeg, .png, dan .heic yang diperbolehkan.`,
        });
        e.target.value = "";
        setPreview(null);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setResult({
          success: false,
          error: "Ukuran file terlalu besar! Maksimum 10MB.",
        });
        e.target.value = "";
        setPreview(null);
        return;
      }

      setResult(null);
      setPreview(URL.createObjectURL(file));
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white dark:bg-slate-800 shadow-2xs transition-colors";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Banner Anonim */}
      <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-semibold">
        <span className="text-xl">🔒</span>
        <span>
          Laporan Anda 100% Anonim untuk menjamin keamanan dan kenyamanan warga.
        </span>
      </div>

      {/* Hasil Submit */}
      {result && (
        <div className="space-y-3">
          {result.success ? (
            <>
              {/* Notifikasi Laporan Berhasil Masuk Database */}
              <div className="rounded-2xl p-4 sm:p-5 text-sm font-semibold border bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 shadow-xs">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">✅</span>
                  <div>
                    <h4 className="font-extrabold text-base mb-1">
                      Laporan Berhasil Disimpan di Sistem!
                    </h4>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed mb-2">
                      Laporan Anda telah tersimpan secara anonim dengan kode:{" "}
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 inline-block">
                        {result.kode}
                      </span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Anda dapat memantau status perkembangan perbaikannya kapan saja di menu Dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Notifikasi Khusus Jika Bot Service Offline / Gagal Meneruskan */}
              {result.botSent === false && result.fallbackContact && (
                <div className="rounded-2xl p-4 sm:p-5 text-sm border bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-xs">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">⚠️</span>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-base mb-1 text-amber-900 dark:text-amber-200">
                        Notifikasi Otomatis Bot Sedang Offline
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                        Laporan Anda <strong>sudah tersimpan di database</strong> dan nanti tetap bisa ditindaklanjuti via WhatsApp oleh pengurus begitu bot menyala kembali. Namun, pemberitahuan instan saat ini tidak dapat terkirim otomatis ke grup.
                      </p>

                      <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3.5 border border-amber-200 dark:border-amber-800/60 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Kontak Darurat Pengurus:
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {result.fallbackContact.nama}
                          </span>
                        </div>
                        <a
                          href={`https://wa.me/${result.fallbackContact.noWhatsapp}?text=Halo%20Pengurus%20RT/RW,%20saya%20telah%20membuat%20laporan%20fasilitas%20dengan%20kode%20*${result.kode}*.%20Mohon%20bantuannya%20untuk%20dicek.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors shrink-0"
                        >
                          <span>💬</span>
                          <span>Hubungi Pengurus ({result.fallbackContact.noWhatsapp})</span>
                        </a>
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                        💡 _Jika masalah sangat mendesak/darurat, silakan klik tombol di atas untuk menghubungi nomor pengurus secara langsung._
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl p-4 text-sm font-semibold border bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700">
              ❌ {result.error}
            </div>
          )}
        </div>
      )}

      {/* Kategori */}
      <div>
        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          Kategori Masalah <span className="text-rose-600">*</span>
        </label>
        <select name="kategori" required className={inputClass}>
          <option value="">— Pilih Kategori Masalah —</option>
          {KATEGORI.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </div>

      {/* Judul */}
      <div>
        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          Judul Singkat <span className="text-rose-600">*</span>
        </label>
        <input name="judul" required className={inputClass} placeholder="Contoh: Aspal berlubang cukup dalam di depan Pos RT 03" />
      </div>

      {/* Deskripsi */}
      <div>
        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          Deskripsi Lengkap <span className="text-rose-600">*</span>
        </label>
        <textarea
          name="deskripsi"
          required
          rows={4}
          className={inputClass}
          placeholder="Jelaskan kondisi kerusakan secara detail agar memudahkan penanganan..."
        />
      </div>

      {/* Foto */}
      <div>
        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          Foto Bukti Kerusakan <span className="text-rose-600">*</span>
          <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
            (JPG, JPEG, PNG, HEIC — Maks. 10MB)
          </span>
        </label>
        <input
          type="file"
          name="foto"
          accept=".jpg,.jpeg,.png,.heic,image/jpeg,image/png,image/heic"
          required
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-emerald-200 dark:file:border-emerald-800 file:text-sm file:font-bold file:bg-emerald-50 dark:file:bg-emerald-950 file:text-emerald-800 dark:file:text-emerald-300 hover:file:bg-emerald-100 cursor-pointer"
        />
        {preview && (
          <div className="mt-3">
            <span className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Pratinjau Foto:</span>
            <img src={preview} alt="Preview" className="rounded-xl border border-slate-200 dark:border-slate-700 max-h-52 object-cover shadow-2xs" />
          </div>
        )}
      </div>

      {/* Peta */}
      <div>
        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          Pin Lokasi di Peta <span className="text-rose-600">*</span>{" "}
          {lat && lng ? (
            <span className="text-emerald-700 dark:text-emerald-400 font-bold ml-1 text-xs">✓ Titik koordinat terpilih ({lat.toFixed(4)}, {lng.toFixed(4)})</span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400 font-normal text-xs">(Klik titik pada peta di bawah)</span>
          )}
        </label>
        <MapPicker onSelect={(la, ln) => { setLat(la); setLng(ln); }} />
      </div>

      {/* Alamat (opsional) */}
      <div>
        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          Alamat / Patokan Tertulis (Opsional)
        </label>
        <input name="alamat" className={inputClass} placeholder="Contoh: Jl. Merpati No. 12, RT 02 / RW 05 (dekat pohon beringin)" />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 rounded-xl font-bold text-base shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        {loading ? "Sedang Mengirim Laporan..." : "📤 Kirim Laporan Anonim"}
      </button>
    </form>
  );
}
