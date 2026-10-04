import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

let cachedPrisma: PrismaClient | null = null;

export const getPrisma = (): PrismaClient => {
  if (cachedPrisma) return cachedPrisma;

  try {
    const ctx = getCloudflareContext();
    const env = ctx?.env as CloudflareEnv | undefined;
    if (env?.DB) {
      const adapter = new PrismaD1(env.DB);
      cachedPrisma = new PrismaClient({ adapter }) as unknown as PrismaClient;
      return cachedPrisma;
    }
  } catch (err) {
    // Fallback untuk development atau non-Cloudflare environment
    console.warn("Cloudflare context not available, using default Prisma:", err instanceof Error ? err.message : String(err));
  }

  // Development / Standard Node.js environment
  cachedPrisma = new PrismaClient();
  return cachedPrisma;
};

export const prisma = getPrisma();