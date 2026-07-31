// Minimal test: can Turbopack import the generated Prisma client?
import { PrismaClient } from "./app/generated/prisma/client";
export const test = PrismaClient;
