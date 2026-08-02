import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Dynamic key access so the bundler does NOT inline these as `undefined`
// during `next build` (Railway `railway up` builds run without the service's
// runtime env vars). Values are read from the real environment at runtime.
const env = (key: string) => process.env[key];

const dbUrl = env("TURSO_URL") || env("DATABASE_URL") || "file:./dev.db";
const authToken = env("TURSO_AUTH_TOKEN");

function createPrisma() {
  const adapter = new PrismaLibSql({
    url: dbUrl,
    authToken: authToken ?? undefined,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
