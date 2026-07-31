import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const dbUrl = process.env.TURSO_URL || process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

function createPrisma() {
  const adapter = new PrismaLibSql({
    url: dbUrl,
    authToken: authToken ?? undefined,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
