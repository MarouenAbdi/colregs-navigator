import { PrismaClient } from "../../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// HMR-safe singleton (Prisma's documented pattern): without this, every
// Next.js dev-server hot reload would construct a new PrismaClient/pg.Pool,
// exhausting Postgres's connection limit in local dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Prisma 7 requires a driver adapter -- new PrismaClient() with no adapter
// throws P2038 at first query (the Rust query-engine binary is gone in 7.x).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
