import { PrismaClient } from '@prisma/client';
import { env } from './env';

let prisma: PrismaClient | null = null;

export const createPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          // Ensure SSL and limit connections dynamically
          url: env.databaseUrl.includes('sslmode')
            ? `${env.databaseUrl}&connection_limit=${env.databaseConnectionLimit}`
            : `${env.databaseUrl}?sslmode=require&connection_limit=${env.databaseConnectionLimit}`
        }
      },
      log: env.nodeEnv === 'production' ? [] : ['query', 'info', 'warn', 'error']
    });

    // Add retry logic for hibernation wake-up
    const connectWithRetry = async (retries = 5) => {
      while (retries) {
        try {
          await prisma!.$connect();
          console.log('✅ Database connected');
          break;
        } catch (err) {
          retries -= 1;
          console.error(`❌ DB connection failed. Retrying... (${5 - retries}/5)`);
          if (!retries) throw err;
          await new Promise(res => setTimeout(res, 5000));
        }
      }
    };

    connectWithRetry();
  }

  return prisma!;
};
