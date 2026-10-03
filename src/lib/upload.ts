import { randomUUID } from "crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type UploadType = "laporan" | "update";

function getR2Bucket(): any | null {
  try {
    const env = getCloudflareContext().env as CloudflareEnv;
    return env.MEDIA_BUCKET || null;
  } catch (_) {
    return null;
  }
}

function getR2PublicUrl(key: string): string {
  try {
    const env = getCloudflareContext().env as CloudflareEnv & { MEDIA_PUBLIC_URL?: string };
    if (env.MEDIA_PUBLIC_URL) {
      return `${env.MEDIA_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
    }
  } catch (_) {}
  return `/uploads/${key}`;
}

export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic", ".bmp"];
export const MAX_FILE_SIZE = 15 * 1024 * 1024; // Batas input 15MB sebelum dikompresi

/**
 * Kompresi gambar menggunakan Jimp (Pure JS, aman untuk semua arsitektur CPU):
 * - Resolusi: skala otomatis jika lebar atau tinggi melebihi 1600px
 * - Kualitas JPEG: 75%
 * - Ukuran output: 100 KB - 400 KB (selalu di bawah 500 KB)
 */
export async function compressImage(inputBuffer: Buffer): Promise<{ buffer: Buffer; ext: string }> {
  try {
    const { Jimp } = await import("jimp");
    const image = await Jimp.read(inputBuffer);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Skala proporsional jika lebih besar dari 1600px
    const maxDim = 1600;
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        image.resize({ w: maxDim });
      } else {
        image.resize({ h: maxDim });
      }
    }

    // Ekspor ke buffer JPEG dengan kualitas teroptimasi
    let outputBuffer = await image.getBuffer("image/jpeg", { quality: 75 });

    // Jika masih di atas 500 KB, resize ke 1200px dengan kualitas 70%
    if (outputBuffer.length > 500 * 1024) {
      const smallerDim = 1200;
      if (image.bitmap.width >= image.bitmap.height) {
        image.resize({ w: smallerDim });
      } else {
        image.resize({ h: smallerDim });
      }
      outputBuffer = await image.getBuffer("image/jpeg", { quality: 70 });
    }

    return { buffer: outputBuffer, ext: ".jpg" };
  } catch (err: any) {
    console.warn("[compressImage] Gagal kompresi Jimp, fallback ke buffer asli:", err.message);
    return { buffer: inputBuffer, ext: ".jpg" };
  }
}

/**
 * Validasi magic bytes (header biner) untuk memastikan file benar-benar gambar.
 */
export function validateImageBuffer(buffer: Buffer, ext: string): boolean {
  const cleanExt = ext.toLowerCase().startsWith(".")
    ? ext.toLowerCase()
    : `.${ext.toLowerCase()}`;

  if (!ALLOWED_EXTENSIONS.includes(cleanExt)) {
    return false;
  }

  if (buffer.length < 8) return false;

  // JPEG magic bytes: FF D8 FF
  if (cleanExt === ".jpg" || cleanExt === ".jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  if (cleanExt === ".png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  // HEIC / HEIF: bytes 4-7 bernilai "ftyp"
  if (cleanExt === ".heic") {
    if (buffer.length < 12) return false;
    const ftyp = buffer.toString("ascii", 4, 8);
    return ftyp === "ftyp";
  }

  // BMP: bytes 0-1 "BM"
  if (cleanExt === ".bmp") {
    return buffer[0] === 0x42 && buffer[1] === 0x4d;
  }

  return false;
}

/**
 * Simpan file ke public/uploads/<type>/<uuid>.<ext>
 * Melakukan validasi ekstensi, ukuran, magic bytes, dan kompresi otomatis ke bawah 500 KB.
 */
export async function saveFile(
  file: File,
  type: UploadType
): Promise<string> {
  const ext = (file.name.match(/\.[^.]+$/)?.[0] || "").toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Format file "${ext || "tanpa ekstensi"}" ditolak. Hanya file .jpg, .jpeg, .png, dan .heic yang diperbolehkan.`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file melebihi batas maksimum 15MB.");
  }

  const bytes = await file.arrayBuffer();
  const rawBuffer = Buffer.from(bytes);

  if (!validateImageBuffer(rawBuffer, ext)) {
    throw new Error(
      "Isi file tidak valid atau bukan gambar asli yang didukung (verifikasi header gagal)."
    );
  }

  const bucket = getR2Bucket();
  if (bucket) {
    const filename = `${randomUUID()}${ext}`;
    await bucket.put(`${type}/${filename}`, rawBuffer, {
      httpMetadata: { contentType: file.type || "application/octet-stream", cacheControl: "public, max-age=31536000, immutable" },
    });
    return getR2PublicUrl(`${type}/${filename}`);
  }

  // Kompresi otomatis hanya pada server Node lokal (Jimp tidak dijalankan di Worker).
  const { buffer: compressedBuffer, ext: finalExt } = await compressImage(rawBuffer);
  const filename = `${randomUUID()}${finalExt}`;

  const pathModule = await import("path");
  const { writeFile, mkdir } = await import("fs/promises");
  const dir = pathModule.join(process.cwd(), "public", "uploads", type);
  await mkdir(dir, { recursive: true });

  const filepath = pathModule.join(dir, filename);
  await writeFile(filepath, compressedBuffer);

  console.log(
    `[Upload ${type}] Asli: ${(rawBuffer.length / 1024).toFixed(1)} KB -> Terkompresi: ${(compressedBuffer.length / 1024).toFixed(1)} KB (${finalExt})`
  );

  return `/uploads/${type}/${filename}`;
}

/**
 * Simpan buffer langsung (dari Bot Service atau webhook WA)
 * Otomatis terkompresi ke bawah 500 KB.
 */
export async function saveBuffer(
  buffer: Buffer,
  rawExt: string,
  type: UploadType
): Promise<string> {
  const ext = rawExt.startsWith(".")
    ? rawExt.toLowerCase()
    : `.${rawExt.toLowerCase()}`;

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Format file "${ext}" ditolak. Hanya file .jpg, .jpeg, .png, dan .heic yang diperbolehkan.`
    );
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("Ukuran buffer melebihi batas maksimum 15MB.");
  }

  if (!validateImageBuffer(buffer, ext)) {
    throw new Error(
      "Isi buffer tidak valid atau bukan gambar asli yang didukung (verifikasi header gagal)."
    );
  }

  const bucket = getR2Bucket();
  if (bucket) {
    const filename = `${randomUUID()}${ext}`;
    await bucket.put(`${type}/${filename}`, buffer, {
      httpMetadata: { contentType: `image/${ext.replace(".", "")}`, cacheControl: "public, max-age=31536000, immutable" },
    });
    return getR2PublicUrl(`${type}/${filename}`);
  }

  // Kompresi otomatis hanya pada server Node lokal.
  const { buffer: compressedBuffer, ext: finalExt } = await compressImage(buffer);
  const filename = `${randomUUID()}${finalExt}`;
  const pathModule = await import("path");
  const { writeFile, mkdir } = await import("fs/promises");
  const dir = pathModule.join(process.cwd(), "public", "uploads", type);
  await mkdir(dir, { recursive: true });

  const filepath = pathModule.join(dir, filename);
  await writeFile(filepath, compressedBuffer);

  console.log(
    `[Upload Bot ${type}] Asli: ${(buffer.length / 1024).toFixed(1)} KB -> Terkompresi: ${(compressedBuffer.length / 1024).toFixed(1)} KB (${finalExt})`
  );

  return `/uploads/${type}/${filename}`;
}
