/**
 * src/lib/db.ts
 * Prisma client singleton for Next.js (prevents hot-reload from creating
 * multiple connections in development).
 *
 * Usage: import { db } from "@/lib/db"
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
