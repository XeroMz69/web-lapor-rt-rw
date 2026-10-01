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

export default function FormLaporan() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; kode?: string; error?: string } | null>(null);
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

    form.set("latitude", String(lat));
    form.set("longitude", String(lng));

    try {
      const res = await fetch("/api/laporan", { method: "POST", body: form });
      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, kode: data.data.kode });
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
      setPreview(URL.createObjectURL(file));
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* Hasil */}
      {result && (
        <div
          className={`rounded-lg p-4 text-sm ${
            result.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {result.success
            ? `✅ Laporan berhasil dikirim! Kode: ${result.kode}`
            : `❌ ${result.error}`}
        </div>
      )}

      {/* Nama & No HP */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
          <input name="nama" required className={inputClass} placeholder="Nama Anda" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">No. HP / WhatsApp</label>
          <input name="noHp" required className={inputClass} placeholder="08xxxxxxxxxx" />
        </div>
      </div>

      {/* Kategori */}
      <div>
        <label className="block text-sm font-medium mb-1">Kategori</label>
        <select name="kategori" required className={inputClass}>
          <option value="">— Pilih Kategori —</option>
          {KATEGORI.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </div>

      {/* Judul */}
      <div>
        <label className="block text-sm font-medium mb-1">Judul Laporan</label>
        <input name="judul" required className={inputClass} placeholder="Contoh: Jalan berlubang di depan pos" />
      </div>

      {/* Deskripsi */}
      <div>
        <label className="block text-sm font-medium mb-1">Deskripsi</label>
        <textarea
          name="deskripsi"
          required
          rows={4}
          className={inputClass}
          placeholder="Jelaskan detail masalah yang Anda laporkan..."
        />
      </div>

      {/* Foto */}
      <div>
        <label className="block text-sm font-medium mb-1">Foto</label>
        <input
          type="file"
          name="foto"
          accept="image/*"
          required
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
        />
        {preview && (
          <img src={preview} alt="Preview" className="mt-2 rounded-lg max-h-48 object-cover" />
        )}
      </div>

      {/* Peta */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Pin Lokasi di Peta {lat && lng && <span className="text-emerald-600 font-normal">✓ Terpilih</span>}
        </label>
        <MapPicker onSelect={(la, ln) => { setLat(la); setLng(ln); }} />
      </div>

      {/* Alamat (opsional) */}
      <div>
        <label className="block text-sm font-medium mb-1">Alamat (opsional)</label>
        <input name="alamat" className={inputClass} placeholder="Jl. Merdeka No. 5, RT 03/RW 01" />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Mengirim..." : "📤 Kirim Laporan"}
      </button>
    </form>
  );
}
