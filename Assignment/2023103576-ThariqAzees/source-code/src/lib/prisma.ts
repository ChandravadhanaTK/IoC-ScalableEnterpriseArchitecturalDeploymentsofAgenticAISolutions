/* eslint-disable @typescript-eslint/no-explicit-any */
let prismaInstance: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client');
  const globalForPrisma = globalThis as unknown as { prisma: any };
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
} catch (e) {
  // Prisma client not generated or unavailable
  prismaInstance = null;
}

export const prisma = prismaInstance;
