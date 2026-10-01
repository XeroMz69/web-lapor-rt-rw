import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

type UploadType = "laporan" | "update";

/**
 * Simpan file ke public/uploads/<type>/<uuid>.<ext>
 * Return path relatif yang bisa diakses via URL: /uploads/<type>/xxx.jpg
 */
export async function saveFile(
  file: File,
  type: UploadType
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name) || ".jpg";
  const filename = `${randomUUID()}${ext}`;

  const dir = path.join(process.cwd(), "public", "uploads", type);
  await mkdir(dir, { recursive: true });

  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/${type}/${filename}`;
}

/**
 * Simpan buffer langsung (dari Bot Service)
 */
export async function saveBuffer(
  buffer: Buffer,
  ext: string,
  type: UploadType
): Promise<string> {
  const filename = `${randomUUID()}${ext.startsWith(".") ? ext : `.${ext}`}`;

  const dir = path.join(process.cwd(), "public", "uploads", type);
  await mkdir(dir, { recursive: true });

  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/${type}/${filename}`;
}
