// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { getDbUrl } from "./getDbUrl";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export async function getPrisma() {
  if (!globalThis.__prisma) {
    const url = await getDbUrl(); // builds from Secrets Manager
    globalThis.__prisma = new PrismaClient({ datasources: { db: { url } } });
  }
  return globalThis.__prisma;
}