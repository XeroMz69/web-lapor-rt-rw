import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client/wasm";

export const dynamic = "force-dynamic";

export async function GET() {
  const debug: Record<string, any> = {};

  try {
    const ctx = getCloudflareContext();
    debug.hasCtx = !!ctx;
    debug.envKeys = ctx?.env ? Object.keys(ctx.env) : [];
    debug.hasDB = !!ctx?.env?.DB;

    if (ctx?.env?.DB) {
      const adapter = new PrismaD1(ctx.env.DB);
      debug.hasAdapter = !!adapter;
      const client = new PrismaClient({ adapter } as any);
      const count = await client.laporan.count();
      debug.laporanCount = count;
    }
  } catch (err: any) {
    debug.error = err.message || String(err);
    debug.stack = err.stack;
  }

  return NextResponse.json(debug);
}
