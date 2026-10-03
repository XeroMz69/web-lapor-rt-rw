import { PrismaClient } from "@prisma/client/wasm";
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
      cachedPrisma = new PrismaClient({ adapter } as any);
      return cachedPrisma;
    }
  } catch (_) {
    // Mode build time / fallback
  }

  return new PrismaClient();
};

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    return (client as any)[prop];
  },
});