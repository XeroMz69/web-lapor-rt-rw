import { prisma } from "./prisma";

const dataPengurus = [
  { nama: "Admin RT", jabatan: "Pengurus RT", noWhatsapp: "6285773074389" },
  { nama: "Pak Budi", jabatan: "Ketua RT 01", noWhatsapp: "6281234567890" },
  { nama: "Bu Sari", jabatan: "Sekretaris RT 01", noWhatsapp: "6281234567891" },
  { nama: "Pak Hendra", jabatan: "Ketua RW 05", noWhatsapp: "6281234567892" },
];

async function seed() {
  for (const p of dataPengurus) {
    await prisma.pengurus.upsert({
      where: { noWhatsapp: p.noWhatsapp },
      update: p,
      create: p,
    });
  }
  console.log("Seeded pengurus:", dataPengurus.length);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
