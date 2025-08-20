import { PrismaClient } from "@prisma/client";
import { getDbUrl } from "./getDbUrl";

let prisma: PrismaClient | undefined;

export async function getPrisma() {
  if (!prisma) {
    const url = await getDbUrl();           // <- from Secrets Manager
    prisma = new PrismaClient({ datasources: { db: { url } } });
  }
  return prisma;
}