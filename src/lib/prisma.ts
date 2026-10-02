import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const getPrisma = () => {
  try {
    const { env } = getCloudflareContext();
    const adapter = new PrismaD1(env.DB);
    return new PrismaClient({ adapter });
  } catch (_) {
    // Fallback mode development lokal
    return new PrismaClient();
  }
};

export const prisma = getPrisma();