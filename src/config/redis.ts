import Redis from 'ioredis';
import { env } from './env';

export const createRedisClient = () => {
  const isUpstash = env.redisUrl.startsWith('rediss://');

  const client = new Redis(env.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    ...(isUpstash ? { tls: {} } : {}) // enable TLS only if using Upstash
  });

  return client;
};
