// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { getDbUrl } from "./getDbUrl";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

let prismaClient: PrismaClient | null = null;

export async function getPrisma() {
  if (!prismaClient) {
    const url = await getDbUrl(); // builds from Secrets Manager
    prismaClient = new PrismaClient({ datasources: { db: { url } } });
  }
  
  return prismaClient;
}