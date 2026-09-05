import { PrismaClient } from '@prisma/client';
import { env } from './env';

let prisma: PrismaClient | null = null;

export const createPrismaClient = () => {
  if (!prisma) {
    let formattedUrl = env.databaseUrl;
    try {
      const url = new URL(env.databaseUrl);
      if (env.nodeEnv === 'production' && !url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'require');
      }
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', String(env.databaseConnectionLimit));
      }
      formattedUrl = url.toString();
    } catch {
      formattedUrl = env.databaseUrl;
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: formattedUrl
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
