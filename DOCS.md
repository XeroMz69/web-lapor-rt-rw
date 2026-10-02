# 📚 Dokumentasi Teknis & Spesifikasi Sistem

Dokumentasi komprehensif arsitektur, alur data, spesifikasi REST API, skema database, format integrasi WhatsApp Bot, dan panduan pemecahan masalah (*troubleshooting*).

---

## 📑 Daftar Isi
1. [Arsitektur & Alur Kerja](#1-arsitektur--alur-kerja)
2. [Skema Database (Prisma ORM)](#2-skema-database-prisma-orm)
3. [Spesifikasi REST API](#3-spesifikasi-rest-api)
4. [Protokol & Format WhatsApp Bot](#4-protokol--format-whatsapp-bot)
5. [Keamanan & Validasi File](#5-keamanan--validasi-file)
6. [Troubleshooting & Solusi Masalah Umum](#6-troubleshooting--solusi-masalah-umum)

---

## 1. Arsitektur & Alur Kerja

Sistem dirancang dalam 2 service mandiri:
1. **Next.js Service (`:3000`)**: Menangani antarmuka web warga, dashboard pemantauan, upload media lokal, dan operasi database MySQL via Prisma.
2. **Bot Service (`:3001`)**: Layanan Node.js berbasis `whatsapp-web.js` (Puppeteer) yang berjalan 24 jam untuk mengirim pesan laporan ke grup pengurus serta mendengarkan perintah balasan.

### Diagram Alur Pelaporan Warga:
```mermaid
sequenceDiagram
    autonumber
    actor W as Warga (Browser)
    participant N as Next.js Service
    participant D as MySQL DB & Disk
    participant B as Bot Service
    actor P as Pengurus RT/RW (WA)

    W->>N: Isi form + Pin Leaflet Map + Unggah Foto (JPG/PNG/HEIC)
    N->>N: Validasi biner gambar (Magic Bytes)
    N->>D: Simpan foto ke public/uploads/laporan/ & insert Laporan
    N->>B: POST /api/notify (Data laporan + path foto lokal)
    B->>P: Kirim Pesan Foto + Rincian Laporan + Pin Maps ke Grup WA
```

### Diagram Alur Update Status oleh Pengurus:
```mermaid
sequenceDiagram
    autonumber
    actor P as Pengurus RT/RW (WA)
    participant B as Bot Service
    participant N as Next.js Service
    participant D as MySQL DB & Disk
    actor W as Warga (Dashboard)

    P->>B: Reply pesan laporan bot: "!update Selesai Jalan sudah ditambal" (+ Foto Bukti)
    B->>B: Ekstrak kode laporan (LP-xxxx), status, & keterangan
    B->>B: Resolusi identitas pengurus (Nomor HP / WhatsApp LID)
    B->>B: Unduh & decrypt foto bukti (bila ada)
    B->>N: POST /api/laporan/update (Header x-api-key)
    N->>N: Verifikasi hak pengurus terdaftar & aktif
    N->>D: Simpan foto bukti & transaksi update database
    N-->>B: Status 200 OK
    B-->>P: Kirim balasan konfirmasi di grup: "✅ Update Berhasil!"
    W->>N: Buka halaman /dashboard atau /laporan/LP-xxxx
    N-->>W: Tampilkan status baru + timeline riwayat + foto bukti
```

---

## 2. Skema Database (Prisma ORM)

Database menggunakan **MySQL** dengan konfigurasi model relasional:

### Entity Relationship Diagram (ERD):
```mermaid
erDiagram
    laporan ||--o{ laporan_update : "memiliki riwayat"
    pengurus ||--o{ laporan_update : "melakukan tindak lanjut"

    laporan {
        string id PK "cuid"
        string kode UK "LP-0001 (auto-generated)"
        string nama "Anonim"
        string noHp "-"
        enum kategori "JALAN_RUSAK, SAMPAH, dll"
        string judul "Judul singkat laporan"
        text deskripsi "Deskripsi lengkap kondisi"
        string fotoUrl "/uploads/laporan/uuid.ext"
        float latitude "Koordinat lintang"
        float longitude "Koordinat bujur"
        text alamat "Patokan tertulis opsional"
        enum status "PENDING, DIPROSES, SELESAI, DITOLAK"
        datetime createdAt "Waktu pembuatan"
        datetime updatedAt "Waktu pembaruan"
    }

    pengurus {
        string id PK "cuid"
        string nama "Nama lengkap pengurus"
        string jabatan "Ketua RT, Sekretaris, dll"
        string noWhatsapp UK "Nomor HP (628xxx) / LID (9823xxx)"
        boolean aktif "Default true"
        datetime createdAt
        datetime updatedAt
    }

    laporan_update {
        string id PK "cuid"
        string laporanId FK "Relasi ke laporan (Cascade)"
        string pengurusId FK "Relasi ke pengurus"
        enum status "Status baru yang ditetapkan"
        text keterangan "Catatan hasil perbaikan"
        string fotoUrl "/uploads/update/uuid.ext (opsional)"
        datetime createdAt
    }
```

---

## 3. Spesifikasi REST API

Komunikasi antar-service dan antarmuka web menggunakan RESTful JSON:

### 1. Buat Laporan Baru
- **Endpoint**: `POST /api/laporan`
- **Tipe Request**: `multipart/form-data`
- **Fields**:
  - `kategori` *(string, wajib)*: Salah satu enum kategori
  - `judul` *(string, wajib)*: Judul ringkas
  - `deskripsi` *(string, wajib)*: Uraian laporan
  - `latitude` *(float, wajib)*: Koordinat peta
  - `longitude` *(float, wajib)*: Koordinat peta
  - `foto` *(file, wajib)*: File foto format `.jpg`, `.jpeg`, `.png`, atau `.heic`
  - `alamat` *(string, opsional)*: Catatan patokan
- **Response Success (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "cmu...",
      "kode": "LP-0001",
      "nama": "Anonim",
      "kategori": "JALAN_RUSAK",
      "judul": "Jalan berlubang",
      "status": "PENDING",
      "fotoUrl": "/uploads/laporan/123e4567.jpg",
      "latitude": -6.2,
      "longitude": 106.816
    }
  }
  ```

### 2. Update Status Laporan (dari Bot WhatsApp)
- **Endpoint**: `POST /api/laporan/update`
- **Header**: `x-api-key: <API_SECRET_KEY>`
- **Body JSON**:
  ```json
  {
    "kode": "LP-0001",
    "status": "SELESAI",
    "keterangan": "Jalan sudah ditambal oleh tim kerja bakti",
    "noWhatsapp": "6285773074389",
    "lid": "98230314492094",
    "fotoBase64": "/9j/4AAQSkZJRg...",
    "fotoExt": "jpg"
  }
  ```
- **Response**:
  - `200 OK`: Berhasil update status laporan dan mencatat histori tindak lanjut.
  - `401 Unauthorized`: API Key tidak cocok.
  - `403 Forbidden`: Nomor pengirim maupun LID tidak terdaftar sebagai pengurus aktif.
  - `404 Not Found`: Kode laporan tidak ditemukan.

### 3. Trigger Notifikasi Bot
- **Endpoint**: `POST http://localhost:3001/api/notify`
- **Header**: `x-api-key: <API_SECRET_KEY>`
- **Body JSON**: Dikirim oleh Next.js untuk memicu bot mengirim pesan foto + rincian ke grup target `WA_GROUP_ID`.

---

## 4. Protokol & Format WhatsApp Bot

### Format Pesan Notifikasi Laporan (Bot ➔ Grup WA):
```
📢 *LAPORAN BARU* — LP-0001

👤 Pelapor: Anonim (Warga)
📂 Kategori: 🛣️ Jalan Rusak
📌 Judul: Aspal berlubang parah di depan Pos RT 03
📝 Deskripsi: Lubang sedalam 15 cm membahayakan pengendara motor
📍 Lokasi: Jl. Mawar RT 03 RW 01
🗺️ Maps: https://www.google.com/maps?q=-6.2000,106.8160
🕐 Waktu: 1 Oktober 2026, 14.30

─────────────────
Balas pesan ini dengan:
*!update <Status> <Keterangan>*
Contoh: _!update Selesai Jalan sudah ditambal_
```

### Cara Pengurus Memperbarui Status:
Pengurus cukup menekan **Reply / Balas** pada pesan laporan bot di atas, lalu mengetik:
```
!update Selesai Penambalan aspal telah selesai dilakukan
```
*(Bisa sambil melampirkan foto hasil pengerjaan sebagai bukti)*.

**Pilihan Status yang Didukung:**
- `Selesai` atau `Done` ➔ Mengubah status menjadi `SELESAI`
- `Diproses` atau `Proses` ➔ Mengubah status menjadi `DIPROSES`
- `Ditolak` atau `Tolak` ➔ Mengubah status menjadi `DITOLAK`

*(Opsi tanpa reply)*: Pengurus juga dapat menulis kodenya secara eksplisit:
```
!update LP-0001 Selesai Perbaikan sudah rampung
```

### Modul Pengelolaan Kas Warga via WhatsApp:
Pengurus RT/RW dapat mengelola pembukuan kas langsung di grup WA:

1. **Cek Saldo Kas Terkini**:
   ```
   !saldo
   ```
   *Bot akan membalas total saldo kas tersedia, total pemasukan, dan total pengeluaran.*

2. **Catat Pemasukan Kas (Iuran, Donasi, Sumbangan)**:
   ```
   !kas masuk <Nominal> <Kategori> | <Keterangan>
   ```
   *Contoh*: `!kas masuk 3500000 Iuran Warga | Pembayaran iuran 70 KK bulan Oktober`

3. **Catat Pengeluaran Kas (Bisa Melampirkan Foto Nota/Struk)**:
   ```
   !kas keluar <Nominal> <Kategori> | <Keterangan> [KodeLaporan]
   ```
   *Contoh*: `!kas keluar 350000 Perbaikan Jalan | Pembelian semen dan pasir LP-0001`
   *(Pengurus bisa mengetik caption tersebut sambil melampirkan foto nota/struk toko material)*.

---

## 5. Keamanan & Validasi File

Untuk menjaga integritas server lokal dari serangan berkas berbahaya (seperti eksekusi web shell / script injection):

1. **Whitelist Ekstensi Ketat**: Hanya menerima ekstensi `.jpg`, `.jpeg`, `.png`, dan `.heic`.
2. **Inspeksi Magic Bytes (Binary Header Check)**:
   File diverifikasi berdasarkan beberapa byte pertama di memori sebelum ditulis ke disk:
   - **JPEG**: Wajib diawali `FF D8 FF`
   - **PNG**: Wajib diawali `89 50 4E 47 0D 0A 1A 0A`
   - **HEIC**: Container header byte 4–7 bernilai karakter ASCII `ftyp`
   File script yang sengaja diubah namanya menjadi `.png` atau `.jpg` akan otomatis ditolak dengan pesan:
   `Isi file tidak valid atau bukan gambar asli yang didukung`.
3. **Batas Ukuran Berkas**: Dibatasi maksimal 10MB per unggahan.
4. **Nama Berkas Teracak (UUID)**: Nama file asli diubah menjadi UUID acak (`crypto.randomUUID()`) untuk mencegah serangan path traversal maupun penimpaan file lokal.

---

## 6. Troubleshooting & Solusi Masalah Umum

### 1. `Can't reach database server at 127.0.0.1:3306`
- **Penyebab**: MySQL belum berjalan atau konfigurasi listen port hanya pada socket.
- **Solusi**:
  - Pastikan service aktif: `sudo systemctl status mysql`.
  - Jika koneksi TCP lambat/ditolak, gunakan jalur UNIX Domain Socket langsung di `.env`:
    ```env
    DATABASE_URL="mysql://root:password@localhost/lapor_rtrw?socket=/var/run/mysqld/mysqld.sock"
    ```

### 2. `Nomor WA (...) tidak terdaftar sebagai pengurus aktif (Error 403)`
- **Penyebab**: WhatsApp Web menggunakan identitas terenkripsi privasi (**LID**) di dalam grup (misal: `98230314492094@lid`).
- **Solusi**:
  - Daftarkan nomor HP asli Anda:
    ```bash
    npm run pengurus:add -- "Nama Anda" "Ketua RT 01" "085773074389"
    ```
  - Jika log Next.js menunjukkan nomor LID tertentu belum dikenali, Anda juga dapat mendaftarkan ID LID tersebut:
    ```bash
    npm run pengurus:add -- "Nama (LID)" "Ketua RT 01" "98230314492094"
    ```

### 3. Bot Meminta Scan QR Terus-Menerus
- **Penyebab**: File sesi Chromium terkunci (`SingletonLock`) atau perintah `node --watch` memantau folder `./wa-session/`.
- **Solusi**:
  - Proyek ini telah dilengkapi script watcher terbatas (`node --watch-path=src src/index.js`), auto-cleaner stale locks, dan graceful shutdown (`SIGINT`).
  - Scan QR code satu kali, biarkan status `WhatsApp Bot SIAP & TERKONEKSI`, dan sesi akan tersimpan permanen.

### 4. `Error: Could not find Chrome`
- **Penyebab**: Binary Chromium Puppeteer belum terpasang di cache server.
- **Solusi**:
  ```bash
  cd bot-service && npx puppeteer browsers install chrome
  ```
