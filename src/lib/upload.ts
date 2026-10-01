import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

type UploadType = "laporan" | "update";

export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic"];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validasi magic bytes (header biner) untuk memastikan file benar-benar gambar,
 * bukan script atau file executable yang di-rename.
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

  return false;
}

/**
 * Simpan file ke public/uploads/<type>/<uuid>.<ext>
 * Melakukan validasi ekstensi, ukuran, dan magic bytes.
 */
export async function saveFile(
  file: File,
  type: UploadType
): Promise<string> {
  const ext = (path.extname(file.name) || "").toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Format file "${ext || "tanpa ekstensi"}" ditolak. Hanya file .jpg, .jpeg, .png, dan .heic yang diperbolehkan.`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file melebihi batas maksimum 10MB.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (!validateImageBuffer(buffer, ext)) {
    throw new Error(
      "Isi file tidak valid atau bukan gambar asli yang didukung (verifikasi header gagal)."
    );
  }

  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", type);
  await mkdir(dir, { recursive: true });

  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/${type}/${filename}`;
}

/**
 * Simpan buffer langsung (dari Bot Service atau stream)
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
    throw new Error("Ukuran buffer melebihi batas maksimum 10MB.");
  }

  if (!validateImageBuffer(buffer, ext)) {
    throw new Error(
      "Isi buffer tidak valid atau bukan gambar asli yang didukung (verifikasi header gagal)."
    );
  }

  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", type);
  await mkdir(dir, { recursive: true });

  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/${type}/${filename}`;
}
