import Redis from 'ioredis';
import { env } from './env';

export const createRedisClient = () => {
  const isUpstash = env.redisUrl.startsWith('rediss://');

  const client = new Redis(env.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true, // Allow queuing commands/connecting rather than throwing immediately
    connectTimeout: 5000,
    ...(isUpstash ? { tls: {} } : {}) // enable TLS only if using Upstash
  });

  client.on('error', (err) => {
    // Gracefully catch and log redis connection or command errors
    console.warn('⚠️ Redis connection error:', err.message);
  });

  return client;
};
