# 📢 SIGAP — Sistem Informasi Keuangan, Aduan, dan Pemantauan Fasilitas Publik

Platform pelaporan dan monitoring fasilitas publik (jalan rusak, lampu mati, sampah liar, saluran mampet, dll.) serta transparansi kas keuangan warga untuk lingkungan RT/RW secara **100% anonim**, cepat, dan transparan dengan integrasi notifikasi dua arah **WhatsApp Bot**.

---

## 🌟 Fitur Utama

- **100% Pelaporan Anonim**: Warga melapor tanpa perlu mengisi nama maupun nomor HP. Keamanan dan privasi warga terjamin.
- **Peta Interaktif (Leaflet.js)**: Pinpoint lokasi kerusakan secara akurat via OpenStreetMap.
- **Validasi Keamanan File**: Hanya menerima foto `.jpg`, `.jpeg`, `.png`, dan `.heic` dengan inspeksi biner (*magic bytes* anti-file eksekusi).
- **Notifikasi Dua Arah WhatsApp Bot**:
  - Laporan baru langsung diteruskan ke grup koordinasi WhatsApp pengurus RT/RW lengkap dengan foto & pin peta.
  - Pengurus cukup membalas (*reply*) pesan bot di WhatsApp dengan perintah `!update <Status> <Keterangan>` untuk memperbarui progres perbaikan (mendukung lampiran foto bukti).
- **Dashboard Monitoring Real-time**: Status laporan (*Menunggu*, *Diproses*, *Selesai*, *Ditolak*), riwayat penanganan, dan filter kategori.
- **Dukungan Dark Mode**: Toggle tema terang dan gelap otomatis dengan persistensi `localStorage` dan pencegah kedipan (*anti-FOUC*).
- **Penyimpanan Lokal Mandiri**: Semua media dan data tersimpan di server lokal Anda tanpa ketergantungan pihak ketiga (seperti Cloudinary / AWS S3).

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────┐        REST API         ┌─────────────────────────────────┐
│       Next.js Service           │ ◄─────────────────────► │        Bot Service              │
│       (Port 3000)               │                         │        (Port 3001)              │
├─────────────────────────────────┤                         ├─────────────────────────────────┤
│ • UI Warga & Dashboard          │                         │ • Express.js                    │
│ • API Endpoints                 │                         │ • whatsapp-web.js (Puppeteer)   │
│ • MySQL (Prisma ORM)            │                         │ • Auto-resolve LID & Kontak WA  │
│ • Local Uploads (/public)       │                         │ • Listener grup & trigger pesan │
└─────────────────────────────────┘                         └─────────────────────────────────┘
                ▲                                                           │
                │                                                           ▼
         Warga (Browser)                                         Grup WhatsApp Pengurus
```

---

## 🛠️ Tech Stack

- **Web & Main Backend**: [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Peta**: [Leaflet.js](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Database**: [MySQL](https://www.mysql.com/) dengan [Prisma ORM](https://www.prisma.io/)
- **Bot Engine**: [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [whatsapp-web.js](https://wwebjs.dev/)

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Prasyarat Sistem
- **Node.js**: v18 ke atas (direkomendasikan v20+)
- **MySQL Server**: Berjalan di port `3306` atau via UNIX Socket
- **Google Chrome / Chromium**: Untuk kebutuhan Puppeteer pada Bot WhatsApp

*(Untuk Linux headless seperti Ubuntu Server, pastikan paket pustaka GUI terpasang)*:
```bash
sudo apt-get update && sudo apt-get install -y \
  libasound2 libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2
```

---

### 2. Setup Layanan Next.js (Website & API)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Konfigurasi Environment (`.env`)**:
   Salin atau buat file `.env` di root project:
   ```env
   # Database URL (Bisa TCP atau UNIX Socket)
   DATABASE_URL="mysql://root:password@127.0.0.1:3306/lapor_rtrw"

   # URL Bot Service
   BOT_SERVICE_URL="http://localhost:3001"

   # Kunci Rahasia Komunikasi Next.js <-> Bot
   API_SECRET_KEY="generate-random-string-64-karakter"

   # Direktori Upload Lokal
   UPLOAD_DIR="public/uploads"
   ```

3. **Sinkronisasi Database**:
   ```bash
   npx prisma db push
   ```

4. **Jalankan Next.js**:
   ```bash
   npm run dev
   ```
   Buka di browser: `http://localhost:3000`

---

### 3. Setup Bot Service (WhatsApp)

1. **Pindah ke direktori bot & install dependencies**:
   ```bash
   cd bot-service
   npm install
   ```

2. **Konfigurasi Environment (`bot-service/.env`)**:
   ```env
   PORT=3001
   API_SECRET_KEY="samakan-dengan-API_SECRET_KEY-di-root"
   NEXTJS_URL=http://localhost:3000
   WA_GROUP_ID=
   ```

3. **Jalankan Bot Service**:
   ```bash
   npm run dev
   ```

4. **Koneksi WhatsApp & Dapatkan Group ID**:
   - Scan **QR Code** yang muncul di terminal menggunakan aplikasi WhatsApp di HP Anda.
   - Kirim pesan teks apa saja di grup WhatsApp pengurus (misal: `tes`).
   - Terminal bot akan mencetak ID grup target:
     ```
     [Grup Terdeteksi] ID: 120363xxxxxxxxx@g.us
     ```
   - Masukkan ID tersebut ke `bot-service/.env`:
     ```env
     WA_GROUP_ID=120363xxxxxxxxx@g.us
     ```
   - Bot otomatis reload dan siap bekerja 24 jam.

---

## 👥 Manajemen Pengurus RT/RW

Pengurus yang berhak melakukan update via WhatsApp harus terdaftar di database.

- **Tambah Pengurus via Terminal**:
  ```bash
  npm run pengurus:add -- "Nama Pengurus" "Ketua RT 01" "081234567890"
  ```
- **Kelola via Prisma Studio (Web GUI)**:
  ```bash
  npm run db:studio
  ```
  Buka `http://localhost:5555` lalu pilih tabel `pengurus`.

---

## 🗑️ Manajemen & Hapus Laporan

- **Hapus via Prisma Studio**:
  Jalankan `npm run db:studio`, pilih tabel `laporan`, pilih baris laporan yang ingin dihapus, lalu klik `Delete record`. Relasi tindak lanjut otomatis terhapus (*Cascade*).

---

## 📖 Dokumentasi Lengkap

Untuk arsitektur teknis, spesifikasi API, format pesan bot, dan panduan troubleshooting lengkap, silakan baca [DOKUMENTASI SISTEM (DOCS.md)](./DOCS.md).

---

## 📄 Lisensi
Didistribusikan untuk keperluan digitalisasi tata kelola lingkungan warga RT/RW.
