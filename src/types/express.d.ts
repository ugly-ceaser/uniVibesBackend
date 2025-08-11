// src/types/express.d.ts
import { PrismaClient } from '@prisma/client';

declare module 'express' {
  interface Request {
    container?: {
      cradle: {
        prisma: PrismaClient;
         redis: RedisClientType;
        // add other injected dependencies here if needed
      };
    };
    id?: string;
  }
}
