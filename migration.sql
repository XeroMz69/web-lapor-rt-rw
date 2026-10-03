-- CreateTable
CREATE TABLE "pengurus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "noWhatsapp" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "laporan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kode" TEXT NOT NULL,
    "nama" TEXT DEFAULT 'Anonim',
    "noHp" TEXT DEFAULT '-',
    "kategori" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "fotoUrl" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "alamat" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "laporan_update" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "laporanId" TEXT NOT NULL,
    "pengurusId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "laporan_update_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "laporan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "laporan_update_pengurusId_fkey" FOREIGN KEY ("pengurusId") REFERENCES "pengurus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kas_transaksi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipe" TEXT NOT NULL,
    "nominal" REAL NOT NULL,
    "kategori" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "buktiUrl" TEXT,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "laporanId" TEXT,
    "pengurusId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kas_transaksi_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "laporan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "kas_transaksi_pengurusId_fkey" FOREIGN KEY ("pengurusId") REFERENCES "pengurus" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "pengurus_noWhatsapp_key" ON "pengurus"("noWhatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "laporan_kode_key" ON "laporan"("kode");

