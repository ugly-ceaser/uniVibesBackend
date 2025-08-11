import { PrismaClient } from '@prisma/client';
import { env } from './env';

export const createPrismaClient = () => {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: env.databaseUrl }
    },
    log: env.nodeEnv === 'production' ? [] : ['query', 'info', 'warn', 'error']
  });
  return prisma;
}; 