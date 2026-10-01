import { prisma } from "./prisma";

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log("Penggunaan: npx tsx src/lib/add-pengurus.ts <nama> <jabatan> <noWhatsapp>");
    console.log("Contoh: npx tsx src/lib/add-pengurus.ts 'Budi Santoso' 'Ketua RT 01' '08123456789'");
    process.exit(1);
  }

  const [nama, jabatan, rawHp] = args;
  // Normalisasi nomor HP: ubah 08xxx atau +628xxx menjadi 628xxx
  let noWhatsapp = rawHp.replace(/[^0-9]/g, "");
  if (noWhatsapp.startsWith("0")) {
    noWhatsapp = "62" + noWhatsapp.slice(1);
  }

  const result = await prisma.pengurus.upsert({
    where: { noWhatsapp },
    update: { nama, jabatan, aktif: true },
    create: { nama, jabatan, noWhatsapp, aktif: true },
  });

  console.log(`✅ Berhasil mendaftarkan pengurus:`);
  console.log(`   Nama    : ${result.nama}`);
  console.log(`   Jabatan : ${result.jabatan}`);
  console.log(`   No WA   : ${result.noWhatsapp}`);
}

main()
  .catch((e) => {
    console.error("Gagal mendaftarkan pengurus:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
