/**
 * Public, unauthenticated DB-connectivity health check Route Handler (HEALTH-01).
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../src/server/db/client.js";

// Prisma's adapter-pg driver needs Node.js APIs (pg's TCP client) -- the edge
// runtime cannot run this. No explicit timeout per D-07: a slow-but-successful
// Neon cold-start wake must still report healthy.
export const runtime = "nodejs";
// Route Handlers are dynamic by default in Next.js 15+, but D-08 requires this
// explicitly and unconditionally, not by default-behavior inference.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok" },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // D-06: no stack trace, no connection string, no internal detail in the body.
    return NextResponse.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
