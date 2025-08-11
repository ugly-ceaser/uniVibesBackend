import Redis from 'ioredis';
import { env } from './env';

export const createRedisClient = () => {
  const client = new Redis(env.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: null
  });
  return client;
}; 